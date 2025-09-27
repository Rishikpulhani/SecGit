from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import sys
from datetime import datetime
from main_agent import EnhancedASIOneRepoAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('asi_one_api.log')
    ]
)

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize the analyzer once
logger.info("🚀 Initializing ASI:One Repository Analyzer...")
try:
    analyzer = EnhancedASIOneRepoAnalyzer()
    logger.info("✅ ASI:One Repository Analyzer initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize analyzer: {e}")
    raise

@app.before_request
def log_request_info():
    """Log incoming request details."""
    logger.info(f"📨 Incoming Request: {request.method} {request.path}")
    if request.is_json and request.get_json():
        logger.info(f"📋 Request Data: {json.dumps(request.get_json(), indent=2)}")

@app.after_request
def log_response_info(response):
    """Log outgoing response details."""
    logger.info(f"📤 Response Status: {response.status_code}")
    return response

@app.route('/api/analyze-repo', methods=['POST'])
def analyze_repository():
    """API endpoint to analyze a repository and get feature suggestions."""
    logger.info("🔍 Starting repository analysis...")
    
    try:
        data = request.get_json()
        repo_url = data.get('repo_url')
        
        if not repo_url:
            logger.warning("⚠️ Repository URL not provided")
            return jsonify({
                'success': False,
                'error': 'Repository URL is required'
            }), 400
        
        logger.info(f"📂 Analyzing repository: {repo_url}")
        
        # Run the analysis with detailed logging
        logger.info("🤖 Calling ASI:One for repository analysis...")
        result = analyzer.analyze_repository_and_create_issue(repo_url)
        
        logger.info("✅ Repository analysis completed successfully")
        logger.info(f"📊 Analysis result keys: {list(result.keys()) if isinstance(result, dict) else 'Non-dict result'}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Repository analysis failed: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ask-asi-one', methods=['POST'])
def ask_asi_one_direct():
    """Direct ASI:One query endpoint."""
    logger.info("💬 Starting direct ASI:One query...")
    
    try:
        data = request.get_json()
        query = data.get('query')
        conversation_id = data.get('conversation_id', 'default')
        
        if not query:
            logger.warning("⚠️ Query not provided")
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        logger.info(f"🔍 Query: {query[:100]}{'...' if len(query) > 100 else ''}")
        logger.info(f"💬 Conversation ID: {conversation_id}")
        
        # Ask ASI:One directly with logging
        messages = [{"role": "user", "content": query}]
        logger.info(f"📤 Sending to ASI:One - Messages: {len(messages)} message(s)")
        
        response = analyzer.ask_asi_one(conversation_id, messages, stream=False)
        
        logger.info(f"📥 ASI:One response received - Length: {len(response)} characters")
        logger.info(f"📝 Response preview: {response[:200]}{'...' if len(response) > 200 else ''}")
        
        result = {
            'success': True,
            'response': response,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info("✅ Direct ASI:One query completed successfully")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ ASI:One query failed: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/create-github-issue', methods=['POST'])
def create_github_issue():
    """Create a GitHub issue from analyzed data."""
    logger.info("📝 Starting GitHub issue creation...")
    
    try:
        data = request.get_json()
        repo_url = data.get('repo_url')
        issue_data = data.get('issue_data')
        
        if not repo_url or not issue_data:
            logger.warning("⚠️ Missing repository URL or issue data")
            return jsonify({
                'success': False,
                'error': 'Repository URL and issue data are required'
            }), 400
        
        logger.info(f"📂 Repository: {repo_url}")
        logger.info(f"📋 Issue title: {issue_data.get('title', 'No title')}")
        
        # Extract repo info and create issue
        repo_info = analyzer.extract_repo_info(repo_url)
        logger.info(f"🏷️ Extracted repo info: {repo_info}")
        
        logger.info("🚀 Creating GitHub issue via API...")
        github_response = analyzer.create_github_issue(
            owner=repo_info['owner'],
            repo=repo_info['repo'],
            issue_data=issue_data
        )
        
        issue_result = {
            'title': github_response['title'],
            'url': github_response['html_url'],
            'number': github_response['number'],
            'state': github_response['state']
        }
        
        logger.info(f"✅ GitHub issue created successfully: #{issue_result['number']}")
        logger.info(f"🔗 Issue URL: {issue_result['url']}")
        
        return jsonify({
            'success': True,
            'issue': issue_result
        })
        
    except Exception as e:
        logger.error(f"❌ GitHub issue creation failed: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    logger.info("🏥 Health check requested")
    return jsonify({
        'status': 'healthy',
        'service': 'ASI:One Repository Analyzer API',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    logger.warning(f"🚫 404 Not Found: {request.path}")
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"💥 500 Internal Server Error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting ASI:One API Server...")
    logger.info("📡 API will be available at: http://localhost:5000")
    logger.info("📋 Endpoints:")
    logger.info("  POST /api/analyze-repo - Analyze repository")
    logger.info("  POST /api/ask-asi-one - Direct ASI:One queries")
    logger.info("  POST /api/create-github-issue - Create GitHub issues")
    logger.info("  GET  /api/health - Health check")
    logger.info("📝 Logs will be saved to: asi_one_api.log")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        logger.info("👋 Server shutdown requested by user")
    except Exception as e:
        logger.error(f"💥 Server failed to start: {e}")