from flask import Flask, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__, 
            static_folder='../frontend/assets',
            template_folder='../frontend/templates')

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour
jwt = JWTManager(app)

# Oddiy CORS konfiguratsiyasi - barcha so'rovlarni qabul qiladi
CORS(app, supports_credentials=True)

# Import and register blueprints
from api.auth import auth_bp
from api.scan_api import scan_bp
from api.report_api import report_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(scan_bp, url_prefix='/api/scan')
app.register_blueprint(report_bp, url_prefix='/api/report')

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/report/<report_id>')
def view_report(report_id):
    return render_template('report.html', report_id=report_id)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)