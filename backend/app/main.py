from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, Any
import logging

from .models import StrokePredictionRequest, StrokePredictionResponse
from .inference import StrokePredictor


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="Stroke Prediction API",
    description="API for predicting stroke risk based on patient health data",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


predictor = StrokePredictor()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Stroke Prediction API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": predictor.is_model_loaded()}

@app.post("/predict", response_model=StrokePredictionResponse)
async def predict_stroke(request: StrokePredictionRequest):
    """Predict stroke risk based on patient data"""
    try:
        prediction = predictor.predict(request.dict())
        return StrokePredictionResponse(
            prediction=prediction["prediction"],
            probability=prediction["probability"],
            risk_level=prediction["risk_level"]
        )
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
