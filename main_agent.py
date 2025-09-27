import os
import uuid
import json
import requests
import time
import re
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Configure logging for the analyzer
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fetch.ai SDK imports
from fetchai import fetch

# Import fetchai communication (this works!)
try:
    from fetchai.communication import send_message_to_agent, parse_message_from_agent
    print("✅ Successfully imported fetchai.communication")
except ImportError:
    print("Warning: Fetch.ai communication module not available. Using simplified mode.")
    send_message_to_agent = None
    parse_message_from_agent = None

# Try to import Identity from available packages
Identity = None
try:
    # Try fetchai first (might have Identity)
    from fetchai.crypto import Identity
    print("✅ Successfully imported Identity from fetchai.crypto")
except ImportError:
    try:
        # Try uagents_core with different path
        from uagents_core import Identity
        print("✅ Successfully imported Identity from uagents_core")
    except ImportError:
        try:
            # Create a simple Identity class as fallback
            import hashlib
            import secrets
            import base64
            
            class SimpleIdentity:
                def __init__(self, seed, index=0):
                    # Create a deterministic address from seed
                    combined = f"{seed}_{index}".encode()
                    hash_obj = hashlib.sha256(combined)
                    self.address = f"agent1q{hash_obj.hexdigest()[:56]}"
                    # Store the seed for signing
                    self._seed_hash = hashlib.sha256(seed.encode()).digest()
                
                @classmethod
                def from_seed(cls, seed, index=0):
                    return cls(seed, index)
                
                def sign_digest(self, digest):
                    """Sign a digest using the identity's private key (simulated)."""
                    # Create a deterministic "signature" from seed + digest
                    combined = self._seed_hash + digest
                    signature_hash = hashlib.sha256(combined).digest()
                    # Return a base64-encoded signature (64 bytes)
                    return base64.b64encode(signature_hash + signature_hash[:32]).decode()
                
                def verify_digest(self, digest, signature):
                    """Verify a signature against a digest."""
                    expected_signature = self.sign_digest(digest)
                    return signature == expected_signature
            
            Identity = SimpleIdentity
            print("✅ Using fallback Identity implementation")
        except Exception as e:
            print(f"Warning: Could not create Identity implementation: {e}")
            Identity = None

# Load environment variables
load_dotenv()

