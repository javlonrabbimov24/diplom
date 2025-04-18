# scan routes
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
import re
import random
from datetime import datetime
import time

# In a real application, these would be database collections
scans = {}
scan_results = {}

scan_bp = Blueprint('scan', __name__)

def is_valid_url(url):
    """Check if a URL is valid."""
    pattern = re.compile(
        r'^(https?://)?' # http:// or https:// (optional)
        r'([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+' # domain
        r'[a-zA-Z]{2,}' # top-level domain
        r'(/[^/\s]*)*$' # path (optional)
    )
    return bool(pattern.match(url))

def generate_mock_vulnerabilities():
    """Generate mock vulnerability findings for demonstration."""
    vuln_types = [
        {"name": "SQL Injection", "severity": "high", "description": "Login sahifasida SQL injection zaiflik aniqlandi."},
        {"name": "Cross-Site Scripting (XSS)", "severity": "medium", "description": "Izohlar qoldirishga mo'ljallangan sahifada XSS zaiflik aniqlandi."},
        {"name": "Weak TLS Configuration", "severity": "medium", "description": "Zaif TLS konfiguratsiyasi aniqlandi."},
        {"name": "Cross-Site Request Forgery (CSRF)", "severity": "medium", "description": "CSRF himoyasi yo'qligi aniqlandi."},
        {"name": "Information Disclosure", "severity": "low", "description": "Server versiyasi va boshqa ma'lumotlar oshkor etilmoqda."},
        {"name": "Missing HTTP Security Headers", "severity": "low", "description": "Muhim HTTP xavfsizlik headerlari topilmadi."},
    ]
    
    # Select 3-6 random vulnerabilities
    num_vulns = random.randint(3, 6)
    selected_vulns = random.sample(vuln_types, num_vulns)
    
    return [
        {
            "id": str(uuid.uuid4()),
            "name": vuln["name"],
            "severity": vuln["severity"],
            "description": vuln["description"],
            "detected_at": datetime.now().isoformat()
        }
        for vuln in selected_vulns
    ]

@scan_bp.route('/start', methods=['POST'])
def start_scan():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('url'):
        return jsonify({"error": "URL kiritilishi shart"}), 400
    
    url = data['url']
    
    # Validate URL format
    if not is_valid_url(url):
        return jsonify({"error": "Noto'g'ri URL formati. Misol: https://example.uz"}), 400
    
    # Create scan ID
    scan_id = str(uuid.uuid4())
    
    # Create scan record
    scan = {
        'id': scan_id,
        'url': url,
        'status': 'in_progress',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'user_id': request.headers.get('X-User-ID', 'anonymous'),  # Authenticated user if available
    }
    
    scans[scan_id] = scan
    
    # In a real application, this would be done asynchronously
    # For demo, we'll simulate a scan delay
    return jsonify({
        "message": "Skanerlash boshlandi",
        "scan": {
            "id": scan_id,
            "url": url,
            "status": scan['status']
        }
    }), 202

@scan_bp.route('/status/<scan_id>', methods=['GET'])
def scan_status(scan_id):
    # Check if scan exists
    if scan_id not in scans:
        return jsonify({"error": "Skanerlash topilmadi"}), 404
    
    scan = scans[scan_id]
    
    # If scan is in progress, randomly complete it after a few checks
    if scan['status'] == 'in_progress' and random.random() < 0.3:
        scan['status'] = 'completed'
        scan['updated_at'] = datetime.now().isoformat()
        
        # Generate mock results
        vulnerabilities = generate_mock_vulnerabilities()
        
        # Count vulnerabilities by severity
        severity_counts = {"high": 0, "medium": 0, "low": 0}
        for vuln in vulnerabilities:
            severity_counts[vuln['severity']] += 1
        
        # Calculate security score (0-100)
        # Higher weights for more severe vulnerabilities
        total_score = 100 - (severity_counts['high'] * 15 + 
                             severity_counts['medium'] * 8 + 
                             severity_counts['low'] * 3)
        security_score = max(0, min(100, total_score))
        
        # Create result
        result = {
            'id': str(uuid.uuid4()),
            'scan_id': scan_id,
            'url': scan['url'],
            'vulnerabilities': vulnerabilities,
            'security_score': security_score,
            'severity_counts': severity_counts,
            'created_at': datetime.now().isoformat(),
            'server_info': {
                'server': 'Nginx 1.18.0',
                'os': 'Ubuntu Linux',
            }
        }
        
        scan_results[scan_id] = result
    
    return jsonify({
        "scan": {
            "id": scan_id,
            "url": scan['url'],
            "status": scan['status'],
            "created_at": scan['created_at'],
            "updated_at": scan['updated_at']
        }
    }), 200

@scan_bp.route('/result/<scan_id>', methods=['GET'])
def scan_result(scan_id):
    # Check if scan exists
    if scan_id not in scans:
        return jsonify({"error": "Skanerlash topilmadi"}), 404
    
    scan = scans[scan_id]
    
    # Check if scan is completed
    if scan['status'] != 'completed':
        return jsonify({"error": "Skanerlash hali yakunlanmagan"}), 400
    
    # Check if result exists
    if scan_id not in scan_results:
        return jsonify({"error": "Skanerlash natijasi topilmadi"}), 404
    
    result = scan_results[scan_id]
    
    return jsonify({
        "result": result
    }), 200

@scan_bp.route('/history', methods=['GET'])
@jwt_required(optional=True)
def scan_history():
    # Get user ID from token if available
    user_id = get_jwt_identity()
    
    if not user_id:
        # For anonymous users, return limited or no history
        return jsonify({
            "message": "Skanerlash tarixini ko'rish uchun tizimga kiring",
            "scans": []
        }), 200
    
    # Get user's scan history
    user_scans = [
        {
            "id": scan['id'],
            "url": scan['url'],
            "status": scan['status'],
            "created_at": scan['created_at'],
            "has_result": scan['id'] in scan_results
        }
        for scan in scans.values()
        if scan['user_id'] == user_id
    ]
    
    return jsonify({
        "scans": user_scans
    }), 200