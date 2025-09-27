# knowledge.py
from hyperon import MeTTa, E, S, ValueAtom

def initialize_knowledge_graph(metta: MeTTa):
    """Initialize the MeTTa knowledge graph with repository feature suggestions."""
    
    # Project Type → Features (like symptom → disease in medical agent)
    
    # Web Applications
    metta.space().add_atom(E(S("project_type"), S("web_app"), S("authentication")))
    metta.space().add_atom(E(S("project_type"), S("web_app"), S("api_documentation")))
    metta.space().add_atom(E(S("project_type"), S("web_app"), S("testing_framework")))
    
    # AI/ML Projects
    metta.space().add_atom(E(S("project_type"), S("ai_ml"), S("model_versioning")))
    metta.space().add_atom(E(S("project_type"), S("ai_ml"), S("data_pipeline")))
    metta.space().add_atom(E(S("project_type"), S("ai_ml"), S("experiment_tracking")))
    
    # Mobile Applications
    metta.space().add_atom(E(S("project_type"), S("mobile_app"), S("push_notifications")))
    metta.space().add_atom(E(S("project_type"), S("mobile_app"), S("offline_support")))
    
    # Scraping Projects - MISSING ENTRIES ADDED
    metta.space().add_atom(E(S("project_type"), S("scraping"), S("data_storage")))
    metta.space().add_atom(E(S("project_type"), S("scraping"), S("scheduled_scraping")))
    metta.space().add_atom(E(S("project_type"), S("scraping"), S("proxy_rotation")))
    metta.space().add_atom(E(S("project_type"), S("scraping"), S("data_visualization")))
    metta.space().add_atom(E(S("project_type"), S("scraping"), S("rate_limiting")))
    metta.space().add_atom(E(S("project_type"), S("scraping"), S("error_handling")))
    
    # Competitive Programming Projects
    metta.space().add_atom(E(S("project_type"), S("competitive_programming"), S("solution_organization")))
    metta.space().add_atom(E(S("project_type"), S("competitive_programming"), S("automated_testing")))
    metta.space().add_atom(E(S("project_type"), S("competitive_programming"), S("complexity_analysis")))
    
    # Documentation Projects  
    metta.space().add_atom(E(S("project_type"), S("documentation"), S("search_functionality")))
    metta.space().add_atom(E(S("project_type"), S("documentation"), S("content_organization")))
    metta.space().add_atom(E(S("project_type"), S("documentation"), S("interactive_examples")))
    
    # Feature → Description (like treatment → description in medical agent)  
    
    # Web App Features
    metta.space().add_atom(E(S("feature"), S("authentication"), ValueAtom("User authentication and authorization system with login/logout functionality")))
    metta.space().add_atom(E(S("feature"), S("api_documentation"), ValueAtom("Interactive API documentation using Swagger/OpenAPI for better developer experience")))
    metta.space().add_atom(E(S("feature"), S("testing_framework"), ValueAtom("Comprehensive testing suite with unit, integration, and end-to-end tests")))
    
    # AI/ML Features
    metta.space().add_atom(E(S("feature"), S("model_versioning"), ValueAtom("ML model versioning system for tracking experiments and model rollbacks")))
    metta.space().add_atom(E(S("feature"), S("data_pipeline"), ValueAtom("Automated data processing pipeline for ETL operations and data validation")))
    metta.space().add_atom(E(S("feature"), S("experiment_tracking"), ValueAtom("ML experiment tracking system to monitor model performance and metrics")))
    
    # Mobile Features
    metta.space().add_atom(E(S("feature"), S("push_notifications"), ValueAtom("Push notification system for real-time user engagement and updates")))
    metta.space().add_atom(E(S("feature"), S("offline_support"), ValueAtom("Offline functionality support for seamless user experience without internet")))
    
    # Scraping Features - MISSING DESCRIPTIONS ADDED
    metta.space().add_atom(E(S("feature"), S("data_storage"), ValueAtom("Persistent data storage with database integration for scraped data management")))
    metta.space().add_atom(E(S("feature"), S("scheduled_scraping"), ValueAtom("Automated scheduling system for regular data collection with cron jobs")))
    metta.space().add_atom(E(S("feature"), S("proxy_rotation"), ValueAtom("Proxy rotation system to avoid IP blocking and ensure continuous scraping")))
    metta.space().add_atom(E(S("feature"), S("data_visualization"), ValueAtom("Interactive dashboards and charts to visualize scraped data trends")))
    metta.space().add_atom(E(S("feature"), S("rate_limiting"), ValueAtom("Smart rate limiting to respect website policies and avoid detection")))
    metta.space().add_atom(E(S("feature"), S("error_handling"), ValueAtom("Robust error handling with retry mechanisms and failure notifications")))
    
    # Competitive Programming Features
    metta.space().add_atom(E(S("feature"), S("solution_organization"), ValueAtom("Organize solutions by problem difficulty, topic, and platform with clear folder structure")))
    metta.space().add_atom(E(S("feature"), S("automated_testing"), ValueAtom("Automated test cases to verify solution correctness with multiple test inputs")))
    metta.space().add_atom(E(S("feature"), S("complexity_analysis"), ValueAtom("Time and space complexity analysis documentation for each solution")))
    
    # Documentation Features
    metta.space().add_atom(E(S("feature"), S("search_functionality"), ValueAtom("Advanced search with filters for programming languages, topics, and difficulty")))
    metta.space().add_atom(E(S("feature"), S("content_organization"), ValueAtom("Hierarchical content organization with categories and tagging system")))
    metta.space().add_atom(E(S("feature"), S("interactive_examples"), ValueAtom("Interactive code examples with live execution and editing capabilities")))
    
    # Common Features
    metta.space().add_atom(E(S("feature"), S("ci_cd_pipeline"), ValueAtom("Continuous Integration/Continuous Deployment pipeline for automated testing and deployment")))
    metta.space().add_atom(E(S("feature"), S("monitoring_dashboard"), ValueAtom("Real-time monitoring dashboard for system health and performance metrics")))
    
    print("Repository knowledge graph initialized successfully!")
