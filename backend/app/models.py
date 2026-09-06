from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime, timezone

class Gender(str, Enum):
    male = "Male"
    female = "Female"

class WorkType(str, Enum):
    private = "Private"
    self_employed = "Self-employed"
    govt_job = "Govt_job"
    children = "children"
    never_worked = "Never_worked"

class ResidenceType(str, Enum):
    urban = "Urban"
    rural = "Rural"

class SmokingStatus(str, Enum):
    formerly_smoked = "formerly smoked"
    never_smoked = "never smoked"
    smokes = "smokes"
    unknown = "Unknown"

class StrokePredictionRequest(BaseModel):
    """Request schema for stroke prediction"""
    gender: Gender = Field(..., description="Gender of the patient")
    age: float = Field(..., ge=0, le=120, description="Age in years (0 - 120)")
    hypertension: int = Field(..., ge=0, le=1, description="0 = No hypertension, 1 = Hypertension")
    heart_disease: int = Field(..., ge=0, le=1, description="0 = No heart disease, 1 = Heart disease")
    ever_married: int = Field(..., ge=0, le=1, description="0 = No, 1 = Yes")
    work_type: WorkType = Field(..., description="Type of employment")
    residence_type: ResidenceType = Field(..., description="Living area: Urban or Rural")
    avg_glucose_level: float = Field(..., ge=0, description="Average blood glucose level (mg/dL)")
    bmi: float = Field(..., ge=0, description="Body Mass Index (kg/m²)")
    smoking_status: SmokingStatus = Field(..., description="Patient smoking status")

    model_config = {
        "json_schema_extra": {
            "example": {
                "gender": "Male",
                "age": 67.0,
                "hypertension": 0,
                "heart_disease": 1,
                "ever_married": 1,
                "work_type": "Private",
                "residence_type": "Urban",
                "avg_glucose_level": 228.69,
                "bmi": 36.6,
                "smoking_status": "formerly smoked"
            }
        }
    }

class StrokePredictionResponse(BaseModel):
    """Response schema for stroke prediction"""
    prediction: int = Field(..., description="0 = Low risk / No stroke predicted, 1 = Elevated stroke risk")
    probability: float = Field(..., ge=0, le=1, description="Estimated probability of stroke risk (0.0 to 1.0)")
    risk_level: str = Field(..., description="Categorical risk level: Low, Medium, High")
    risk_factors: List[str] = Field(default_factory=list, description="Primary detected clinical risk factors")
    recommendations: List[str] = Field(default_factory=list, description="Preventative and clinical action recommendations")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of prediction")

    model_config = {
        "json_schema_extra": {
            "example": {
                "prediction": 1,
                "probability": 0.78,
                "risk_level": "High",
                "risk_factors": [
                    "Age 65+ is a primary demographic risk driver",
                    "Elevated blood glucose (>200 mg/dL indicates hyperglycemia / diabetes risk)",
                    "Pre-existing heart disease history",
                    "BMI ≥ 30 classified as Class I/II Obesity"
                ],
                "recommendations": [
                    "Urgent comprehensive cardiovascular evaluation recommended",
                    "Tight glycemic management and HbA1c screening",
                    "Continuous blood pressure monitoring and lipid profiling",
                    "Supervised physical activity and nutritional lifestyle counseling"
                ],
                "timestamp": "2026-09-06T15:00:00Z"
            }
        }
    }
