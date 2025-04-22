FROM python:3.9-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev curl nmap && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Create directories
RUN mkdir -p ./reports/zap && mkdir -p ./reports/nmap && mkdir -p ./reports/nikto

# Copy application code
COPY api/ ./api/
COPY core/ ./core/
COPY reports/ ./reports/
COPY utils/ ./utils/
COPY app.py ./
COPY .env ./

# Fix permissions
RUN chmod -R 755 ./

EXPOSE 5000

CMD ["python", "app.py"]