# 🧠 Stroke Prediction App

[![Python](https://img.shields.io/badge/python-3.11-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-%23ff9900.svg?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A **full-stack Machine Learning application** that predicts **stroke risk** based on patient health data.

Built with:
- **FastAPI** backend API
- Interactive **HTML/CSS/JS** frontend with animated gradients & Lottie animations
- Docker containerization
- AWS Elastic Beanstalk and S3 cloud deployment

---

## 📂 Project Structure

stroke_prediction_app/
├── backend/ # FastAPI backend & ML model
│ ├── app/ # API source code
│ ├── model/ # ML model file (model.pkl)
│ ├── requirements.txt
│ ├── Dockerfile
│ ├── .env # Local environment variables (not committed)
│ ├── .gitignore
│ └── README.md # Backend docs
│
├── frontend/ # Responsive HTML/CSS/JS frontend
│ ├── index.html
│ ├── styles.css
│ ├── script.js
│ ├── assets/ # Images, Lottie animations
│ └── README.md # Frontend docs
│
└── README.md # This file

text

---

## ✨ Features

- **Machine Learning Model**: Random Forest classification predicting stroke risk
- **Backend API**: FastAPI endpoints `/predict` and `/health` with CORS enabled
- **Responsive Frontend**: Modern UI with animated gradients and Lottie animations
- **Containerized Deployment**: Docker support for easy AWS deployment
- **Cloud Ready**: Deployment instructions for AWS Elastic Beanstalk and S3
- **Secure & Scalable**: Production-ready setup with health checks and environment configs

---

## 🛠 Tech Stack

**Frontend**
- HTML5, CSS3, Vanilla JavaScript
- Lottie animations from LottieFiles
- Animated CSS gradients & glassmorphism design

**Backend**
- Python 3.11, FastAPI, Uvicorn, Pydantic
- scikit-learn, numpy, pandas

**Deployment**
- Docker containerization
- AWS Elastic Beanstalk (backend)
- AWS S3 + CloudFront (frontend hosting)

---

## 🚀 Local Development Guide

### Clone repo

git clone https://github.com/yourusername/stroke_prediction_app.git
cd stroke_prediction_app

text

### Backend setup

cd backend
python -m venv .venv
source .venv/bin/activate # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload # Runs backend at http://127.0.0.1:8000

text

### Frontend setup

- Open `frontend/index.html` in a browser directly  
**OR**  
- Serve with a simple HTTP server:

cd frontend
python -m http.server 8080 # Runs frontend at http://127.0.0.1:8080

text

---

## 🌐 API Documentation

FastAPI includes interactive docs:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Endpoints

- `GET /health`: Returns API status  
- `POST /predict`: Accepts patient data and returns stroke prediction

Example request body for `/predict`:

{
"gender": 0,
"age": 45.0,
"hypertension": 0,
"heart_disease": 0,
"ever_married": 1,
"work_type": 3,
"Residence_type": 1,
"avg_glucose_level": 95.5,
"bmi": 28.1,
"smoking_status": 1
}

text

Example response:

{
"stroke": 0
}

text

---

## ⚙️ Environment Variables

Place this in `backend/.env` for local development (do not commit real secrets):

MODEL_PATH=./model/model.pkl
ALLOWED_ORIGINS=*
PORT=8000

text

---

## ☁ AWS Deployment Instructions

### Backend: Elastic Beanstalk with Docker

1. Ensure AWS EB CLI installed:

pip install awsebcli

text

2. Initialize EB environment in backend folder:

cd backend
eb init -p docker stroke-prediction-app

text

3. Create environment and deploy:

eb create stroke-backend-env
eb deploy

text

4. Open your deployed backend API URL:

eb open

text

### Frontend: AWS S3 Static Website

1. Create an S3 bucket, enable static website hosting.  
2. Upload frontend files (`index.html`, `styles.css`, `script.js`, `assets/`).  
3. Update `frontend/script.js` to point `API_BASE_URL` to your Elastic Beanstalk backend URL.  
4. Make files public or serve with CloudFront for HTTPS.

---

## 📸 Screenshots / Demo

*(Add screenshots or GIFs here to showcase your UI and predictions)*

---

## 📜 License

MIT License © 2025 Your Name.

---

## 👨‍💻 Author

**Your Name**  
- GitHub: [yourusername](https://github.com/yourusername)  
- LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)