import pytest
import sys
import os
from fastapi.testclient import TestClient

# Ensure backend folder is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Verify root endpoint returns API metadata"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["name"] == "Stroke Prediction API"
    assert "endpoints" in data
    assert data["model_loaded"] is True

def test_health_endpoint():
    """Verify health check endpoint returns 200 and model status"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "uptime_seconds" in data

def test_predict_low_risk_profile():
    """Verify prediction for young, healthy profile"""
    payload = {
        "gender": "Female",
        "age": 22.0,
        "hypertension": 0,
        "heart_disease": 0,
        "ever_married": 0,
        "work_type": "Private",
        "residence_type": "Urban",
        "avg_glucose_level": 82.0,
        "bmi": 21.5,
        "smoking_status": "never smoked"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == 0
    assert data["probability"] < 0.20  # Calibrated model produces ~0.05
    assert data["risk_level"] == "Low"
    assert len(data["risk_factors"]) > 0
    assert len(data["recommendations"]) > 0
    assert "timestamp" in data

def test_predict_high_risk_profile():
    """Verify prediction for elderly profile with comorbidities"""
    payload = {
        "gender": "Male",
        "age": 78.0,
        "hypertension": 1,
        "heart_disease": 1,
        "ever_married": 1,
        "work_type": "Self-employed",
        "residence_type": "Urban",
        "avg_glucose_level": 240.5,
        "bmi": 38.2,
        "smoking_status": "smokes"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "probability" in data
    assert data["probability"] > 0.50  # Calibrated model produces ~0.72
    assert data["risk_level"] in ["Medium", "High"]
    assert any("age" in f.lower() for f in data["risk_factors"])
    assert any("hypertension" in f.lower() for f in data["risk_factors"])
    assert len(data["recommendations"]) > 0

def test_predict_validation_error():
    """Verify validation failure on invalid input"""
    payload = {
        "gender": "Male",
        "age": -10.0,
        "hypertension": 5,
        "heart_disease": 0,
        "ever_married": 1,
        "work_type": "Private",
        "residence_type": "Urban",
        "avg_glucose_level": 90.0,
        "bmi": 24.0,
        "smoking_status": "never smoked"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_cors_preflight_or_origin():
    """Verify CORS response headers permit Vercel origin"""
    headers = {
        "Origin": "https://stroke-prediction-app.vercel.app"
    }
    response = client.get("/", headers=headers)
    assert response.status_code == 200
    allow_origin = response.headers.get("access-control-allow-origin")
    assert allow_origin in ["*", "https://stroke-prediction-app.vercel.app"]
