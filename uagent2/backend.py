"""
Flask Backend API for PR Review Agent
Provides REST endpoints for GitHub Pull Request analysis
"""

import os
import re
import asyncio
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Import the PR analyzer
from agent import PullRequestAnalysisAdapter

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PR analyzer
GOOGLE_KEY = os.getenv("GOOGLE_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GOOGLE_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file")

pr_analyzer = PullRequestAnalysisAdapter(api_key=GOOGLE_KEY, github_token=GITHUB_TOKEN)

def validate_github_pr_url(url):
    """Validate if the provided URL is a valid GitHub PR URL"""
    patterns = [
        r'^https://github\.com/[^/\s]+/[^/\s]+/pull/\d+$',
        r'^https://www\.github\.com/[^/\s]+/[^/\s]+/pull/\d+$'
    ]
    
    for pattern in patterns:
        if re.match(pattern, url.strip()):
            return True
    return False

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "PR Analysis Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

@app.route('/analyze-pr', methods=['POST'])
def analyze_pr():
    """
    Analyze a GitHub Pull Request
    
    Expected JSON payload:
    {
        "pr_url": "https://github.com/owner/repo/pull/123"
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "status": "error"
            }), 400
        
        pr_url = data.get('pr_url')
        
        if not pr_url:
            return jsonify({
                "error": "pr_url is required",
                "status": "error"
            }), 400
        
        # Validate PR URL format
        if not validate_github_pr_url(pr_url):
            return jsonify({
                "error": "Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123",
                "status": "error"
            }), 400
        
        logger.info(f"Analyzing PR: {pr_url}")
        
        # Run async analysis in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            analysis_result = loop.run_until_complete(pr_analyzer.analyze_pull_request(pr_url))
        finally:
            loop.close()
        
        # Get PR metadata for additional context
        pr_data = pr_analyzer.get_pr_data(pr_url)
        
        response_data = {
            "status": "success",
            "pr_url": pr_url,
            "analysis": analysis_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add PR metadata if available
        if pr_data:
            response_data["pr_metadata"] = {
                "title": pr_data.get('title'),
                "author": pr_data.get('user'),
                "state": pr_data.get('state'),
                "files_changed": pr_data.get('changed_files', 0),
                "additions": pr_data.get('additions', 0),
                "deletions": pr_data.get('deletions', 0),
                "created_at": pr_data.get('created_at'),
                "updated_at": pr_data.get('updated_at')
            }
        
        logger.info(f"Analysis completed for PR: {pr_url}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error analyzing PR: {str(e)}")
        return jsonify({
            "error": f"Analysis failed: {str(e)}",
            "status": "error"
        }), 500

@app.route('/quick-analyze', methods=['GET'])
def quick_analyze():
    """
    Quick PR analysis via GET request with URL parameter
    Usage: /quick-analyze?url=https://github.com/owner/repo/pull/123
    """
    try:
        pr_url = request.args.get('url')
        
        if not pr_url:
            return jsonify({
                "error": "URL parameter is required. Usage: ?url=https://github.com/owner/repo/pull/123",
                "status": "error"
            }), 400
        
        # Validate PR URL format
        if not validate_github_pr_url(pr_url):
            return jsonify({
                "error": "Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123",
                "status": "error"
            }), 400
        
        logger.info(f"Quick analyzing PR: {pr_url}")
        
        # Run async analysis in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            analysis_result = loop.run_until_complete(pr_analyzer.analyze_pull_request(pr_url))
        finally:
            loop.close()
        
        return jsonify({
            "status": "success",
            "pr_url": pr_url,
            "analysis": analysis_result,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in quick analysis: {str(e)}")
        return jsonify({
            "error": f"Analysis failed: {str(e)}",
            "status": "error"
        }), 500

@app.route('/validate-url', methods=['POST'])
def validate_url():
    """
    Validate if a URL is a valid GitHub PR URL
    
    Expected JSON payload:
    {
        "url": "https://github.com/owner/repo/pull/123"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "status": "error"
            }), 400
        
        url = data.get('url')
        
        if not url:
            return jsonify({
                "error": "url is required",
                "status": "error"
            }), 400
        
        is_valid = validate_github_pr_url(url)
        extracted_url = pr_analyzer.extract_pr_url(url) if is_valid else None
        
        return jsonify({
            "status": "success",
            "is_valid": is_valid,
            "original_url": url,
            "extracted_url": extracted_url,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error validating URL: {str(e)}")
        return jsonify({
            "error": f"Validation failed: {str(e)}",
            "status": "error"
        }), 500

@app.route('/pr-metadata', methods=['POST'])
def get_pr_metadata():
    """
    Get PR metadata without full analysis
    
    Expected JSON payload:
    {
        "pr_url": "https://github.com/owner/repo/pull/123"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "status": "error"
            }), 400
        
        pr_url = data.get('pr_url')
        
        if not pr_url:
            return jsonify({
                "error": "pr_url is required",
                "status": "error"
            }), 400
        
        # Validate PR URL format
        if not validate_github_pr_url(pr_url):
            return jsonify({
                "error": "Invalid GitHub PR URL format",
                "status": "error"
            }), 400
        
        logger.info(f"Fetching metadata for PR: {pr_url}")
        
        pr_data = pr_analyzer.get_pr_data(pr_url)
        
        if not pr_data:
            return jsonify({
                "error": "Could not fetch PR data. Check if the PR exists and is accessible.",
                "status": "error"
            }), 404
        
        return jsonify({
            "status": "success",
            "pr_url": pr_url,
            "metadata": pr_data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching PR metadata: {str(e)}")
        return jsonify({
            "error": f"Failed to fetch metadata: {str(e)}",
            "status": "error"
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "status": "error",
        "available_endpoints": [
            "GET /",
            "POST /analyze-pr",
            "GET /quick-analyze",
            "POST /validate-url",
            "POST /pr-metadata"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error",
        "status": "error"
    }), 500

if __name__ == '__main__':
    print("🚀 PR Analysis Backend Starting...")
    print("=" * 50)
    print("Available Endpoints:")
    print("  GET  /                 - Health check")
    print("  POST /analyze-pr       - Full PR analysis")
    print("  GET  /quick-analyze    - Quick analysis via URL param")
    print("  POST /validate-url     - Validate GitHub PR URL")
    print("  POST /pr-metadata      - Get PR metadata only")
    print("=" * 50)
    print("Example Usage:")
    print("  curl -X POST http://localhost:5000/analyze-pr \\")
    print("    -H 'Content-Type: application/json' \\")
    print("    -d '{\"pr_url\":\"https://github.com/owner/repo/pull/123\"}'")
    print("=" * 50)
    print("Starting Flask server on port 5000...")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
