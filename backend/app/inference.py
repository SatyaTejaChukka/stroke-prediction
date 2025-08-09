import pickle
import numpy as np
import pandas as pd
import os
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class StrokePredictor:
    """Stroke prediction model wrapper"""
    
    def __init__(self):
        self.model = None
        self.feature_columns = [
            'gender', 'age', 'hypertension', 'heart_disease', 'ever_married',
            'work_type', 'residence_type', 'avg_glucose_level', 'bmi', 'smoking_status'
        ]
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'model.pkl')
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.model = None
    
    def is_model_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None
    
    def preprocess_data(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess input data for prediction"""
        
        df = pd.DataFrame([data])
        
        
        df['gender'] = 1 if df['gender'].iloc[0] == 'Male' else 0
        
        
        work_type_map = {
            'Private': 0, 'Self-employed': 1, 'Govt_job': 2,
            'children': 3, 'Never_worked': 4
        }
        df['work_type'] = work_type_map.get(df['work_type'].iloc[0], 0)
        
        
        df['residence_type'] = 1 if df['residence_type'].iloc[0] == 'Urban' else 0
        
        
        smoking_map = {
            'formerly smoked': 1, 'never smoked': 2, 'smokes': 3, 'Unknown': 0
        }
        df['smoking_status'] = smoking_map.get(df['smoking_status'].iloc[0], 0)
        
        return df[self.feature_columns]
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction"""
        if not self.is_model_loaded():
            raise Exception("Model not loaded")
        
        
        processed_data = self.preprocess_data(data)
        
        
        prediction = self.model.predict(processed_data)[0]
        probability = self.model.predict_proba(processed_data)[0]
        
        
        stroke_prob = probability[1] if len(probability) > 1 else probability[0]
        
        if stroke_prob < 0.3:
            risk_level = "Low"
        elif stroke_prob < 0.7:
            risk_level = "Medium"
        else:
            risk_level = "High"
        
        return {
            "prediction": int(prediction),
            "probability": float(stroke_prob),
            "risk_level": risk_level
        }
