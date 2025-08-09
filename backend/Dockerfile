# Use Python 3.11 slim image
FROM python:3.11-slim

# Install minimal build dependencies (optional but safe)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source and model
COPY app/ ./app/
COPY model/ ./model/

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Optional: healthcheck
# HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:8000/health || exit 1

# Run FastAPI using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
