FROM python:3.9-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev nmap && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Create reports directory
RUN mkdir -p /app/reports/zap /app/reports/nmap

# Copy API files
COPY . /app/

# Fix permissions
RUN chmod -R 755 /app

EXPOSE 8080

CMD ["python", "app.py"] 