from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import time
import logging
from typing import Dict, Any, List

from .models import StrokePredictionRequest, StrokePredictionResponse
from .inference import StrokePredictor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("stroke-prediction-api")

START_TIME = time.time()

app = FastAPI(
    title="Stroke Prediction AI API",
    description="Machine Learning clinical diagnostic API predicting stroke probability and cardiovascular risk.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Determine allowed origins from environment
env_origins = os.getenv("ALLOWED_ORIGINS", "*").strip()
if env_origins == "*":
    origins_list = ["*"]
else:
    origins_list = [o.strip() for o in env_origins.split(",") if o.strip()]

# When origins is wildcard '*', Starlette does not allow allow_credentials=True
allow_creds = False if origins_list == ["*"] else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = StrokePredictor()

@app.get("/", tags=["General"])
async def root():
    """Root metadata endpoint with system information and API endpoints"""
    uptime_seconds = int(time.time() - START_TIME)
    return {
        "name": "Stroke Prediction API",
        "status": "online",
        "version": "2.0.0",
        "description": "AI-powered clinical assessment API for stroke risk prediction",
        "uptime_seconds": uptime_seconds,
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "docs": "/docs"
        },
        "model_loaded": predictor.is_model_loaded()
    }

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint used by Render, monitoring tools, and frontend status checks"""
    is_ready = predictor.is_model_loaded()
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    
    payload = {
        "status": "healthy" if is_ready else "unhealthy",
        "model_loaded": is_ready,
        "uptime_seconds": int(time.time() - START_TIME),
        "environment": os.getenv("RENDER_SERVICE_NAME", "development"),
        "python_env": os.getenv("PYTHON_VERSION", "3.11")
    }
    return JSONResponse(status_code=status_code, content=payload)

@app.post("/predict", response_model=StrokePredictionResponse, tags=["Inference"])
async def predict_stroke(request: StrokePredictionRequest):
    """Predict stroke risk based on patient health data and return risk factors with recommendations"""
    try:
        # Pydantic v2 modern model dump
        input_data = request.model_dump()
        prediction_result = predictor.predict(input_data)
        return StrokePredictionResponse(**prediction_result)
    except RuntimeError as re:
        logger.error(f"Inference runtime error: {str(re)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re)
        )
    except Exception as e:
        logger.exception("Unexpected error during stroke prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
