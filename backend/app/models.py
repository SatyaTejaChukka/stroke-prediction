from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

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
    age: float = Field(..., ge=0, le=120, description="Age in years")
    hypertension: int = Field(..., ge=0, le=1, description="0 = No, 1 = Yes")
    heart_disease: int = Field(..., ge=0, le=1, description="0 = No, 1 = Yes")
    ever_married: int = Field(..., ge=0, le=1, description="0 = No, 1 = Yes")
    work_type: WorkType = Field(..., description="Type of work")
    residence_type: ResidenceType = Field(..., description="Type of residence")
    avg_glucose_level: float = Field(..., ge=0, description="Average glucose level in blood")
    bmi: float = Field(..., ge=0, description="Body mass index")
    smoking_status: SmokingStatus = Field(..., description="Smoking status")

class StrokePredictionResponse(BaseModel):
    """Response schema for stroke prediction"""
    prediction: int = Field(..., description="0 = No stroke risk, 1 = Stroke risk")
    probability: float = Field(..., ge=0, le=1, description="Probability of stroke")
    risk_level: str = Field(..., description="Risk level: Low, Medium, High")
