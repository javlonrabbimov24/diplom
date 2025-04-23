#!/bin/bash

# CyberShield Setup Script
echo "CyberShield - Xavfsizlik skaneri o'rnatish skripti"
echo "------------------------------------------------"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker topilmadi. Iltimos, avval Docker o'rnating."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose topilmadi. Iltimos, avval Docker Compose o'rnating."
    exit 1
fi

# Create necessary directories
echo "Kerakli jildlarni yaratish..."
mkdir -p backend/reports/zap
mkdir -p backend/reports/nmap
mkdir -p backend/templates

# Check for environment variables
if [ ! -f .env ]; then
    echo "Environment faylini yaratish..."
    cat > .env << EOL
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret-key
TARGET_URL=example.com
EOL
    echo ".env fayli yaratildi. Iltimos, Gemini API kalit va JWT secret kalitni sozlang."
fi

# Build and start the containers
echo "Docker container'larni ishga tushirish..."
docker-compose up -d

# Wait for services to start
echo "Xizmatlar ishga tushishi kutilmoqda..."
sleep 10

# Display success message and URLs
echo "------------------------------------------------"
echo "CyberShield muvaffaqiyatli o'rnatildi!"
echo "Frontend URL: http://localhost:3001"
echo "Backend API URL: http://localhost:5001"
echo "------------------------------------------------"
echo "Tizimdan foydalanish uchun o'z brauzeringizda http://localhost:3001 manzilini oching."
echo "------------------------------------------------"
echo "ZAP Scanner: http://localhost:9090/zap/"
echo "------------------------------------------------"
echo "Xizmatni to'xtatish uchun 'docker-compose down' buyrug'ini ishga tushiring." 