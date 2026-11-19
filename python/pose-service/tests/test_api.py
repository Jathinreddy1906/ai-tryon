from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_unconfigured_model_without_fabricated_inference():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["poseModelConfigured"] is False
    assert payload["inferenceEnabled"] is False


def test_pose_readiness_requires_service_key(monkeypatch):
    monkeypatch.delenv("TRYVORA_POSE_SERVICE_KEY", raising=False)
    response = client.post(
        "/v1/pose/readiness",
        files={"file": ("photo.jpg", b"not-used-without-model", "image/jpeg")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Pose service authentication is not configured."


def test_pose_readiness_is_explicitly_unavailable_without_model(monkeypatch):
    monkeypatch.setenv("TRYVORA_POSE_SERVICE_KEY", "test-service-key")
    response = client.post(
        "/v1/pose/readiness",
        headers={"x-tryvora-key": "test-service-key"},
        files={"file": ("photo.jpg", b"not-used-without-model", "image/jpeg")},
    )

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "unavailable"
    assert payload["ready"] is False
    assert payload["inferenceEnabled"] is False
