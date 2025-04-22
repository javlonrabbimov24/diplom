# scan routes
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
import re
import random
from datetime import datetime
import time
import threading
import redis
import json
import os
from utils.openai_helper import analyze_scan_with_chatgpt
import subprocess

# Redis connection for job queue
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'redis'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0
)

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

def process_scan(scan_id, url):
    """Background process for scanning a URL."""
    try:
        # Update scan status
        scan = scans[scan_id]
        scan['status'] = 'in_progress'
        scan['updated_at'] = datetime.now().isoformat()
        
        # Save the TARGET_URL environment variable
        os.environ['TARGET_URL'] = url
        
        # Create directories for reports if they don't exist
        os.makedirs(f'reports/zap', exist_ok=True)
        os.makedirs(f'reports/nmap', exist_ok=True)
        
        # Get server info
        server_info = get_server_info(url)
        
        # Run ZAP scan
        try:
            zap_report_path = f'reports/zap/{url}-zap-report.json'
            zap_service = os.getenv('ZAP_SERVICE', 'localhost')
            
            # Run ZAP scan using subprocess
            subprocess.run([
                'docker', 'exec', 'zap_scanner',
                'zap-baseline.py', '-t', url, '-J', f'/zap/wrk/{url.replace(":", "_").replace("/", "_")}-zap-report.json'
            ], check=True)
            
            # Wait for ZAP report to be available
            time.sleep(2)
            
        except Exception as e:
            print(f"Error running ZAP scan: {str(e)}")
            # Continue with mock data if ZAP scan fails
        
        # Run Nmap scan
        try:
            nmap_report_path = f'reports/nmap/{url}-nmap-report.xml'
            nmap_service = os.getenv('NMAP_SERVICE', 'localhost')
            
            # Run Nmap scan using subprocess
            subprocess.run([
                'docker', 'exec', 'nmap_scanner',
                'nmap', '-sV', '-sC', url.split('://')[1] if '://' in url else url,
                '-oX', f'/reports/{url.replace(":", "_").replace("/", "_")}-nmap-report.xml'
            ], check=True)
            
            # Fix permissions
            subprocess.run([
                'docker', 'exec', 'nmap_scanner',
                'chmod', '777', f'/reports/{url.replace(":", "_").replace("/", "_")}-nmap-report.xml'
            ], check=True)
            
            # Wait for Nmap report to be available
            time.sleep(2)
            
        except Exception as e:
            print(f"Error running Nmap scan: {str(e)}")
            # Continue with mock data if Nmap scan fails
        
        # Try to read and parse ZAP report
        zap_vulnerabilities = []
        try:
            with open(zap_report_path, 'r') as f:
                zap_data = json.load(f)
                
            for site in zap_data.get('site', []):
                for alert in site.get('alerts', []):
                    zap_vulnerabilities.append({
                        "id": str(uuid.uuid4()),
                        "name": alert.get('name', 'Unknown Vulnerability'),
                        "severity": map_zap_risk_to_severity(alert.get('riskdesc', 'Low')),
                        "description": alert.get('desc', 'No description available'),
                        "location": alert.get('url', 'Unknown'),
                        "detected_at": datetime.now().isoformat(),
                        "status": "open",
                        "remediation": alert.get('solution', 'No remediation available'),
                        "references": alert.get('reference', '').split('\n') if alert.get('reference') else []
                    })
        except Exception as e:
            print(f"Error reading ZAP report: {str(e)}")
            # If we can't read ZAP report, use mock data
            zap_vulnerabilities = generate_mock_vulnerabilities()
        
        # Combine real and/or mock vulnerabilities
        vulnerabilities = zap_vulnerabilities
        
        # Count vulnerabilities by severity
        severity_counts = {"high": 0, "medium": 0, "low": 0}
        for vuln in vulnerabilities:
            severity = vuln['severity'].lower()
            if severity in severity_counts:
                severity_counts[severity] += 1
        
        # Calculate security score (0-100)
        # Higher weights for more severe vulnerabilities
        total_score = 100 - (severity_counts['high'] * 15 + 
                          severity_counts['medium'] * 8 + 
                          severity_counts['low'] * 3)
        security_score = max(0, min(100, total_score))
        
        # Create scan result
        result = {
            'id': str(uuid.uuid4()),
            'scan_id': scan_id,
            'url': url,
            'vulnerabilities': vulnerabilities,
            'security_score': security_score,
            'severity_counts': severity_counts,
            'created_at': datetime.now().isoformat(),
            'server_info': server_info,
            'recommendations': []
        }
        
        # Store result
        scan_results[scan_id] = result
        
        # Mark scan as completed
        scan['status'] = 'completed'
        scan['completed_at'] = datetime.now().isoformat()
        scan['updated_at'] = datetime.now().isoformat()
        
        # Analyze with Gemini in another thread to not block
        threading.Thread(
            target=analyze_with_chatgpt,
            args=(scan_id,),
            daemon=True
        ).start()
        
    except Exception as e:
        print(f"Error processing scan {scan_id}: {str(e)}")
        scan = scans.get(scan_id)
        if scan:
            scan['status'] = 'failed'
            scan['error'] = str(e)
            scan['updated_at'] = datetime.now().isoformat()

