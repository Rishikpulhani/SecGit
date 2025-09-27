import json
import requests
from .repositoryrag import RepositoryRAG

def analyze_repository_basic(repo_url: str):
    """Basic repository analysis using GitHub API (similar to how medical agent processes queries)."""
    try:
        print(f"Analyzing repository URL: {repo_url}")
        # Extract owner/repo from URL
        path = repo_url.replace("https://github.com/", "").rstrip("/")
        if "/" not in path:
            print(f"Invalid path format: {path}")
            return None
            
        api_url = f"https://api.github.com/repos/{path}"
        print(f"Making API call to: {api_url}")
        response = requests.get(api_url)
        
        if response.status_code == 200:
            data = response.json()
            language = data.get("language")
            description = data.get("description")
            
            print(f"Raw data - Language: {language}, Description: {description}")
            
            return {
                "name": data.get("name", ""),
                "language": language.lower() if language else "",
                "description": description if description else "",
                "topics": data.get("topics", [])
            }
        else:
            print(f"API call failed with status: {response.status_code}")
    except Exception as e:
        print(f"Error analyzing repository: {e}")
        import traceback
        traceback.print_exc()
    return None

def classify_project_type(repo_data):
    """Classify project type based on repository data (like get_intent_and_keyword in medical agent)."""
    if not repo_data:
        print("No repo data provided, defaulting to web_app")
        return "web_app"  # default
    
    print(f"Classifying repo data: {repo_data}")
    
    name = repo_data.get("name", "")
    language = repo_data.get("language")
    description = repo_data.get("description")
    
    print(f"Processing - Name: {name}, Language: {language}, Description: {description}")
    
    # Safe handling of None values
    name = name.lower() if name else ""
    language = language.lower() if language else ""
    description = description.lower() if description else ""
    topics = [t.lower() for t in repo_data.get("topics", []) if t]
    
    # PRIORITY 1: Check description first (most reliable)
    if description:
        # Check for AI/ML in description (highest priority)
        ai_keywords = ["ai/ml", "machine learning", "ml", "ai", "artificial intelligence", "neural", "model", "tensorflow", "pytorch"]
        if any(keyword in description for keyword in ai_keywords):
            print("Detected AI/ML project from description")
            return "ai_ml"
        
        # Check for scraping in description
        scraping_keywords = ["scrap", "scraping", "crawler", "spider", "harvest", "data collection", "web scraping"]
        if any(keyword in description for keyword in scraping_keywords):
            print("Detected scraping project from description")
            return "scraping"
        
        # Check for documentation in description
        doc_keywords = ["documentation", "docs", "guide", "tutorial", "reference", "manual", "learning resource"]
        if any(keyword in description for keyword in doc_keywords):
            print("Detected documentation project from description")
            return "documentation"
    
    # PRIORITY 2: Check repository name patterns (only if description doesn't match)
    # Check for scraping projects by name (very specific patterns)
    scraping_name_keywords = ["scrap", "crawler", "spider", "harvest", "trends", "twitter", "instagram", "facebook"]
    if any(keyword in name for keyword in scraping_name_keywords):
        print("Detected scraping project based on name keywords")
        return "scraping"
    
    # Check for competitive programming by name
    cp_keywords = ["leet", "leetcode", "algorithm", "competitive", "contest", "cph", "coding"]
    if any(keyword in name for keyword in cp_keywords):
        print("Detected competitive programming project from name")
        return "competitive_programming"
    
    # Check for documentation projects by name (but be more specific)
    doc_name_keywords = ["docs", "documentation", "guide", "tutorial", "reference", "manual"]
    if any(keyword in name for keyword in doc_name_keywords):
        print("Detected documentation project from name")
        return "documentation"
    
    # PRIORITY 3: Check topics and language combinations
    if topics:
        ai_topic_keywords = ["machine-learning", "ai", "ml", "tensorflow", "pytorch", "scikit-learn", "data-science"]
        if any(keyword in topics for keyword in ai_topic_keywords):
            print("Detected AI/ML project from topics")
            return "ai_ml"
        
        mobile_topics = ["android", "ios", "mobile", "flutter", "react-native"]
        if any(keyword in topics for keyword in mobile_topics):
            print("Detected mobile app project from topics")
            return "mobile_app"
    
    # PRIORITY 4: Language-based hints (last resort)
    if language:
        if language in ["swift", "kotlin"] or language == "dart":
            print("Detected mobile app project from language")
            return "mobile_app"
        
        if language == "solidity":
            print("Detected blockchain project from language")
            return "blockchain"
    
    # Default to web app only if nothing else matches
    print("Defaulting to web_app - no specific patterns detected")
    return "web_app"

def process_repository_query(repo_url: str, repository_rag: RepositoryRAG):
    """Main processing function (like process_query in medical agent)."""
    
    # Step 1: Analyze repository
    repo_data = analyze_repository_basic(repo_url)
    if not repo_data:
        return [{"name": "Error", "description": "Could not analyze repository"}]
    
    # Step 2: Classify project type  
    project_type = classify_project_type(repo_data)
    print(f"Classified as: {project_type}")
    
    # Step 3: Query MeTTa knowledge base for features
    features = repository_rag.query_project_features(project_type)
    
    print(f"Extracted features: {features}")
    
    # Step 4: Get descriptions for each feature
    result = []
    print(f"Processing {len(features)} features for project type: {project_type}")
    
    for feature in features:  # Process ALL features
        descriptions = repository_rag.get_feature_description(feature)
        description = descriptions[0] if descriptions else f"Enhancement for {feature.replace('_', ' ')}"
        
        result.append({
            "name": feature.replace("_", " ").title(),
            "description": description
        })
        print(f"Added feature: {feature} -> {description[:50]}...")
    
    # Only add fallback features if we got NO project-specific features
    if len(result) == 0:
        print("No project-specific features found, adding fallback features")
        result.append({
            "name": "CI/CD Pipeline", 
            "description": "Continuous Integration/Continuous Deployment pipeline for automated testing and deployment"
        })
        result.append({
            "name": "Monitoring Dashboard",
            "description": "Real-time monitoring dashboard for system health and performance metrics"
        })
    
    print(f"Final result: {len(result)} features")
    return result  # Return all features found
