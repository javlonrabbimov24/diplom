import os
import json
import google.generativeai as genai
from datetime import datetime
import sys
import traceback

# Configure Gemini API
api_key = os.getenv('GEMINI_API_KEY', 'your-gemini-api-key')
if api_key == 'your-gemini-api-key':
    print("WARNING: Using default Gemini API key. Set GEMINI_API_KEY environment variable.")

genai.configure(api_key=api_key)

def analyze_scan_with_gemini(scan_result):
    """
    Use Gemini API to analyze scan results and provide recommendations.
    
    Args:
        scan_result: Dict with scan result data including vulnerabilities
        
    Returns:
        Dict with summary and recommendations
    """
    try:
        print("Starting Gemini AI analysis...")
        # Extract relevant information for the prompt
        vulnerabilities = scan_result.get('vulnerabilities', [])
        url = scan_result.get('url', 'Unknown URL')
        severity_counts = scan_result.get('severity_counts', {})
        security_score = scan_result.get('security_score', 0)
        
        # Create a prompt for Gemini
        prompt = f"""
        Analyze the following web security scan result and provide:
        1. A concise executive summary (maximum 2 paragraphs)
        2. Specific, actionable recommendations to fix the issues (ordered by priority)
        
        Scan details:
        - Target URL: {url}
        - Security Score: {security_score}/100
        - Severity Counts: {json.dumps(severity_counts)}
        - Scan Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Vulnerabilities:
        {json.dumps(vulnerabilities[:10], indent=2, ensure_ascii=False)}  # Limit to first 10 vulns to avoid token limits
        
        Focus on explaining the security implications and practical steps to fix the issues.
        Provide your response in the exact JSON format below:
        {{
          "summary": "Executive summary here...",
          "recommendations": ["Recommendation 1", "Recommendation 2", ...]
        }}
        """
        
        # Call Gemini API
        try:
            print(f"Calling Gemini API for URL: {url}")
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            
            # Extract and parse response
            if response and hasattr(response, 'text'):
                content = response.text.strip()
                print("Received response from Gemini API")
            else:
                print("Empty or invalid response from Gemini API")
                return default_analysis()
                
        except Exception as api_error:
            print(f"Error calling Gemini API: {str(api_error)}")
            traceback.print_exc(file=sys.stdout)
            return default_analysis()
        
        # Try to extract JSON from the response
        try:
            # Find the JSON part in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                analysis = json.loads(json_str)
                print("Successfully parsed Gemini analysis")
            else:
                print("Could not find JSON in Gemini response")
                return default_analysis()
                
        except json.JSONDecodeError as json_error:
            print(f"JSON parsing error: {str(json_error)}")
            return default_analysis()
        
        return analysis
        
    except Exception as e:
        print(f"Error in Gemini analysis: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return default_analysis()

def default_analysis():
    """Return a default analysis when Gemini API fails"""
    return {
        "summary": "Avtomatlashtirilgan tahlil xatolik tufayli to'liq o'tkazilmadi. Aniqlangan zaifliklarni qo'lda tekshiring.",
        "recommendations": [
            "Yuqori darajadagi zaifliklarni birinchi navbatda bartaraf eting",
            "Barcha HTTP xavfsizlik sarlavhalarini o'rnatishni ta'minlang",
            "Server ma'lumotlarini oshkor etmaslikni ta'minlang",
            "Zaif TLS sozlamalarini yangilang"
        ]
    }

# For backwards compatibility
analyze_scan_with_chatgpt = analyze_scan_with_gemini

def generate_pdf_report(scan_result, output_path):
    """
    Generate a PDF report from scan results.
    
    Args:
        scan_result: Dict with scan result data
        output_path: Path to save the PDF report
        
    Returns:
        Path to the generated PDF file
    """
    try:
        print(f"Generating PDF report for scan_id: {scan_result.get('scan_id')}")
        
        # Standard Python libraries for PDF generation
        import pdfkit
        from jinja2 import Environment, FileSystemLoader
        import os
        
        # Get analysis if not already done
        if not scan_result.get('summary'):
            print("No summary found, running AI analysis...")
            analysis = analyze_scan_with_gemini(scan_result)
            scan_result['summary'] = analysis.get('summary', '')
            scan_result['recommendations'] = analysis.get('recommendations', [])
        
        # Setup templates
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
        print(f"Template directory: {template_dir}")
        
        if not os.path.exists(template_dir):
            print(f"Template directory does not exist. Creating it...")
            os.makedirs(template_dir, exist_ok=True)
        
        # Check if template exists
        template_path = os.path.join(template_dir, 'report_template.html')
        if not os.path.exists(template_path):
            print(f"Template file not found at: {template_path}")
            # Use a default template
            create_default_template(template_path)
        
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template('report_template.html')
        
        # Format data for template
        formatted_data = {
            'url': scan_result.get('url', 'N/A'),
            'scan_date': datetime.fromisoformat(scan_result.get('created_at', datetime.now().isoformat())).strftime('%Y-%m-%d %H:%M'),
            'security_score': scan_result.get('security_score', 0),
            'severity_counts': scan_result.get('severity_counts', {'high': 0, 'medium': 0, 'low': 0}),
            'summary': scan_result.get('summary', 'No summary available'),
            'recommendations': scan_result.get('recommendations', []),
            'vulnerabilities': scan_result.get('vulnerabilities', []),
            'server_info': scan_result.get('server_info', {'server': 'Unknown', 'technologies': 'Unknown'})
        }
        
        # Render HTML
        html_content = template.render(**formatted_data)
        
        # Create directory for temp files if it doesn't exist
        temp_dir = os.path.dirname(output_path)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save HTML to temporary file
        html_path = f"{output_path}.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"HTML report saved to: {html_path}")
        
        try:
            # Try to convert HTML to PDF
            print("Converting HTML to PDF...")
            pdfkit_config = None
            
            # Check if wkhtmltopdf is in PATH or specify the path
            wkhtmltopdf_path = '/usr/bin/wkhtmltopdf'
            if os.path.exists(wkhtmltopdf_path):
                from pdfkit.configuration import Configuration
                pdfkit_config = Configuration(wkhtmltopdf=wkhtmltopdf_path)
            
            pdfkit.from_file(html_path, output_path, options={
                'page-size': 'A4',
                'encoding': 'UTF-8',
                'margin-top': '1cm',
                'margin-right': '1cm',
                'margin-bottom': '1cm',
                'margin-left': '1cm',
                'title': f'Security Scan Report - {formatted_data["url"]}'
            }, configuration=pdfkit_config)
            
            print(f"PDF report successfully generated: {output_path}")
            
            # Remove temporary HTML file
            os.remove(html_path)
            
            return output_path
        except Exception as pdf_error:
            print(f"Error converting to PDF: {str(pdf_error)}")
            traceback.print_exc(file=sys.stdout)
            print("Returning HTML file as fallback")
            # If PDF conversion fails, return the HTML file as fallback
            return html_path
            
    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        # Fallback to JSON file
        json_path = output_path.replace('.pdf', '.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(scan_result, f, indent=2, ensure_ascii=False)
        print(f"Fallback JSON report saved to: {json_path}")
        return json_path

def create_default_template(template_path):
    """Create a default HTML template for reports if the template is missing"""
    print("Creating default template...")
    default_template = """<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CyberShield - Xavfsizlik Tekshiruvi Hisoboti</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #eaeaea; }
        .logo { font-size: 28px; font-weight: 700; color: #2563eb; }
        .section { margin: 20px 0; padding: 10px; border-bottom: 1px solid #eaeaea; }
        .vulnerability { margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; }
        .severity-high { color: #dc3545; }
        .severity-medium { color: #fd7e14; }
        .severity-low { color: #0d6efd; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CyberShield</div>
            <div>Xavfsizlik Tekshiruvi Hisoboti</div>
        </div>
        
        <div class="section">
            <h2>Asosiy ma'lumotlar</h2>
            <p><strong>URL:</strong> {{ url }}</p>
            <p><strong>Sana:</strong> {{ scan_date }}</p>
            <p><strong>Xavfsizlik bali:</strong> {{ security_score }}</p>
            <p><strong>Zaifliklar:</strong> Yuqori: {{ severity_counts.high }}, O'rta: {{ severity_counts.medium }}, Past: {{ severity_counts.low }}</p>
        </div>
        
        <div class="section">
            <h2>Qisqacha ma'lumot</h2>
            <p>{{ summary }}</p>
        </div>
        
        <div class="section">
            <h2>Tavsiyalar</h2>
            <ul>
                {% for recommendation in recommendations %}
                <li>{{ recommendation }}</li>
                {% endfor %}
            </ul>
        </div>
        
        <div class="section">
            <h2>Aniqlangan zaifliklar</h2>
            <table>
                <thead>
                    <tr>
                        <th>Zaiflik nomi</th>
                        <th>Jiddiylik</th>
                        <th>Ta'rif</th>
                    </tr>
                </thead>
                <tbody>
                    {% for vuln in vulnerabilities %}
                    <tr>
                        <td>{{ vuln.name }}</td>
                        <td class="severity-{{ vuln.severity }}">{{ vuln.severity }}</td>
                        <td>{{ vuln.description }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Server ma'lumotlari</h2>
            <p><strong>Server:</strong> {{ server_info.server }}</p>
            {% if server_info.technologies %}
            <p><strong>Texnologiyalar:</strong> {{ server_info.technologies }}</p>
            {% endif %}
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666;">
            <p>© {{ scan_date.split(' ')[0] }} CyberShield. Barcha huquqlar himoyalangan.</p>
        </div>
    </div>
</body>
</html>"""
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(template_path), exist_ok=True)
    
    # Write template to file
    with open(template_path, 'w', encoding='utf-8') as f:
        f.write(default_template)
    
    print(f"Default template created at: {template_path}") 