import os
import json
import google.generativeai as genai
from datetime import datetime

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def analyze_scan_with_gemini(scan_result):
    """
    Use Gemini API to analyze scan results and provide recommendations.
    
    Args:
        scan_result: Dict with scan result data including vulnerabilities
        
    Returns:
        Dict with summary and recommendations
    """
    try:
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
        {json.dumps(vulnerabilities, indent=2)}
        
        Focus on explaining the security implications and practical steps to fix the issues.
        Provide your response in the exact JSON format below:
        {{
          "summary": "Executive summary here...",
          "recommendations": ["Recommendation 1", "Recommendation 2", ...]
        }}
        """
        
        # Call Gemini API
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        # Extract and parse response
        content = response.text.strip()
        
        # Try to extract JSON from the response
        try:
            # Find the JSON part in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                analysis = json.loads(json_str)
            else:
                # Fallback if JSON extraction fails
                analysis = {
                    "summary": "Automated analysis could not process the scan results in the expected format.",
                    "recommendations": ["Please review the scan results manually."]
                }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            analysis = {
                "summary": "The security scan identified several issues that need to be addressed.",
                "recommendations": [
                    "Fix high severity vulnerabilities first",
                    "Implement recommended security headers",
                    "Update software to latest versions"
                ]
            }
        
        return analysis
        
    except Exception as e:
        print(f"Error in Gemini analysis: {str(e)}")
        return {
            "summary": "Automated analysis encountered an error and could not complete. Please review the scan results manually.",
            "recommendations": ["Review scan results manually", "Fix identified vulnerabilities based on severity"]
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
    # This is a placeholder. In a real implementation, 
    # you would use a library like ReportLab or WeasyPrint to generate PDFs
    try:
        # Get analysis if not already done
        if not scan_result.get('summary'):
            analysis = analyze_scan_with_gemini(scan_result)
            scan_result['summary'] = analysis.get('summary', '')
            scan_result['recommendations'] = analysis.get('recommendations', [])
        
        # For this example, we'll just write a JSON file
        # In a real implementation, this would generate a PDF
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(scan_result, f, indent=2, ensure_ascii=False)
            
        return output_path
    
    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
        return None 