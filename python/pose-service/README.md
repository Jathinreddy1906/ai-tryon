# TRYVORA Pose Preparation Service

This FastAPI service provides pose readiness assessment only. It does not generate virtual try-on images.

## Setup

```powershell
cd python/pose-service
py -m pip install -r requirements.txt
py scripts/download_pose_model.py
py -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Set `TRYVORA_POSE_MODEL_PATH` to override the model location. The default is `python/pose-service/models/pose_landmarker.task`. Set a long random `TRYVORA_POSE_SERVICE_KEY`; the Next.js server must use the same value.

Endpoints:

- `GET /health`
- `POST /v1/pose/readiness` with multipart field `file`

No pose model, no inference, and no recorded try-on result is available until the asset is downloaded and the service is configured. Keep the service behind authenticated infrastructure in deployment and do not expose internal service keys to browser code.