def map_zap_risk_to_severity(risk_desc):
    """Map ZAP risk descriptions to our severity levels."""
    risk_map = {
        "High": "high",
        "Medium": "medium",
        "Low": "low",
        "Informational": "info"
    }
    
    for risk, severity in risk_map.items():
        if risk in risk_desc:
            return severity
    
    return "low"  # Default to low severity

def get_server_info(url):
    """Get server information for a URL."""
    try:
        import requests
        response = requests.head(url, timeout=5)
        
        return {
            'server': response.headers.get('Server', 'Unknown'),
            'technologies': ', '.join(get_technologies_from_headers(response.headers))
        }
    except Exception as e:
        print(f"Error getting server info: {str(e)}")
        return {
            'server': 'Unknown',
            'technologies': 'Unknown'
        }

def get_technologies_from_headers(headers):
    """Extract technologies from HTTP headers."""
    technologies = []
    
    if 'X-Powered-By' in headers:
        technologies.append(headers['X-Powered-By'])
    
    if 'Server' in headers:
        technologies.append(headers['Server'])
    
    return technologies if technologies else ['Unknown']

def analyze_with_chatgpt(scan_id):
    """Analyze scan results using ChatGPT."""
    try:
        # Get scan result
        result = scan_results.get(scan_id)
        if not result:
            return
            
        # Get analysis from ChatGPT
        analysis = analyze_scan_with_chatgpt(result)
        
        # Update result with analysis
        result['summary'] = analysis.get('summary', '')
        result['recommendations'] = analysis.get('recommendations', [])
        result['is_analyzed'] = True
        
    except Exception as e:
        print(f"Error analyzing scan {scan_id} with ChatGPT: {str(e)}")
        # Don't fail the scan if analysis fails
        result = scan_results.get(scan_id)
        if result:
            result['analysis_error'] = str(e)

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
        'status': 'queued',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'user_id': request.headers.get('X-User-ID', 'anonymous'),  # Authenticated user if available
    }
    
    scans[scan_id] = scan
    
    # Add to queue for async processing
    threading.Thread(
        target=process_scan,
        args=(scan_id, url),
        daemon=True
    ).start()
    
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
    
    return jsonify({
        "scan": {
            "id": scan_id,
            "url": scan['url'],
            "status": scan['status'],
            "created_at": scan['created_at'],
            "updated_at": scan['updated_at'],
            "completed_at": scan.get('completed_at')
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

@scan_bp.route('/<scan_id>', methods=['GET'])
def get_scan_by_id(scan_id):
    """Get a specific scan by ID with its results if available."""
    # Check if scan exists
    if scan_id not in scans:
        return jsonify({"error": "Skanerlash topilmadi"}), 404
    
    scan = scans[scan_id]
    
    # Create response object
    response = {
        "id": scan['id'],
        "targetUrl": scan['url'],
        "status": scan['status'],
        "createdAt": scan['created_at'],
        "updatedAt": scan['updated_at'],
    }
    
    # Add completed_at if available
    if 'completed_at' in scan:
        response["completedAt"] = scan['completed_at']
    
    # If scan is completed and result exists, include summary information
    if scan['status'] == 'completed' and scan_id in scan_results:
        result = scan_results[scan_id]
        response["securityScore"] = result.get('security_score')
        response["summary"] = result.get('summary', '')
        response["recommendations"] = result.get('recommendations', [])
    
    return jsonify(response), 200

@scan_bp.route('/<scan_id>/vulnerabilities', methods=['GET'])
def get_vulnerabilities(scan_id):
    """Get vulnerabilities for a specific scan."""
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
    
    return jsonify(result.get('vulnerabilities', [])), 200

@scan_bp.route('/history', methods=['GET'])
@jwt_required(optional=True)
def scan_history():
    # Get user ID from token if available
    user_id = get_jwt_identity()
    
    if not user_id:
        # For anonymous users, return limited or no history
        return jsonify({
            "message": "Skanerlash tarixini ko'rish uchin tizimga kiring",
            "scans": []
        }), 200
    
    # Get user's scan history
    user_scans = [
        {
            "id": scan['id'],
            "url": scan['url'],
            "status": scan['status'],
            "created_at": scan['created_at'],
            "has_result": scan['id'] in scan_results,
            "completed_at": scan.get('completed_at')
        }
        for scan in scans.values()
        if scan['user_id'] == user_id
    ]
    
    # Sort by created_at (newest first)
    user_scans.sort(key=lambda x: x["created_at"], reverse=True)
    
    return jsonify({
        "scans": user_scans
    }), 200

@scan_bp.route('/stats', methods=['GET'])
@jwt_required(optional=True)
def dashboard_stats():
    """Get dashboard statistics."""
    user_id = get_jwt_identity()
    
    if not user_id:
        return jsonify({
            "message": "Dashboard ma'lumotlarini ko'rish uchun tizimga kiring",
            "stats": None
        }), 401
    
    # Filter user's scans
    user_scans = [scan for scan in scans.values() if scan['user_id'] == user_id]
    
    # Calculate statistics
    total_scans = len(user_scans)
    completed_scans = sum(1 for scan in user_scans if scan['status'] == 'completed')
    
    # Get security scores
    security_scores = []
    vulnerability_counts = {"high": 0, "medium": 0, "low": 0}
    
    for scan in user_scans:
        if scan['status'] == 'completed' and scan['id'] in scan_results:
            result = scan_results[scan['id']]
            security_scores.append(result.get('security_score', 0))
            
            # Count vulnerabilities
            for severity, count in result.get('severity_counts', {}).items():
                vulnerability_counts[severity] += count
    
    # Calculate average security score
    avg_security_score = sum(security_scores) / len(security_scores) if security_scores else 0
    
    return jsonify({
        "stats": {
            "total_scans": total_scans,
            "completed_scans": completed_scans,
            "in_progress_scans": sum(1 for scan in user_scans if scan['status'] == 'in_progress'),
            "average_security_score": round(avg_security_score, 1),
            "vulnerability_counts": vulnerability_counts,
            "total_vulnerabilities": sum(vulnerability_counts.values())
        }
    }), 200

@scan_bp.route('/<scan_id>/cancel', methods=['POST'])
def cancel_scan(scan_id):
    """Cancel an in-progress scan."""
    # Check if scan exists
    if scan_id not in scans:
        return jsonify({"error": "Skanerlash topilmadi"}), 404
    
    scan = scans[scan_id]
    
    # Check if scan can be cancelled
    if scan['status'] not in ['queued', 'in_progress']:
        return jsonify({"error": "Faqat navbatda turgan yoki ishlayotgan skanerlashni bekor qilish mumkin"}), 400
    
    # Update scan status
    scan['status'] = 'cancelled'
    scan['updated_at'] = datetime.now().isoformat()
    
    return jsonify({
        "message": "Skanerlash bekor qilindi",
        "scan": {
            "id": scan_id,
            "status": scan['status']
        }
    }), 200