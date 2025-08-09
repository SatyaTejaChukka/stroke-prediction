# Use Python 3.11 slim image
FROM python:3.11-slim-bullseye

# Install minimal deps (no upgrade)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only requirements for dependency caching
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code (includes model/)
COPY backend/ ./backend/

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Optional: healthcheck (requires /health endpoint in app)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:8000/health || exit 1

# Run FastAPI with uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
