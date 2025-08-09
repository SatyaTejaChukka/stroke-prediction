# Stroke Prediction Backend

FastAPI backend for stroke prediction using machine learning.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Place your trained model file in `model/model.pkl`

3. Run the server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

- `GET /`: Root endpoint
- `GET /health`: Health check
- `POST /predict`: Predict stroke risk

## Docker

Build and run with Docker:
```bash
docker build -t stroke-prediction-backend .
docker run -p 8000:8000 stroke-prediction-backend
