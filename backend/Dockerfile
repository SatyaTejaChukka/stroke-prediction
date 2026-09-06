# Use Python 3.11 slim image
FROM python:3.11-slim

# Install minimal build & health dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install dependencies with cache optimization
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and trained ML model
COPY app/ ./app/
COPY model/ ./model/

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose default port
EXPOSE 8000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start FastAPI using Uvicorn with dynamic PORT support for Render and cloud hosts
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
