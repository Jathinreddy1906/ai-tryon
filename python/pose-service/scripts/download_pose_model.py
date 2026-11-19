from pathlib import Path
from urllib.request import urlretrieve


MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
)
MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "pose_landmarker.task"


def main():
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.is_file():
        print(f"Pose model already exists: {MODEL_PATH}")
        return
    print(f"Downloading pose model to {MODEL_PATH}...")
    urlretrieve(MODEL_URL, MODEL_PATH)
    print("Download complete.")


if __name__ == "__main__":
    main()
