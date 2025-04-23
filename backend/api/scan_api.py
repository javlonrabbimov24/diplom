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
        
        print(f"Starting scan process for {url} with scan_id: {scan_id}")
        
        # Save the TARGET_URL environment variable
        os.environ['TARGET_URL'] = url
        
        # Create directories for reports if they don't exist
        reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../reports'))
        zap_dir = os.path.join(reports_dir, 'zap')
        nmap_dir = os.path.join(reports_dir, 'nmap')
        
        for directory in [reports_dir, zap_dir, nmap_dir]:
            os.makedirs(directory, exist_ok=True)
            print(f"Created directory: {directory}")
        
        # Get server info
        server_info = get_server_info(url)
        
        # Prepare safe filename (no special characters)
        safe_url = url.replace(":", "_").replace("/", "_").replace(".", "_")
        
        # Run ZAP scan
        zap_vulnerabilities = []
        try:
            print(f"Starting ZAP scan for {url}")
            zap_report_path = os.path.join(zap_dir, f'{safe_url}-zap-report.json')
            
            # Extract the hostname from URL
            if '://' in url:
                target = url
            else:
                target = 'http://' + url
                
            try:
                # Run ZAP scan using Docker exec command
                zap_cmd = [
                    'docker', 'exec', 'zap_scanner',
                    'python3', '/zap/zap-baseline.py', 
                    '-t', target, 
                    '-J', f'/zap/wrk/{safe_url}-zap-report.json', 
                    '-r', f'/zap/wrk/{safe_url}-zap-scanning-report.html'
                ]
                
                print(f"Executing ZAP command: {' '.join(zap_cmd)}")
                zap_process = subprocess.run(
                    zap_cmd, 
                    check=False, 
                    capture_output=True,
                    timeout=300  # 5 minute timeout
                )
                
                if zap_process.returncode != 0:
                    print(f"ZAP command exited with code {zap_process.returncode}")
                    print(f"ZAP stderr: {zap_process.stderr.decode('utf-8', errors='ignore')}")
                else:
                    print(f"ZAP scan completed successfully for {url}")
                    print(f"ZAP stdout: {zap_process.stdout.decode('utf-8', errors='ignore')[:200]}...")
                
            except subprocess.TimeoutExpired:
                print(f"ZAP scan timeout for {url}, continuing with available data")
            except Exception as e:
                print(f"ZAP scan command error: {str(e)}")
                # Continue with mock data if ZAP scan fails
            
            print(f"Checking for ZAP report at {zap_report_path}")
            # Wait for ZAP report to be available (max 10 seconds)
            for _ in range(10):
                if os.path.exists(zap_report_path):
                    print(f"ZAP report found at {zap_report_path}")
                    break
                print("Waiting for ZAP report...")
                time.sleep(2)
            
            # Try to read the report
            if os.path.exists(zap_report_path):
                with open(zap_report_path, 'r') as f:
                    try:
                        zap_data = json.load(f)
                        print(f"Successfully loaded ZAP report for {url}")
                        
                        # Extract data from ZAP report
                        if isinstance(zap_data, dict) and 'site' in zap_data and zap_data['site']:
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
                        else:
                            print(f"ZAP report has unexpected format: {zap_data}")
                    except json.JSONDecodeError as e:
                        print(f"Error decoding ZAP JSON report: {str(e)}")
            else:
                print(f"ZAP report file not found at {zap_report_path}, using mock data")
                            
        except Exception as e:
            print(f"Error in ZAP scan process: {str(e)}")
            # Continue with mock data if ZAP scan fails
        
        # Run Nmap scan
        nmap_vulnerabilities = []
        try:
            print(f"Starting Nmap scan for {url}")
            # Extract hostname without protocol
            if '://' in url:
                target = url.split('://')[1]
            else:
                target = url
                
            # Remove path if exists
            if '/' in target:
                target = target.split('/')[0]
                
            print(f"Nmap target: {target}")
            nmap_report_path = os.path.join(nmap_dir, f'{safe_url}-nmap-report.xml')
            
            try:
                # Run Nmap scan using Docker exec command
                nmap_cmd = [
                    'docker', 'exec', 'nmap_scanner',
                    'nmap', '-sV', '--script=vulners', target,
                    '-oX', f'/reports/{safe_url}-nmap-report.xml'
                ]
                
                print(f"Executing Nmap command: {' '.join(nmap_cmd)}")
                nmap_process = subprocess.run(
                    nmap_cmd, 
                    check=False,
                    capture_output=True,
                    timeout=300  # 5 minute timeout
                )
                
                if nmap_process.returncode != 0:
                    print(f"Nmap command exited with code {nmap_process.returncode}")
                    print(f"Nmap stderr: {nmap_process.stderr.decode('utf-8', errors='ignore')}")
                else:
                    print(f"Nmap scan completed successfully for {target}")
                    print(f"Nmap stdout: {nmap_process.stdout.decode('utf-8', errors='ignore')[:200]}...")
                
            except subprocess.TimeoutExpired:
                print(f"Nmap scan timeout for {url}, continuing with available data")
            except Exception as e:
                print(f"Nmap scan command error: {str(e)}")
            
            # Fix permissions and wait for report file
            try:
                chmod_cmd = [
                    'docker', 'exec', 'nmap_scanner',
                    'chmod', '777', f'/reports/{safe_url}-nmap-report.xml'
                ]
                subprocess.run(chmod_cmd, check=False, timeout=10)
            except Exception as e:
                print(f"Error setting permissions on Nmap report: {str(e)}")
            
            print(f"Checking for Nmap report at {nmap_report_path}")
            # Wait for Nmap report to be available (max 10 seconds)
            for i in range(5):
                if os.path.exists(nmap_report_path):
                    print(f"Nmap report found at {nmap_report_path}")
                    break
                print(f"Waiting for Nmap report... (attempt {i+1}/5)")
                time.sleep(2)
            
            # Try to read and parse Nmap results if file exists
            if os.path.exists(nmap_report_path):
                print(f"Nmap report file found at {nmap_report_path}")
                # Here we could parse the XML file to extract vulnerabilities
                # For simplicity, we'll use ZAP results or mock data
            else:
                print(f"Nmap report file not found at {nmap_report_path}")
            
        except Exception as e:
            print(f"Error in Nmap scan process: {str(e)}")
        
        # If no ZAP vulnerabilities were found, use mock data
        if not zap_vulnerabilities:
            print(f"No vulnerabilities found from ZAP for {url}, using mock data")
            zap_vulnerabilities = generate_mock_vulnerabilities()
        
        # Combine all vulnerabilities
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
        
        print(f"Saving scan result for scan_id: {scan_id}")
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
        
        print(f"Scan process completed successfully for {url}")
        
    except Exception as e:
        print(f"Error processing scan {scan_id}: {str(e)}")
        import traceback
        traceback.print_exc()
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
        print(f"Starting AI analysis for scan {scan_id}")
        # Get scan result
        result = scan_results.get(scan_id)
        if not result:
            print(f"No scan results found for scan {scan_id}")
            return
            
        # Get analysis from Gemini
        from utils.openai_helper import analyze_scan_with_chatgpt as analyze_with_gemini
        analysis = analyze_with_gemini(result)
        
        # Update result with analysis
        result['summary'] = analysis.get('summary', '')
        result['recommendations'] = analysis.get('recommendations', [])
        result['is_analyzed'] = True
        
        print(f"AI analysis completed for scan {scan_id}")
        
    except Exception as e:
        print(f"Error analyzing scan {scan_id} with AI: {str(e)}")
        # Don't fail the scan if analysis fails
        result = scan_results.get(scan_id)
        if result:
            result['analysis_error'] = str(e)

@scan_bp.route('/start', methods=['POST'])
def start_scan():
    try:
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
        
        print(f"Scan started with ID: {scan_id} for URL: {url}")
        
        return jsonify({
            "message": "Skanerlash boshlandi",
            "scan": {
                "id": scan_id,
                "url": url,
                "status": scan['status']
            }
        }), 202
    except Exception as e:
        print(f"Error starting scan: {str(e)}")
        return jsonify({"error": f"Serverda xatolik: {str(e)}"}), 500

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
    try:
        # Check for invalid scan ID
        if not scan_id or scan_id == 'undefined':
            return jsonify({"error": "Noto'g'ri scan ID"}), 400
            
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
    except Exception as e:
        print(f"Error getting scan {scan_id}: {str(e)}")
        return jsonify({"error": f"Serverda xatolik: {str(e)}"}), 500

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