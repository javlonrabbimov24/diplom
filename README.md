# CyberShield - Web Application Security Scanner

CyberShield is a comprehensive web application security scanning tool that helps you identify security vulnerabilities in your web applications. It features an intuitive web interface and provides detailed reports with AI-powered analysis.

## Features

- Scan websites for security vulnerabilities
- Asynchronous scanning to handle multiple requests
- AI-powered analysis of scan results using Google's Gemini API
- Detailed reports with security scores and recommendations
- Export reports in PDF and JSON formats
- User authentication and scan history

## Prerequisites

- Docker and Docker Compose
- Google Gemini API key

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cybershield.git
   cd cybershield
   ```

2. Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_jwt_secret_here
   ```

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Access the web interface at:
   ```
   http://localhost:3000
   ```

## Usage

1. Register or login to your account
2. Enter a URL to scan on the dashboard
3. View scan results in real-time
4. Analyze detailed reports with AI-generated recommendations
5. Export reports as PDF if needed

## Architecture

The application consists of:

- Frontend (React.js)
- Backend API (Flask)
- MongoDB for data storage
- Redis for job queue
- Integration with Google Gemini API for analysis

## Development

To run the application in development mode:

```
# Start the backend
cd backend
pip install -r requirements.txt
python app.py

# Start the frontend
cd frontend
npm install
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 