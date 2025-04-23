from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid
import json
from datetime import datetime
import os
import io
from utils.openai_helper import generate_pdf_report, analyze_scan_with_chatgpt
import traceback
import sys
from api.scan_api import scan_results, scans

# Create reports directory if it doesn't exist
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
os.makedirs(REPORTS_DIR, exist_ok=True)

# In a real application, this would be a database
reports = {}

report_bp = Blueprint('report', __name__)

@report_bp.route('/<report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID."""
    # Check if report exists
    if report_id not in scan_results:
        return jsonify({"error": "Hisobot topilmadi"}), 404
    
    result = scan_results[report_id]
    
    return jsonify({
        "report": result
    }), 200

@report_bp.route('/export/<scan_id>', methods=['GET'])
def export_report(scan_id):
    """Export scan results as a PDF report."""
    try:
        # Check for invalid scan ID
        if not scan_id or scan_id == 'undefined':
            return jsonify({"error": "Noto'g'ri scan ID"}), 400
            
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
        
        # Get export format (pdf or html, default is pdf)
        format_type = request.args.get('format', 'pdf').lower()
        if format_type not in ['pdf', 'html', 'json']:
            format_type = 'pdf'
        
        # Create reports directory if it doesn't exist
        reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../reports/exports'))
        os.makedirs(reports_dir, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        safe_url = scan['url'].replace('://', '_').replace('/', '_').replace('.', '_')
        filename = f"{safe_url}_{timestamp}.{format_type}"
        output_path = os.path.join(reports_dir, filename)
        
        # Get scan result
        result = scan_results[scan_id]
        
        if format_type == 'json':
            # Export as JSON
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
        else:
            # Generate PDF (or HTML as fallback)
            output_path = generate_pdf_report(result, output_path)
            # Check if output is HTML (fallback if PDF generation failed)
            if output_path.endswith('.html'):
                format_type = 'html'
        
        # Set appropriate content type
        content_types = {
            'pdf': 'application/pdf',
            'html': 'text/html',
            'json': 'application/json'
        }
        
        # Set appropriate download filename
        download_filename = f"CyberShield_Report_{safe_url[:20]}_{timestamp}.{format_type}"
        
        return send_file(
            output_path,
            mimetype=content_types[format_type],
            as_attachment=True,
            download_name=download_filename,
            max_age=300  # Cache for 5 minutes
        )
    except Exception as e:
        print(f"Error exporting report for scan {scan_id}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({"error": f"Hisobotni eksport qilishda xatolik: {str(e)}"}), 500

@report_bp.route('/generate/<scan_id>', methods=['POST'])
def generate_report(scan_id):
    """Generate an AI analysis report for a scan."""
    try:
        # Check for invalid scan ID
        if not scan_id or scan_id == 'undefined':
            return jsonify({"error": "Noto'g'ri scan ID"}), 400
            
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
        
        # If analysis already exists, return existing data
        if result.get('is_analyzed'):
            return jsonify({
                "message": "Hisobot allaqachon mavjud",
                "report": {
                    "summary": result.get('summary', ''),
                    "recommendations": result.get('recommendations', [])
                }
            }), 200
        
        # Get analysis from OpenAI
        analysis = analyze_scan_with_chatgpt(result)
        
        # Update result with analysis
        result['summary'] = analysis.get('summary', '')
        result['recommendations'] = analysis.get('recommendations', [])
        result['is_analyzed'] = True
        
        return jsonify({
            "message": "Hisobot muvaffaqiyatli yaratildi",
            "report": {
                "summary": result['summary'],
                "recommendations": result['recommendations']
            }
        }), 200
    except Exception as e:
        print(f"Error generating report for scan {scan_id}: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({"error": f"Hisobot yaratishda xatolik: {str(e)}"}), 500

@report_bp.route('/summary/<report_id>', methods=['GET'])
def get_report_summary(report_id):
    """Get a summary of a specific report."""
    # Check if report exists
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