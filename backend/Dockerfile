FROM python:3.9-slim

WORKDIR /app

# Install required system dependencies including wkhtmltopdf
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    curl \
    nmap \
    wkhtmltopdf \
    xvfb \
    docker.io \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up virtual display for wkhtmltopdf
ENV QT_QPA_PLATFORM=offscreen

# Copy requirements first to leverage Docker cache
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create directories
RUN mkdir -p ./reports/zap && mkdir -p ./reports/nmap && mkdir -p ./templates

# Copy application code
COPY api/ ./api/
COPY utils/ ./utils/
COPY templates/ ./templates/
COPY app.py ./
COPY .env ./

# Fix permissions
RUN chmod -R 755 ./

EXPOSE 5000

CMD ["python", "app.py"]