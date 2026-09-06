import pickle
import numpy as np
import pandas as pd
import os
from datetime import datetime, timezone
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Feature ranges from the Kaggle stroke training dataset (healthcare-dataset-stroke-data)
# used when fitting MinMaxScaler during model training
SCALER_PARAMS = {
    'gender': {'min': 0.0, 'max': 2.0},
    'age': {'min': 0.08, 'max': 82.0},
    'hypertension': {'min': 0.0, 'max': 1.0},
    'heart_disease': {'min': 0.0, 'max': 1.0},
    'ever_married': {'min': 0.0, 'max': 1.0},
    'work_type': {'min': 0.0, 'max': 4.0},
    'residence_type': {'min': 0.0, 'max': 1.0},
    'avg_glucose_level': {'min': 55.12, 'max': 271.74},
    'bmi': {'min': 10.3, 'max': 97.6},
    'smoking_status': {'min': 0.0, 'max': 3.0}
}

class StrokePredictor:
    """Stroke prediction model wrapper with calibrated preprocessing,

    MinMaxScaler transforms, and explainable clinical risk reporting.
    """
    
    def __init__(self):
        self.model = None
        self.feature_columns = [
            'gender', 'age', 'hypertension', 'heart_disease', 'ever_married',
            'work_type', 'residence_type', 'avg_glucose_level', 'bmi', 'smoking_status'
        ]
        self.load_model()
    
    def load_model(self):
        """Load the trained Random Forest model"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'model.pkl')
            model_path = os.path.abspath(model_path)
            if not os.path.exists(model_path):
                logger.error(f"Model file not found at: {model_path}")
                self.model = None
                return

            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            logger.info(f"Model loaded successfully from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.model = None
    
    def is_model_loaded(self) -> bool:
        """Check if model is loaded and ready for inference"""
        return self.model is not None

    def _scale(self, val: float, feature: str) -> float:
        """Scale value according to training MinMaxScaler bounds, clipped to [0, 1]"""
        params = SCALER_PARAMS[feature]
        span = params['max'] - params['min']
        if span == 0:
            return 0.0
        scaled = (val - params['min']) / span
        return float(np.clip(scaled, 0.0, 1.0))
    
    def preprocess_data(self, data: Dict[str, Any]) -> np.ndarray:
        """Preprocess and scale input dictionary matching the exact training encoding and MinMaxScaler:

        gender: Male=0, Female=1, Other=2
        ever_married: No=0, Yes=1
        work_type: children=0, Govt_job=1, Never_worked=2, Private=3, Self-employed=4
        residence_type: Rural=0, Urban=1
        smoking_status: formerly smoked=0, never smoked=1, smokes=2, Unknown=3
        """
        # Categorical encodings as trained in notebooks/stroke_prediction.ipynb
        gender_raw = str(data.get('gender', 'Male')).capitalize()
        gender_num = 0 if gender_raw == 'Male' else (1 if gender_raw == 'Female' else 2)

        work_type_map = {
            'children': 0,
            'govt_job': 1,
            'never_worked': 2,
            'private': 3,
            'self-employed': 4
        }
        work_raw = str(data.get('work_type', 'private')).lower()
        work_num = work_type_map.get(work_raw, 3)

        residence_raw = str(data.get('residence_type', 'Urban')).capitalize()
        residence_num = 1 if residence_raw == 'Urban' else 0

        smoking_map = {
            'formerly smoked': 0,
            'never smoked': 1,
            'smokes': 2,
            'unknown': 3
        }
        smoking_raw = str(data.get('smoking_status', 'never smoked')).lower()
        smoking_num = smoking_map.get(smoking_raw, 1)

        age = float(data.get('age', 45.0))
        hypertension = 1 if int(data.get('hypertension', 0)) == 1 else 0
        heart_disease = 1 if int(data.get('heart_disease', 0)) == 1 else 0
        ever_married = 1 if int(data.get('ever_married', 0)) == 1 else 0
        avg_glucose = float(data.get('avg_glucose_level', 90.0))
        bmi = float(data.get('bmi', 25.0))

        # Scale features using MinMaxScaler formulas
        features_scaled = [
            self._scale(gender_num, 'gender'),
            self._scale(age, 'age'),
            self._scale(hypertension, 'hypertension'),
            self._scale(heart_disease, 'heart_disease'),
            self._scale(ever_married, 'ever_married'),
            self._scale(work_num, 'work_type'),
            self._scale(residence_num, 'residence_type'),
            self._scale(avg_glucose, 'avg_glucose_level'),
            self._scale(bmi, 'bmi'),
            self._scale(smoking_num, 'smoking_status')
        ]

        return np.array([features_scaled], dtype=np.float64)

    def _analyze_risk_factors(self, data: Dict[str, Any], stroke_prob: float) -> List[str]:
        """Identify primary clinical risk drivers from patient parameters"""
        factors = []
        age = float(data.get('age', 0))
        glucose = float(data.get('avg_glucose_level', 0))
        bmi = float(data.get('bmi', 0))
        hypertension = int(data.get('hypertension', 0))
        heart_disease = int(data.get('heart_disease', 0))
        smoking = str(data.get('smoking_status', '')).lower()

        if age >= 65:
            factors.append(f"Patient age ({int(age)} yrs) is a dominant clinical risk multiplier (risk doubles every decade after 55)")
        elif age >= 50:
            factors.append(f"Age tier ({int(age)} yrs) indicates escalating vascular vulnerability")

        if glucose >= 200:
            factors.append(f"Markedly high blood glucose ({glucose:.1f} mg/dL) indicates severe hyperglycemia/diabetes risk")
        elif glucose >= 140:
            factors.append(f"Elevated blood glucose ({glucose:.1f} mg/dL) falls in prediabetic/impaired fasting range")

        if hypertension == 1:
            factors.append("Diagnosed hypertension (arterial hypertension is the single most modifiable stroke risk factor)")

        if heart_disease == 1:
            factors.append("Pre-existing heart disease history (elevates risk of embolic/cardioembolic stroke)")

        if bmi >= 30:
            factors.append(f"BMI of {bmi:.1f} kg/m² corresponds to clinical obesity, contributing to metabolic syndrome")
        elif bmi >= 25:
            factors.append(f"BMI of {bmi:.1f} kg/m² falls within the overweight range")

        if smoking == 'smokes':
            factors.append("Active cigarette smoking promotes endothelial damage, thrombosis, and arterial stiffening")
        elif smoking == 'formerly smoked':
            factors.append("Past smoking history remains a relevant cardiovascular consideration")

        if not factors:
            factors.append("Vital metrics, blood glucose, and BMI fall within typical non-elevated reference ranges")

        return factors

    def _generate_recommendations(self, risk_level: str, risk_factors: List[str]) -> List[str]:
        """Generate targeted clinical action recommendations"""
        if risk_level == "High":
            return [
                "Promptly schedule a comprehensive cardiovascular and neurological evaluation with a physician.",
                "Target strict arterial blood pressure control (standard guideline: < 130/80 mmHg or as prescribed).",
                "Conduct comprehensive laboratory diagnostics: fasting plasma glucose, HbA1c, and complete lipid profile.",
                "Inquire with your physician regarding antiplatelet therapy and carotid artery duplex sonography.",
                "Review the FAST mnemonic with household members: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services."
            ]
        elif risk_level == "Medium":
            return [
                "Schedule a routine primary care check-up to assess cardiovascular risk metrics.",
                "Monitor resting blood pressure at home weekly and maintain a recorded health log.",
                "Adopt dietary cardioprotective measures: DASH/Mediterranean diet, sodium restriction (< 2,300 mg/day).",
                "Engage in at least 150 minutes of moderate-intensity aerobic exercise weekly (brisk walking, cycling, swimming).",
                "Maintain smoking cessation support and limit alcohol consumption."
            ]
        else:
            return [
                "Maintain current healthy cardiovascular routines with balanced whole-food nutrition and regular physical activity.",
                "Continue annual wellness checkups including routine blood pressure and glucose screenings.",
                "Maintain optimal hydration, sleep quality (7-8 hours nightly), and stress reduction practices.",
                "Remain mindful of common stroke warning symptoms (FAST protocol) for general health vigilance."
            ]

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Run calibrated ML inference and generate clinical risk report"""
        if not self.is_model_loaded():
            raise RuntimeError("Model is not loaded. Please ensure backend/model/model.pkl exists and is valid.")
        
        # Preprocess and scale matching training distribution
        features_array = self.preprocess_data(data)
        
        prediction = self.model.predict(features_array)[0]
        probabilities = self.model.predict_proba(features_array)[0]
        
        # Stroke probability is class 1 (stroke)
        stroke_prob = float(probabilities[1] if len(probabilities) > 1 else probabilities[0])
        
        # Clinical risk categorization
        if stroke_prob < 0.25:
            risk_level = "Low"
        elif stroke_prob < 0.55:
            risk_level = "Medium"
        else:
            risk_level = "High"
        
        risk_factors = self._analyze_risk_factors(data, stroke_prob)
        recommendations = self._generate_recommendations(risk_level, risk_factors)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        return {
            "prediction": int(prediction),
            "probability": round(stroke_prob, 4),
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "timestamp": now_iso
        }
