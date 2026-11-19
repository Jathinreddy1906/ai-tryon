from contextlib import asynccontextmanager
from io import BytesIO
import os
from pathlib import Path
import secrets
from typing import Literal

import numpy as np
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

try:
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import (
        PoseLandmarker,
        PoseLandmarkerOptions,
        RunningMode,
    )
except ImportError:
    mp = None
    BaseOptions = None
    PoseLandmarker = None
    PoseLandmarkerOptions = None
    RunningMode = None
MODEL_PATH = Path(
    os.getenv(
        "TRYVORA_POSE_MODEL_PATH",
        str(Path(__file__).resolve().parents[1] / "models" / "pose_landmarker.task"),
    )
)
MAX_BYTES = 10 * 1024 * 1024
MIN_DIMENSION = 256
MAX_DIMENSION = 8192


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    poseModelConfigured: bool
    inferenceEnabled: bool = False


class ReadinessResponse(BaseModel):
    ready: bool
    status: Literal["ready", "not_ready", "unavailable"]
    confidence: float
    reasons: list[str]
    inferenceEnabled: bool = False


def create_landmarker():
    if not MODEL_PATH.is_file() or PoseLandmarker is None:
        return None

    try:
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(MODEL_PATH)),
            running_mode=RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        return PoseLandmarker.create_from_options(options)
    except Exception as error:
        print(f"Pose landmarker could not load: {type(error).__name__}: {error}")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pose_landmarker = create_landmarker()
    yield
    landmarker = getattr(app.state, "pose_landmarker", None)
    if landmarker is not None:
        landmarker.close()


app = FastAPI(
    title="TRYVORA Pose Preparation Service",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
async def health():
    configured = (
        getattr(app.state, "pose_landmarker", None) is not None
    )
    return HealthResponse(
        status="ok" if configured else "degraded",
        poseModelConfigured=configured,
        inferenceEnabled=False,
    )


@app.post("/v1/pose/readiness", response_model=ReadinessResponse)
async def assess_readiness(
    file: UploadFile = File(...),
    x_tryvora_key: str | None = Header(default=None),
):
    configured_key = os.getenv("TRYVORA_POSE_SERVICE_KEY")
    if not configured_key:
        raise HTTPException(
            status_code=503,
            detail="Pose service authentication is not configured.",
        )
    if not x_tryvora_key or not secrets.compare_digest(x_tryvora_key, configured_key):
        raise HTTPException(status_code=401, detail="Invalid pose service credentials.")
    landmarker = getattr(app.state, "pose_landmarker", None)
    if landmarker is None:
        return JSONResponse(
            status_code=503,
            content={
                "ready": False,
                "status": "unavailable",
                "confidence": 0,
                "reasons": [
                    "Pose model is not configured on this service.",
                    "AI try-on remains disabled.",
                ],
                "inferenceEnabled": False,
            },
        )

    content_type = (file.content_type or "").lower()
    if content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=415,
            detail="Choose a JPG, PNG, or WebP image.",
        )

    payload = await file.read(MAX_BYTES + 1)
    if len(payload) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Choose an image no larger than 10 MB.")
    if not payload:
        raise HTTPException(status_code=400, detail="The selected image is empty.")

    try:
        pil_image = Image.open(BytesIO(payload))
        actual_format = (pil_image.format or "").lower()
        expected_format = {
            "image/jpeg": "jpeg",
            "image/png": "png",
            "image/webp": "webp",
        }[content_type]
        if actual_format != expected_format:
            raise HTTPException(status_code=415, detail="The file type does not match the image content.")
        pil_image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The image could not be decoded.")

    pil_image = Image.open(BytesIO(payload)).convert("RGB")
    width, height = pil_image.size
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        raise HTTPException(
            status_code=400,
            detail="Use a photo that is at least 256 pixels wide and tall.",
        )
    if width > MAX_DIMENSION or height > MAX_DIMENSION or width * height > 40_000_000:
        raise HTTPException(
            status_code=413,
            detail="The image dimensions are too large.",
        )

    image_array = np.asarray(pil_image)
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=image_array,
    )
    result = landmarker.detect(mp_image)

    if not result.pose_landmarks:
        return ReadinessResponse(
            ready=False,
            status="not_ready",
            confidence=0,
            reasons=[
                "A full person pose could not be detected.",
                "Use an unobstructed, front-facing full-body or upper-body photo.",
            ],
        )

    landmarks = result.pose_landmarks[0]
    return assess_pose_landmarks(landmarks)


def assess_pose_landmarks(landmarks) -> ReadinessResponse:
    index = {
        "nose": 0,
        "left_shoulder": 11,
        "right_shoulder": 12,
        "left_elbow": 13,
        "right_elbow": 14,
        "left_wrist": 15,
        "right_wrist": 16,
        "left_hip": 23,
        "right_hip": 24,
        "left_knee": 25,
        "right_knee": 26,
        "left_ankle": 27,
        "right_ankle": 28,
    }
    minimum_visibility = 0.55

    missing = [
        name
        for name, landmark_index in index.items()
        if getattr(landmarks[landmark_index], "visibility", 0) < minimum_visibility
    ]
    reasons = []
    if "left_wrist" in missing or "right_wrist" in missing:
        reasons.append("Keep both hands visible and away from the clothing area.")
    if any(name in missing for name in ("left_ankle", "right_ankle", "left_knee", "right_knee")):
        reasons.append("Use a full-length pose when possible.")
    if any(name in missing for name in ("left_shoulder", "right_shoulder", "left_hip", "right_hip")):
        reasons.append("Keep the shoulders and upper body clearly visible.")

    left_shoulder = landmarks[index["left_shoulder"]]
    right_shoulder = landmarks[index["right_shoulder"]]
    left_hip = landmarks[index["left_hip"]]
    right_hip = landmarks[index["right_hip"]]
    shoulder_width = abs(left_shoulder.x - right_shoulder.x)
    hip_width = abs(left_hip.x - right_hip.x)
    if shoulder_width < 0.12 or hip_width < 0.10:
        reasons.append("Turn toward the camera so your shoulders and hips are visible.")

    torso_height = abs(
        ((left_shoulder.y + right_shoulder.y) / 2)
        - ((left_hip.y + right_hip.y) / 2)
    )
    if torso_height < 0.10:
        reasons.append("Move back or stand further from the camera.")

    visible_count = len(index) - len(missing)
    confidence = round(max(0.0, min(1.0, visible_count / len(index))), 3)
    ready = not reasons
    return ReadinessResponse(
        ready=ready,
        status="ready" if ready else "not_ready",
        confidence=confidence,
        reasons=reasons or ["The pose appears unobstructed and suitable for future preprocessing."],
    )