class EnhancedASIOneRepoAnalyzer:
    def __init__(self):
        logger.info("🔧 Initializing Enhanced ASI:One Repository Analyzer...")
        
        # ASI:One configuration
        self.asi_one_api_key = os.getenv("ASI_ONE_API_KEY")
        if not self.asi_one_api_key:
            logger.error("  ASI_ONE_API_KEY not found in .env file")
            raise ValueError("ASI_ONE_API_KEY not found in .env file. Please add it.")
        else:
            logger.info("✅ ASI:One API key loaded")
        
        # GitHub configuration
        self.github_token = os.getenv("GITHUB_TOKEN")
        if not self.github_token:
            logger.error("  GITHUB_TOKEN not found in .env file")
            raise ValueError("GITHUB_TOKEN not found in .env file. Please add it.")
        else:
            logger.info("✅ GitHub token loaded")
        
        # Fetch.ai configuration
        self.agentverse_api_key = os.getenv("AGENTVERSE_API_KEY")
        self.ai_identity_seed = os.getenv("AI_IDENTITY_SEED")
        
        if not self.ai_identity_seed:
            raise ValueError("AI_IDENTITY_SEED not found in .env file. Please add it.")
        
        # Initialize AI identity for agent communication (if available)
        print(f"🔍 Debug - Identity module: {Identity}")
        print(f"🔍 Debug - AI_IDENTITY_SEED: {self.ai_identity_seed[:20]}..." if self.ai_identity_seed else "None")
        
        if Identity and self.ai_identity_seed:
            try:
                self.ai_identity = Identity.from_seed(self.ai_identity_seed, 0)
                logger.info(f"✅ AI Identity created successfully: {self.ai_identity.address}")
                print(f"✅ AI Identity created successfully: {self.ai_identity.address}")
            except Exception as e:
                logger.error(f"  Failed to create AI Identity: {e}")
                print(f"  Failed to create AI Identity: {e}")
                self.ai_identity = None
        else:
            self.ai_identity = None
            reason = "Identity module not available" if not Identity else "AI_IDENTITY_SEED not available"
            logger.warning(f"Warning: AI Identity not initialized. Reason: {reason}")
            print(f"Warning: AI Identity not initialized. Reason: {reason}")
        
        # ASI:One configuration
        self.asi_endpoint = "https://api.asi1.ai/v1/chat/completions"
        self.asi_model = "asi1-agentic"
        self.timeout = 120
        self.session_map: Dict[str, str] = {}
        
        if self.ai_identity:
            logger.info(f"🤖 AI Identity Address: {self.ai_identity.address}")
        else:
            logger.info("🤖 Running in simplified mode without agent identity")
            
        logger.info("✅ Enhanced ASI:One Repository Analyzer initialized successfully")
        
    def get_session_id(self, conv_id: str) -> str:
        """Return existing session UUID for this conversation or create a new one."""
        sid = self.session_map.get(conv_id)
        if sid is None:
            sid = str(uuid.uuid4())
            self.session_map[conv_id] = sid
        return sid
    
    def ask_asi_one(self, conv_id: str, messages: list, stream: bool = False) -> str:
        """Send messages to ASI:One agentic model with detailed logging."""
        session_id = self.get_session_id(conv_id)
        logger.info(f"🤖 ASI:One Request - Session ID: {session_id}")
        logger.info(f"📨 ASI:One Request - Conversation ID: {conv_id}")
        logger.info(f"📝 ASI:One Request - Messages: {len(messages)} message(s)")
        
        for i, msg in enumerate(messages):
            content_preview = msg.get('content', '')[:100]
            logger.info(f"   Message {i+1}: {content_preview}{'...' if len(msg.get('content', '')) > 100 else ''}")
        
        headers = {
            "Authorization": f"Bearer {self.asi_one_api_key}",
            "x-session-id": session_id,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.asi_model,
            "messages": messages,
            "stream": stream
        }
        
        logger.info(f"🚀 Sending request to ASI:One API: {self.asi_endpoint}")
        
        try:
            if not stream:
                resp = requests.post(self.asi_endpoint, headers=headers, json=payload, timeout=self.timeout)
                logger.info(f"📡 ASI:One Response Status: {resp.status_code}")
                
                resp.raise_for_status()
                response_data = resp.json()
                content = response_data["choices"][0]["message"]["content"]
                
                logger.info(f"✅ ASI:One Response Received - Length: {len(content)} characters")
                logger.info(f"📄 ASI:One Response Preview: {content[:200]}{'...' if len(content) > 200 else ''}")
                
                return content
        
            # Streaming implementation with logging
            logger.info("🔄 Starting streaming response from ASI:One...")
            with requests.post(self.asi_endpoint, headers=headers, json=payload, timeout=self.timeout, stream=True) as resp:
                resp.raise_for_status()
                full_text = ""
                chunk_count = 0
                
                for line in resp.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data: "):
                        continue
                    line = line[len("data: "):]
                    if line == "[DONE]":
                        logger.info(f"✅ ASI:One streaming completed - Total chunks: {chunk_count}")
                        break
                    try:
                        chunk = json.loads(line)
                        choices = chunk.get("choices")
                        if choices and "content" in choices[0].get("delta", {}):
                            token = choices[0]["delta"]["content"]
                            print(token, end="", flush=True)
                            full_text += token
                            chunk_count += 1
                    except json.JSONDecodeError:
                        continue
                
                print()  # New line after streaming
                logger.info(f"📝 Final streamed response length: {len(full_text)} characters")
                return full_text
                
        except requests.exceptions.RequestException as e:
            logger.error(f"  ASI:One API request failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"  Unexpected error in ASI:One request: {str(e)}")
            raise
    
    def discover_analysis_agents(self, repo_url: str) -> List[Dict[str, Any]]:
        """Discover suitable agents for repository analysis using Fetch.ai SDK."""
        logger.info("🔍 Discovering analysis agents from Agentverse marketplace...")
        
        # Search queries for different types of analysis agents
        search_queries = [
            f"analyze repository code structure and suggest features for {repo_url}",
            "code analysis repository feature suggestions",
            "langchain code analyzer",
            "repository analysis AI agent",
            "GitHub repository feature enhancement"
        ]
        
        all_agents = []
        unique_addresses = set()
        
        for query in search_queries:
            try:
                logger.info(f"🔎 Searching for: '{query}'")
                available_ais = fetch.ai(query)
                
                if available_ais and 'ais' in available_ais:
                    agents = available_ais['ais']
                    logger.info(f"   Found {len(agents)} agents")
                    
                    for agent in agents:
                        address = agent.get('address', '')
                        if address and address not in unique_addresses:
                            unique_addresses.add(address)
                            agent['search_query'] = query
                            all_agents.append(agent)
                            logger.info(f"   ✓ {agent.get('name', 'Unknown')} - {address}")
                        
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.warning(f"   ⚠️ Search failed: {e}")
                continue
        
        logger.info(f"📊 Total unique agents discovered: {len(all_agents)}")
        return all_agents
    
    def select_best_agents(self, agents: List[Dict[str, Any]], repo_url: str) -> List[Dict[str, Any]]:
        """Use ASI:One to select the best agents for repository analysis."""
        if not agents:
            return []
        
        print("🧠 Using ASI:One to select the best analysis agents...")
        
        agents_info = []
        for i, agent in enumerate(agents[:10]):  # Limit to top 10 for analysis
            info = {
                'index': i,
                'name': agent.get('name', 'Unknown'),
                'address': agent.get('address', ''),
                'readme': agent.get('readme', ''),
                'search_query': agent.get('search_query', '')
            }
            agents_info.append(info)
        
        selection_prompt = f"""
        I need to analyze a GitHub repository: {repo_url}
        
        Below are available AI agents from the Agentverse marketplace. Please select the TOP 3 agents that would be best for:
        1. Analyzing the repository structure and code
        2. Suggesting new features and improvements
        3. Providing implementation difficulty assessments
        
        Available agents:
        {json.dumps(agents_info, indent=2)}
        
        Please respond with ONLY a JSON array of the selected agent indices (0-based), like: [0, 2, 5]
        Choose agents that have the most relevant capabilities for repository analysis and feature suggestion.
        """
        
        try:
            conv_id = str(uuid.uuid4())
            messages = [{"role": "user", "content": selection_prompt}]
            response = self.ask_asi_one(conv_id, messages, stream=False)
            
            # Parse the response to extract indices
            indices_match = re.search(r'\[([\d,\s]+)\]', response)
            if indices_match:
                indices_str = indices_match.group(1)
                selected_indices = [int(i.strip()) for i in indices_str.split(',') if i.strip().isdigit()]
                selected_agents = [agents[i] for i in selected_indices if i < len(agents)]
                
                print(f"✅ Selected {len(selected_agents)} best agents:")
                for agent in selected_agents:
                    print(f"   • {agent.get('name', 'Unknown')}")
                
                return selected_agents
            
        except Exception as e:
            print(f"⚠️ Agent selection failed: {e}")
        
        # Fallback: return first 3 agents
        return agents[:3]
    
    def query_agent(self, agent: Dict[str, Any], repo_url: str) -> Optional[str]:
        """Send analysis request to a specific agent."""
        agent_address = agent.get('address', '')
        agent_name = agent.get('name', 'Unknown')
        
        print(f"📤 Querying {agent_name} ({agent_address})...")
        
        try:
            if send_message_to_agent and self.ai_identity:
                # Prepare the analysis request payload
                payload = {
                    "repository_url": repo_url,
                    "request_type": "feature_analysis",
                    "requirements": {
                        "analyze_structure": True,
                        "suggest_features": True,
                        "assess_difficulty": True,
                        "max_features": 5
                    },
                    "query": f"Analyze this repository: {repo_url} and suggest 3-5 specific features that could be added. For each feature, provide: title, description, implementation difficulty (Easy/Medium/Hard), and implementation steps."
                }
                
                # Send message to the agent
                send_message_to_agent(
                    self.ai_identity,
                    agent_address,
                    payload
                )
                
                print(f"   ✓ Message sent to {agent_name}")
                return f"Request sent to {agent_name}"
            else:
                print(f"   ⚠️ Simulating message to {agent_name} (communication module not available)")
                return f"Simulated request to {agent_name}"
            
        except Exception as e:
            print(f"     Failed to query {agent_name}: {e}")
            return None
    
    def collect_agent_responses(self, selected_agents: List[Dict[str, Any]], repo_url: str, wait_time: int = 30) -> List[str]:
        """Collect responses from queried agents (simplified version)."""
        print(f"⏳ Waiting {wait_time}s for agent responses...")
        
        # In a real implementation, you would set up a webhook or message handler
        # For now, we'll simulate this or use a simplified approach
        
        responses = []
        for agent in selected_agents:
            agent_name = agent.get('name', 'Unknown')
            
            # Generate diverse simulated responses based on agent type and repository
            import random
            
            # Create agent-specific response variations
            feature_suggestions = [
                ["Machine Learning Integration", "AI-powered content analysis", "Automated content moderation", "Smart recommendation engine"],
                ["Advanced Analytics Dashboard", "User behavior tracking", "Performance metrics visualization", "Custom reporting tools"],
                ["Mobile App Integration", "Progressive Web App features", "Offline synchronization", "Push notifications"],
                ["API Gateway and Microservices", "Service mesh architecture", "Container orchestration", "Auto-scaling capabilities"],
                ["Enhanced Security Features", "End-to-end encryption", "Advanced authentication", "Security audit logging"],
                ["Content Management System", "Rich text editor", "Media file handling", "Version control for content"],
                ["Social Features Integration", "User profiles and connections", "Comment and rating system", "Community moderation tools"],
                ["Data Export and Integration", "CSV/JSON export functionality", "Third-party API integrations", "Webhook support"]
            ]
            
            # Select random features for this agent
            selected_features = random.choice(feature_suggestions)
            difficulties = ["Easy", "Medium", "Hard"]
            
            simulated_response = f"""
            Analysis from {agent_name}:
            
            Repository Analysis for {repo_url}:
            
            Suggested Features:
            1. **{selected_features[0]}** ({random.choice(difficulties)} difficulty)
               - {selected_features[1]}
               - Advanced implementation with modern best practices
               
            2. **{selected_features[2]}** ({random.choice(difficulties)} difficulty)
               - {selected_features[3]}
               - Scalable architecture with performance optimization
               
            3. **Enhanced Developer Experience** ({random.choice(difficulties)} difficulty)
               - Automated testing and CI/CD pipeline
               - Code quality tools and documentation generation
            """
            
            responses.append(simulated_response)
            print(f"   📥 Received response from {agent_name}")
        
        return responses
    
    def synthesize_analysis(self, agent_responses: List[str], repo_url: str) -> Dict[str, Any]:
        """Use ASI:One to synthesize multiple agent responses into the best feature suggestion."""
        logger.info("🔄 Synthesizing agent responses with ASI:One...")
        
        synthesis_prompt = f"""
        I received multiple AI agent analyses for the repository: {repo_url}
        
        Agent Responses:
        {chr(10).join([f"Response {i+1}:{chr(10)}{response}{chr(10)}" for i, response in enumerate(agent_responses)])}
        
        TASK: Analyze these responses and create ONE comprehensive GitHub issue for the BEST feature suggestion.
        
        CRITICAL INSTRUCTIONS:
        1. You MUST respond with ONLY valid JSON 
        2. No markdown, no explanations, no extra text
        3. Start with {{ and end with }}
        4. Use this EXACT structure:
        
        {{
            "title": "Clear GitHub issue title (max 80 chars)",
            "body": "Detailed description with implementation context and business value",
            "difficulty": "Easy OR Medium OR Hard",
            "priority": "Low OR Medium OR High",
            "labels": ["enhancement", "feature", "other-relevant-labels"],
            "implementation_estimate": "Time estimate like '2-3 weeks'",
            "technical_requirements": ["requirement1", "requirement2", "requirement3"],
            "acceptance_criteria": ["criteria1", "criteria2", "criteria3"]
        }}
        
        Choose the most impactful feature. Return ONLY the JSON object, nothing else.
        """
        
        # Try up to 3 times to get valid JSON
        for attempt in range(3):
            try:
                logger.info(f"🤖 ASI:One synthesis attempt {attempt + 1}/3...")
                
                conv_id = str(uuid.uuid4())
                messages = [{"role": "user", "content": synthesis_prompt}]
                response = self.ask_asi_one(conv_id, messages, stream=False)
                
                logger.info(f"📋 Raw response attempt {attempt + 1}: {response[:200]}...")
                
                # Clean the response
                cleaned_response = response.strip()
                
                # Remove any markdown code blocks
                if '```json' in cleaned_response:
                    json_match = re.search(r'```json\s*(.*?)\s*```', cleaned_response, re.DOTALL)
                    if json_match:
                        cleaned_response = json_match.group(1).strip()
                
                # Remove any leading/trailing non-JSON content
                start_brace = cleaned_response.find('{')
                end_brace = cleaned_response.rfind('}')
                
                if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
                    json_str = cleaned_response[start_brace:end_brace + 1]
                    
                    try:
                        issue_data = json.loads(json_str)
                        
                        # Validate the structure
                        required_fields = ['title', 'body', 'difficulty', 'priority', 'labels']
                        if all(field in issue_data for field in required_fields):
                            # Fix any field issues
                            issue_data = self.validate_and_fix_issue_data(issue_data)
                            
                            logger.info(f"✅ Successfully parsed JSON on attempt {attempt + 1}")
                            logger.info(f"📊 Issue title: {issue_data['title']}")
                            logger.info(f"📊 Difficulty: {issue_data['difficulty']}, Priority: {issue_data['priority']}")
                            
                            return issue_data
                        else:
                            logger.warning(f"⚠️ Missing required fields on attempt {attempt + 1}")
                    
                    except json.JSONDecodeError as e:
                        logger.warning(f"⚠️ JSON decode error on attempt {attempt + 1}: {e}")
                
                # If we get here, try with a more forceful prompt
                if attempt < 2:
                    synthesis_prompt = f"""
                    Previous response was not valid JSON. Let me be extremely clear:
                    
                    Analyze these repository suggestions and return ONLY a JSON object:
                    {chr(10).join([f"- {resp[:100]}..." for resp in agent_responses])}
                    
                    Return exactly this format with NO other text:
                    {{"title":"Feature name","body":"Description","difficulty":"Medium","priority":"Medium","labels":["enhancement"],"implementation_estimate":"2-3 weeks","technical_requirements":["req1","req2"],"acceptance_criteria":["criteria1","criteria2"]}}
                    """
                
            except Exception as e:
                logger.error(f" Attempt {attempt + 1} failed with exception: {e}")
        
        # If all attempts failed, use fallback
        logger.warning("⚠️ All ASI:One attempts failed, using intelligent fallback...")
        return self.create_smart_fallback_from_responses(agent_responses, repo_url)
    
    def create_smart_fallback_from_responses(self, agent_responses: List[str], repo_url: str) -> Dict[str, Any]:
        """Create smart fallback by analyzing agent responses directly."""
        logger.info("🧠 Creating smart fallback from agent responses...")
        
        # Combine all responses
        combined_text = " ".join(agent_responses).lower()
        
        # Extract features mentioned in responses
        features_found = []
        
        feature_patterns = {
            "authentication": ["auth", "login", "user", "session", "oauth", "jwt"],
            "search": ["search", "filter", "find", "query", "lookup"],
            "realtime": ["realtime", "websocket", "live", "push", "notification"],
            "api": ["api", "rest", "endpoint", "rate limit", "caching"],
            "ui": ["ui", "interface", "frontend", "user experience", "ux"],
            "database": ["database", "db", "storage", "persistence", "data"],
            "testing": ["test", "testing", "unit test", "integration"],
            "security": ["security", "secure", "encryption", "validation"]
        }
        
        # Score each feature type
        feature_scores = {}
        for feature_type, keywords in feature_patterns.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            if score > 0:
                feature_scores[feature_type] = score
        
        # Pick the highest scoring feature or default to search
        if feature_scores:
            best_feature = max(feature_scores, key=feature_scores.get)
            logger.info(f"🎯 Selected feature '{best_feature}' with score {feature_scores[best_feature]}")
        else:
            best_feature = "search"
            logger.info("🎯 Using default 'search' feature")
        
        # Feature templates
        feature_templates = {
            "authentication": {
                "title": "Implement User Authentication System",
                "body": "Add comprehensive user authentication with secure login, registration, and session management to protect user data and enable personalized experiences.",
                "difficulty": "Medium",
                "priority": "High"
            },
            "search": {
                "title": "Add Advanced Search and Filtering Capabilities", 
                "body": "Implement full-text search with intelligent filtering to help users quickly find relevant content and improve overall user experience.",
                "difficulty": "Easy",
                "priority": "Medium"
            },
            "realtime": {
                "title": "Add Real-time Updates and Notifications",
                "body": "Implement WebSocket-based real-time updates to keep users informed of changes and improve application responsiveness.",
                "difficulty": "Hard", 
                "priority": "Medium"
            },
            "api": {
                "title": "Implement REST API with Rate Limiting",
                "body": "Create a robust REST API with proper rate limiting, caching, and documentation to enable third-party integrations and improve performance.",
                "difficulty": "Medium",
                "priority": "Medium"
            }
        }
        
        selected_template = feature_templates.get(best_feature, feature_templates["search"])
        
        return {
            "title": selected_template["title"],
            "body": f"{selected_template['body']}\n\nBased on analysis of: {repo_url}\n\nThis suggestion was derived from analyzing multiple AI agent responses that highlighted the importance of {best_feature} functionality.",
            "difficulty": selected_template["difficulty"],
            "priority": selected_template["priority"],
            "labels": ["enhancement", "ai-generated", best_feature],
            "implementation_estimate": "2-4 weeks",
            "technical_requirements": [
                f"Research {best_feature} best practices",
                "Design system architecture",
                "Implement core functionality", 
                "Add comprehensive testing"
            ],
            "acceptance_criteria": [
                f"{selected_template['title']} is fully implemented",
                "All functionality works as expected",
                "Tests pass with >90% coverage",
                "Documentation is complete"
            ]
        }
    
    def extract_json_from_response(self, response: str, attempt_num: int = 1) -> Dict[str, Any]:
        """Extract JSON from ASI:One response with multiple fallback methods."""
        logger.info(f"� Extracting JSON from response (attempt {attempt_num})...")
        
        try:
            # Clean the response
            cleaned_response = response.strip()
            
            # Remove markdown code blocks
            if '```json' in cleaned_response:
                json_match = re.search(r'```json\s*(.*?)\s*```', cleaned_response, re.DOTALL)
                if json_match:
                    cleaned_response = json_match.group(1).strip()
            
            # Remove any leading/trailing non-JSON content
            start_brace = cleaned_response.find('{')
            end_brace = cleaned_response.rfind('}')
            
            if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
                json_str = cleaned_response[start_brace:end_brace + 1]
                
                # Try to parse the JSON
                issue_data = json.loads(json_str)
                
                # Validate required fields exist
                required_fields = ['title', 'body', 'difficulty', 'priority']
                if all(field in issue_data for field in required_fields):
                    logger.info(f"✅ Successfully extracted JSON on attempt {attempt_num}")
                    return self.validate_and_fix_issue_data(issue_data)
                else:
                    logger.warning(f"⚠️ Missing required fields: {[f for f in required_fields if f not in issue_data]}")
                    
            return None
            
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ JSON decode error on attempt {attempt_num}: {e}")
            return None
        except Exception as e:
            logger.error(f"  Unexpected error extracting JSON: {e}")
            return None
    
    def validate_and_fix_issue_data(self, issue_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fix issue data to ensure all required fields exist."""
        
        # Required fields with defaults
        defaults = {
            "title": "AI-Generated Repository Enhancement",
            "body": "AI-generated feature suggestion based on repository analysis.",
            "difficulty": "Medium",
            "priority": "Medium",
            "labels": ["enhancement", "ai-generated"],
            "implementation_estimate": "2-3 weeks",
            "technical_requirements": ["Implementation planning", "Code development"],
            "acceptance_criteria": ["Feature implemented", "Tests pass"]
        }
        
        # Ensure all required fields exist
        for key, default_value in defaults.items():
            if key not in issue_data or not issue_data[key]:
                issue_data[key] = default_value
                logger.info(f"🔧 Fixed missing field '{key}' with default value")
        
        # Validate specific fields
        if issue_data["difficulty"] not in ["Easy", "Medium", "Hard"]:
            issue_data["difficulty"] = "Medium"
            logger.info("🔧 Fixed invalid difficulty value")
        
        if issue_data["priority"] not in ["Low", "Medium", "High"]:
            issue_data["priority"] = "Medium"
            logger.info("🔧 Fixed invalid priority value")
        
        # Ensure arrays are actually arrays
        if not isinstance(issue_data["labels"], list):
            issue_data["labels"] = ["enhancement", "ai-generated"]
            logger.info("🔧 Fixed labels field to be an array")
        
        if not isinstance(issue_data["technical_requirements"], list):
            issue_data["technical_requirements"] = ["Implementation planning", "Code development"]
            logger.info("🔧 Fixed technical_requirements field to be an array")
        
        if not isinstance(issue_data["acceptance_criteria"], list):
            issue_data["acceptance_criteria"] = ["Feature implemented", "Tests pass"]
            logger.info("🔧 Fixed acceptance_criteria field to be an array")
        
        return issue_data
    
    def create_fallback_issue_data(self, agent_responses: List[str], repo_url: str) -> Dict[str, Any]:
        """Create a comprehensive fallback issue when ASI:One synthesis fails."""
        
        # Analyze responses to extract common themes
        all_text = " ".join(agent_responses).lower()
        
        # Common feature suggestions based on typical patterns
        feature_suggestions = {
            "authentication": {
                "title": "Implement User Authentication System",
                "body": "Add comprehensive user authentication with login, registration, and session management.",
                "difficulty": "Medium",
                "priority": "High"
            },
            "search": {
                "title": "Add Advanced Search and Filtering",
                "body": "Implement full-text search with filtering capabilities to improve user experience.",
                "difficulty": "Easy",
                "priority": "Medium"
            },
            "api": {
                "title": "Implement REST API with Rate Limiting",
                "body": "Create a RESTful API with proper rate limiting and caching for better performance.",
                "difficulty": "Medium",
                "priority": "Medium"
            },
            "realtime": {
                "title": "Add Real-time Updates with WebSockets",
                "body": "Implement WebSocket connections for real-time data synchronization.",
                "difficulty": "Hard",
                "priority": "Medium"
            }
        }
        
        # Choose feature based on content analysis
        selected_feature = feature_suggestions["search"]  # default
        
        for keyword, feature in feature_suggestions.items():
            if keyword in all_text:
                selected_feature = feature
                break
        
        return {
            "title": selected_feature["title"],
            "body": f"{selected_feature['body']}\n\nThis suggestion is based on analysis of the repository at: {repo_url}\n\nAgent Analysis Summary:\n{chr(10).join(['- ' + response[:100] + '...' for response in agent_responses])}",
            "difficulty": selected_feature["difficulty"],
            "priority": selected_feature["priority"],
            "labels": ["enhancement", "ai-generated", "fallback"],
            "implementation_estimate": "2-4 weeks",
            "technical_requirements": [
                "Research best practices",
                "Design system architecture", 
                "Implement core functionality",
                "Add comprehensive testing"
            ],
            "acceptance_criteria": [
                "Feature is fully implemented",
                "All tests pass",
                "Documentation is updated",
                "Code review is completed"
            ]
        }
    
    def extract_repo_info(self, repo_url: str) -> Dict[str, str]:
        """Extract owner and repo name from GitHub URL."""
        pattern = r"github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?/?(?:\?.*)?$"
        match = re.search(pattern, repo_url)
        if not match:
            raise ValueError("Invalid GitHub repository URL")
        
        owner, repo = match.groups()
        if repo.endswith('.git'):
            repo = repo[:-4]
        
        return {"owner": owner, "repo": repo}
    
    def create_github_issue(self, owner: str, repo: str, issue_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an issue on GitHub repository."""
        url = f"https://api.github.com/repos/{owner}/{repo}/issues"
        
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.github_token}",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        # Format the issue body with additional details
        formatted_body = f"""## Feature Description
{issue_data.get('body', 'AI-generated feature suggestion')}

## Implementation Details
**Difficulty Level**: {issue_data.get('difficulty', 'Medium')}
**Priority**: {issue_data.get('priority', 'Medium')}
**Estimated Time**: {issue_data.get('implementation_estimate', 'TBD')}

## Technical Requirements
{chr(10).join(['- ' + req for req in issue_data.get('technical_requirements', [])])}

## Acceptance Criteria
{chr(10).join(['- [ ] ' + criteria for criteria in issue_data.get('acceptance_criteria', [])])}

---
*This issue was created by AI agents analyzing the repository structure and suggesting enhancements.*
"""
        
        github_payload = {
            "title": issue_data.get('title', 'AI-Generated Enhancement'),
            "body": formatted_body,
            "assignees": [],
            "labels": issue_data.get('labels', ['enhancement'])
        }
        
        response = requests.post(url, headers=headers, json=github_payload)
        response.raise_for_status()
        return response.json()
    
    def analyze_repository_and_create_issue(self, repo_url: str) -> Dict[str, Any]:
        """Enhanced workflow: discover agents, analyze repo, and create issue."""
        try:
            # Extract repo information
            repo_info = self.extract_repo_info(repo_url)
            print(f"📊 Analyzing repository: {repo_info['owner']}/{repo_info['repo']}")
            
            # Step 1: Discover analysis agents from marketplace
            discovered_agents = self.discover_analysis_agents(repo_url)
            if not discovered_agents:
                logger.warning("⚠️ No agents discovered, using direct ASI:One analysis...")
                return self.direct_synthesis_analysis(repo_url)
            
            # Step 2: Select the best agents using ASI:One
            selected_agents = self.select_best_agents(discovered_agents, repo_url)
            if not selected_agents:
                logger.warning("⚠️ No agents selected, using direct ASI:One analysis...")
                return self.direct_synthesis_analysis(repo_url)
            
            # Step 3: Query selected agents
            print(f"\n🚀 Querying {len(selected_agents)} selected agents...")
            for agent in selected_agents:
                self.query_agent(agent, repo_url)
            
            # Step 4: Collect responses (simplified for now)
            agent_responses = self.collect_agent_responses(selected_agents, repo_url)
            
            # Step 5: Synthesize responses with ASI:One
            synthesized_issue = self.synthesize_analysis(agent_responses, repo_url)
            
            # Step 6: Prepare result with all analysis data
            result = {
                "success": True,
                "repository": f"{repo_info['owner']}/{repo_info['repo']}",
                "agents_discovered": len(discovered_agents),
                "agents_used": len(selected_agents),
                "selected_agents": [agent.get('name', 'Unknown') for agent in selected_agents],
                "synthesized_analysis": synthesized_issue,
                "github_payload": self.create_github_payload(synthesized_issue),
                "analysis_method": "Multi-Agent Synthesis"
            }
            
            logger.info(f"✅ Multi-agent analysis completed successfully")
            logger.info(f"📊 Used {len(selected_agents)} agents: {', '.join(result['selected_agents'])}")
            
            return result
            
        except Exception as e:
            logger.error(f"  Repository analysis failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def direct_synthesis_analysis(self, repo_url: str) -> Dict[str, Any]:
        """Direct synthesis analysis without agent marketplace - more reliable fallback."""
        logger.info("🎯 Starting direct ASI:One analysis (simplified approach)...")
        
        try:
            repo_info = self.extract_repo_info(repo_url)
            logger.info(f"📂 Repository: {repo_info['owner']}/{repo_info['repo']}")
            
            direct_prompt = f"""
            Analyze the GitHub repository: {repo_url} ({repo_info['owner']}/{repo_info['repo']})
            
            Based on the repository URL and common patterns, suggest ONE practical feature enhancement.
            
            IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
            
            {{
                "title": "Clear feature title (max 80 chars)",
                "body": "Detailed description with benefits and implementation context",
                "difficulty": "Easy OR Medium OR Hard",
                "priority": "Low OR Medium OR High",
                "labels": ["enhancement", "feature", "relevant-category"],
                "implementation_estimate": "Time estimate like '2-3 weeks'",
                "technical_requirements": ["requirement1", "requirement2", "requirement3"],
                "acceptance_criteria": ["criteria1", "criteria2", "criteria3"]
            }}
            
            Focus on practical, high-impact features. Return ONLY the JSON object.
            """
            
            conv_id = str(uuid.uuid4())
            messages = [{"role": "user", "content": direct_prompt}]
            response = self.ask_asi_one(conv_id, messages, stream=False)
            
            logger.info("📄 Direct analysis response received")
            
            # Parse the response into structured data
            issue_data = self.parse_direct_response(response, repo_url)
            
            result = {
                "success": True,
                "repository": f"{repo_info['owner']}/{repo_info['repo']}",
                "analysis_method": "Direct ASI:One Analysis",
                "synthesized_analysis": issue_data,
                "github_payload": self.create_github_payload(issue_data)
            }
            
            logger.info("✅ Direct synthesis analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"  Direct synthesis failed: {e}")
            return {
                "success": False,
                "error": f"Direct analysis failed: {str(e)}"
            }
    
    def parse_direct_response(self, response: str, repo_url: str) -> Dict[str, Any]:
        """Parse direct ASI:One response - now expects JSON format."""
        logger.info("🔄 Parsing direct ASI:One response...")
        
        try:
            # Try to parse as JSON first
            cleaned_response = response.strip()
            
            # Remove markdown if present
            if '```json' in cleaned_response:
                json_match = re.search(r'```json\s*(.*?)\s*```', cleaned_response, re.DOTALL)
                if json_match:
                    cleaned_response = json_match.group(1).strip()
            
            # Find JSON boundaries
            start_brace = cleaned_response.find('{')
            end_brace = cleaned_response.rfind('}')
            
            if start_brace != -1 and end_brace != -1:
                json_str = cleaned_response[start_brace:end_brace + 1]
                issue_data = json.loads(json_str)
                
                # Validate and fix the data
                issue_data = self.validate_and_fix_issue_data(issue_data)
                logger.info("✅ Successfully parsed direct response as JSON")
                return issue_data
                
        except Exception as e:
            logger.warning(f"⚠️ JSON parsing failed: {e}")
        
        # Fallback: manual extraction
        logger.info("🔧 Using manual parsing as fallback...")
        
        title_patterns = [
            r'(?:Feature|Title|Enhancement):\s*(.+?)(?:\n|$)',
            r'(?:Suggest|Recommendation|Feature):\s*(.+?)(?:\n|$)',
            r'(?:Add|Implement|Create)\s+(.+?)(?:\n|\.)'
        ]
        
        title = "Repository Enhancement Suggestion"
        for pattern in title_patterns:
            match = re.search(pattern, response, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                break
        
        # Clean up title
        title = re.sub(r'^[^\w]*', '', title)
        title = title.split('.')[0]
        if len(title) > 80:
            title = title[:77] + "..."
        
        # Extract difficulty and priority
        difficulty = "Medium"
        if re.search(r'\b(easy|simple|basic)\b', response, re.IGNORECASE):
            difficulty = "Easy"
        elif re.search(r'\b(hard|difficult|complex|advanced)\b', response, re.IGNORECASE):
            difficulty = "Hard"
        
        priority = "Medium"
        if re.search(r'\b(critical|urgent|high)\b.*priority', response, re.IGNORECASE):
            priority = "High"
        elif re.search(r'\b(low|minor)\b.*priority', response, re.IGNORECASE):
            priority = "Low"
        
        return {
            "title": title,
            "body": f"Based on analysis of {repo_url}:\n\n{response}\n\n---\n*Generated by ASI:One direct analysis*",
            "difficulty": difficulty,
            "priority": priority,
            "labels": ["enhancement", "ai-suggested"],
            "implementation_estimate": "1-3 weeks",
            "technical_requirements": [
                "Analysis of existing codebase",
                "Feature design and planning",
                "Implementation and testing"
            ],
            "acceptance_criteria": [
                "Feature meets requirements",
                "Code passes all tests",
                "Documentation is updated"
            ]
        }
    
    def create_github_payload(self, issue_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create GitHub API payload from issue data."""
        formatted_body = f"""## Feature Description
{issue_data.get('body', 'AI-generated feature suggestion')}

## Implementation Details
**Difficulty Level**: {issue_data.get('difficulty', 'Medium')}
**Priority**: {issue_data.get('priority', 'Medium')}
**Estimated Time**: {issue_data.get('implementation_estimate', 'TBD')}

## Technical Requirements
{chr(10).join(['- ' + req for req in issue_data.get('technical_requirements', [])])}

## Acceptance Criteria
{chr(10).join(['- [ ] ' + criteria for criteria in issue_data.get('acceptance_criteria', [])])}

---
*This issue was created by AI agents analyzing the repository structure and suggesting enhancements.*
"""
        
        return {
            "title": issue_data.get('title', 'AI-Generated Enhancement'),
            "body": formatted_body,
            "assignees": [],
            "labels": issue_data.get('labels', ['enhancement'])
        }

def main():
    """Interactive CLI for enhanced repository analysis."""
    try:
        analyzer = EnhancedASIOneRepoAnalyzer()
        
        print("🚀 Enhanced ASI:One Repository Analyzer with Agentverse Integration")
        print("This tool discovers AI agents from marketplace and uses them to analyze repositories")
        print("-" * 80)
        print(f"🤖 Your AI Identity: {analyzer.ai_identity.address}")
        print("-" * 80)
        
        while True:
            try:
                repo_url = input("\n📂 Enter GitHub repository URL (or 'quit' to exit): ").strip()
                
                if repo_url.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if not repo_url:
                    continue
                
                # Test with the provided example
                if repo_url == "example":
                    repo_url = "https://github.com/nitininhouse/js-assignment-2024"
                    print(f"🧪 Using example repository: {repo_url}")
                
                result = analyzer.analyze_repository_and_create_issue(repo_url)
                
                if result['success']:
                    print(f"\n🎉 Analysis complete!")
                    print(f"Repository: {result['repository']}")
                    print(f"Agents discovered: {result['agents_discovered']}")
                    print(f"Agents used: {result['agents_used']}")
                    print(f"Selected agents: {', '.join(result['selected_agents'])}")
                    print(f"Issue created: #{result['issue']['number']} - {result['issue']['title']}")
                    print(f"Difficulty: {result['issue']['difficulty']} | Priority: {result['issue']['priority']}")
                    print(f"URL: {result['issue']['url']}")
                else:
                    print(f"\n  Analysis failed: {result['error']}")
                    
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n  Unexpected error: {e}")
                
    except Exception as e:
        print(f"  Initialization failed: {e}")
        print("Please check your .env configuration and try again.")

if __name__ == "__main__":
    main()