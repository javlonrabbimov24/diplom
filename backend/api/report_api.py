from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
import json
from datetime import datetime
import os
import io
from utils.openai_helper import generate_pdf_report

# Create reports directory if it doesn't exist
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
os.makedirs(REPORTS_DIR, exist_ok=True)

# In a real application, this would be a database
reports = {}

report_bp = Blueprint('report', __name__)

@report_bp.route('/<report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID."""
    # We reuse scan_results from scan_api
    from api.scan_api import scan_results
    
    if report_id not in scan_results:
        return jsonify({"error": "Hisobot topilmadi"}), 404
    
    result = scan_results[report_id]
    
    return jsonify({
        "report": result
    }), 200

@report_bp.route('/export/<report_id>', methods=['GET'])
def export_report(report_id):
    """Export a report as JSON or PDF file."""
    # We reuse scan_results from scan_api
    from api.scan_api import scan_results
    
    if report_id not in scan_results:
        return jsonify({"error": "Hisobot topilmadi"}), 404
    
    result = scan_results[report_id]
    
    # Get format from query parameters (default to pdf)
    format = request.args.get('format', 'pdf').lower()
    
    if format == 'json':
        # Create a JSON string of the result
        report_json = json.dumps(result, indent=2, ensure_ascii=False)
        
        # Create a file-like object
        report_file = io.BytesIO(report_json.encode('utf-8'))
        
        # Generate filename
        filename = f"cybershield_report_{report_id[:8]}_{datetime.now().strftime('%Y%m%d')}.json"
        
        return send_file(
            report_file,
            as_attachment=True,
            download_name=filename,
            mimetype='application/json'
        )
    elif format == 'pdf':
        # Generate PDF report
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_filename = f"report_{report_id[:8]}_{timestamp}.pdf"
        report_path = os.path.join(REPORTS_DIR, report_filename)
        
        # For demo, generate a JSON file as a placeholder
        # In a real implementation, this would generate a PDF file
        pdf_path = generate_pdf_report(result, report_path)
        
        if not pdf_path:
            return jsonify({"error": "Hisobot generatsiya qilishda xatolik yuz berdi"}), 500
            
        # Check if it's a JSON file (placeholder for demo)
        if pdf_path.endswith('.json'):
            with open(pdf_path, 'r', encoding='utf-8') as f:
                report_data = f.read()
            report_file = io.BytesIO(report_data.encode('utf-8'))
            filename = f"cybershield_report_{report_id[:8]}_{datetime.now().strftime('%Y%m%d')}.json"
            mime_type = 'application/json'
        else:
            # Actual PDF
            with open(pdf_path, 'rb') as f:
                report_data = f.read()
            report_file = io.BytesIO(report_data)
            filename = f"cybershield_report_{report_id[:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"
            mime_type = 'application/pdf'
        
        return send_file(
            report_file,
            as_attachment=True,
            download_name=filename,
            mimetype=mime_type
        )
    else:
        return jsonify({"error": "Qo'llab-quvvatlanmaydigan format"}), 400

@report_bp.route('/generate/<report_id>', methods=['POST'])
def generate_report(report_id):
    """Generate a report for a scan."""
    # We reuse scan_results from scan_api
    from api.scan_api import scan_results, scans
    
    if report_id not in scan_results:
        return jsonify({"error": "Hisobot topilmadi"}), 404
        
    # Check if scan is completed
    if report_id not in scans or scans[report_id]['status'] != 'completed':
        return jsonify({"error": "Skanerlash hali yakunlanmagan"}), 400
    
    result = scan_results[report_id]
    
    # If we haven't already analyzed with ChatGPT, do it now
    if not result.get('is_analyzed'):
        from utils.openai_helper import analyze_scan_with_chatgpt
        try:
            analysis = analyze_scan_with_chatgpt(result)
            result['summary'] = analysis.get('summary', '')
            result['recommendations'] = analysis.get('recommendations', [])
            result['is_analyzed'] = True
        except Exception as e:
            print(f"Error analyzing scan result: {str(e)}")
            return jsonify({
                "error": "Hisobot tahlil qilishda xatolik yuz berdi", 
                "success": False
            }), 500
    
    return jsonify({
        "message": "Hisobot generatsiya qilindi",
        "success": True
    }), 200

@report_bp.route('/summary/<report_id>', methods=['GET'])
def get_report_summary(report_id):
    """Get a summary of a specific report."""
    # We reuse scan_results from scan_api
    from api.scan_api import scan_results
    
    if report_id not in scan_results:
        return jsonify({"error": "Hisobot topilmadi"}), 404
    
    result = scan_results[report_id]
    
    # Create a summary
    summary = {
        "url": result["url"],
        "security_score": result["security_score"],
        "severity_counts": result["severity_counts"],
        "total_vulnerabilities": sum(result["severity_counts"].values()),
        "scan_date": result["created_at"],
        "summary": result.get("summary", ""),
        "recommendations": result.get("recommendations", [])
    }
    
    return jsonify({
        "summary": summary
    }), 200

@report_bp.route('/latest', methods=['GET'])
@jwt_required(optional=True)
def get_latest_reports():
    """Get the latest reports for the user."""
    # We reuse scan_results from scan_api
    from api.scan_api import scan_results, scans
    
    user_id = get_jwt_identity()
    
    # If not authenticated, return limited results
    if not user_id:
        # Get most recent 3 scan results
        latest_results = sorted(
            [result for result in scan_results.values()],
            key=lambda x: x["created_at"],
            reverse=True
        )[:3]
        
        return jsonify({
            "message": "Barcha hisobotlarni ko'rish uchun tizimga kiring",
            "reports": latest_results
        }), 200
    
    # Get user's scans
    user_scan_ids = [
        scan["id"] for scan in scans.values()
        if scan["user_id"] == user_id and scan["status"] == "completed"
    ]
    
    # Get user's reports
    user_reports = [
        result for scan_id, result in scan_results.items()
        if scan_id in user_scan_ids
    ]
    
    # Sort by created_at
    user_reports = sorted(user_reports, key=lambda x: x["created_at"], reverse=True)
    
    return jsonify({
        "reports": user_reports
    }), 200 