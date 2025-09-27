import os
import json
import re
from datetime import datetime
from uuid import uuid4
from dotenv import load_dotenv
from uagents import Agent, Context, Model, Protocol
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# Import chat protocol components
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

# Import MeTTa components (following singularity-net-metta pattern)
from hyperon import MeTTa
from issue.knowledge import initialize_knowledge_graph
from issue.repositoryrag import RepositoryRAG
from issue.utils import process_repository_query

# Load environment variables from .env file
load_dotenv()

# Initialize MeTTa knowledge system (following singularity-net-metta pattern)
metta = MeTTa()
initialize_knowledge_graph(metta)
repository_rag = RepositoryRAG(metta)

# --- Message Models for Original Protocol ---
class QueryRequest(Model):
    """A request to the LangChain agent."""
    text: str

class QueryResponse(Model):
    """A response from the LangChain agent."""
    text: str

# --- Enhanced Repository Analysis Adapter ---
class RepositoryAnalysisAdapter:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash-preview-05-20"):
        """
        Initializes the Repository Analysis adapter with Google Gemini.
        Specialized for analyzing GitHub repositories and suggesting features.
        """
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=api_key, 
            model=model,
            convert_system_message_to_human=True,
            temperature=0.7,  # Balance creativity and accuracy
            max_tokens=4000   # Allow for detailed responses
        )
        print("Repository Analysis Adapter initialized with Google Gemini.")
        
        # System prompt for repository analysis
        self.system_prompt = """
You are an expert software architect and code analyst specializing in repository analysis and feature enhancement suggestions. Your role is to:

1. Analyze GitHub repositories and understand their structure, purpose, and technology stack
2. Suggest practical, impactful features that would enhance the project
3. Provide implementation difficulty assessments (Easy/Medium/Hard)  
4. Create actionable GitHub issue descriptions with clear acceptance criteria
5. Consider modern development practices and user experience improvements

When analyzing a repository URL, focus on:
- Technology stack and architecture
- Current functionality and limitations
- Industry best practices and modern features
- User experience improvements
- Performance and security enhancements
- Developer experience improvements

Always provide specific, implementable suggestions with clear business value.
"""

    def extract_repo_url(self, query: str) -> str:
        """Extract GitHub repository URL from query text."""
        # Look for GitHub URLs in the query
        github_patterns = [
            r'https://github\.com/([^/\s,]+)/([^/\s,]+)',
            r'github\.com/([^/\s,]+)/([^/\s,]+)',
            r'https://www\.github\.com/([^/\s,]+)/([^/\s,]+)'
        ]
        
        for pattern in github_patterns:
            match = re.search(pattern, query)
            if match:
                owner, repo = match.groups()
                # Clean up repo name (remove any trailing punctuation)
                repo = re.sub(r'[^\w\-.]', '', repo)
                return f"https://github.com/{owner}/{repo}"
        
        return None

    async def analyze_repository(self, query: str) -> str:
        """
        Analyzes a repository and provides enhancement suggestions.
        Optimized for ASI:One and GitHub repository analysis requests.
        """
        # Extract GitHub URL from query if present
        repo_url = self.extract_repo_url(query)
        
        # Check if this is a repository analysis request (with safe handling)
        query_lower = query.lower() if query else ""
        is_repo_query = any(keyword in query_lower for keyword in [
            'repository', 'repo', 'github.com', 'analyze', 'features', 'suggestions'
        ]) or repo_url is not None
        
        if is_repo_query and repo_url:
            # Enhanced prompt for repository analysis with extracted URL
            enhanced_query = f"""
{self.system_prompt}

Repository Analysis Request:
Repository URL: {repo_url}
User Query: {query}

Please analyze the GitHub repository at {repo_url} and provide a comprehensive analysis with the following structure:

## Repository Analysis
[Brief analysis of the repository's purpose and current state]

## Suggested Features (3-5 recommendations):

### Feature 1: [Feature Name]
**Difficulty**: Easy/Medium/Hard
**Priority**: Low/Medium/High  
**Implementation Time**: [Estimate]
**Description**: [Detailed description]
**Business Value**: [Why this matters]
**Technical Implementation**: [How to implement]
**Acceptance Criteria**: 
- [ ] [Criteria 1]
- [ ] [Criteria 2]

[Repeat for each feature...]

## Recommended Priority Feature
[Select the most impactful feature and provide a GitHub-ready issue description]

**GitHub Issue Title**: [Clear, actionable title]
**Issue Description**: [Detailed description ready for GitHub issue creation]

Note: Do not attempt to fetch or access the repository directly. Provide analysis based on the repository URL structure and common patterns for similar projects.
"""
        elif is_repo_query:
            # Repository query without clear URL
            enhanced_query = f"""
{self.system_prompt}

Repository Analysis Request (no specific URL found):
{query}

Please provide general repository enhancement suggestions based on the query context.
"""
        else:
            # Regular query processing
            enhanced_query = f"{self.system_prompt}\n\nQuery: {query}"
        
        messages = [HumanMessage(content=enhanced_query)]
        result = await self.llm.ainvoke(messages)
        return result.content

    def extract_github_issue_data(self, response: str) -> dict:
        """
        Extracts structured data for GitHub issue creation from the AI response.
        """
        try:
            # Extract GitHub issue title
            title_match = re.search(r'\*\*GitHub Issue Title\*\*:\s*(.+)', response)
            title = title_match.group(1).strip() if title_match else "AI-Suggested Repository Enhancement"
            
            # Extract issue description
            desc_match = re.search(r'\*\*Issue Description\*\*:\s*(.+?)(?:\n\n|\Z)', response, re.DOTALL)
            description = desc_match.group(1).strip() if desc_match else response
            
            # Extract difficulty
            diff_match = re.search(r'\*\*Difficulty\*\*:\s*(Easy|Medium|Hard)', response)
            difficulty = diff_match.group(1) if diff_match else "Medium"
            
            # Extract priority  
            priority_match = re.search(r'\*\*Priority\*\*:\s*(Low|Medium|High)', response)
            priority = priority_match.group(1) if priority_match else "Medium"
            
            return {
                "title": title,
                "description": description,
                "difficulty": difficulty,
                "priority": priority,
                "full_analysis": response
            }
        except Exception as e:
            print(f"Error extracting issue data: {e}")
            return {
                "title": "AI-Suggested Repository Enhancement",
                "description": response,
                "difficulty": "Medium", 
                "priority": "Medium",
                "full_analysis": response
            }

# Initialize the adapter
GOOGLE_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file. Please add it.")

repo_analyzer = RepositoryAnalysisAdapter(api_key=GOOGLE_KEY)

# --- Agent Protocol Handlers ---
# Original protocol for backward compatibility
query_protocol = Protocol("LangChainQuery")

@query_protocol.on_message(model=QueryRequest, replies=QueryResponse)
async def handle_query(ctx: Context, sender: str, msg: QueryRequest):
    """
    Handles original QueryRequest messages for backward compatibility.
    """
    ctx.logger.info(f"Received QueryRequest from {sender}: '{msg.text}'")

    try:
        # Check if this is a GitHub repository URL
        repo_url = repo_analyzer.extract_repo_url(msg.text)
        
        if repo_url:
            # Use MeTTa knowledge system for feature suggestions
            metta_features = process_repository_query(repo_url, repository_rag)
            
            # Format response with name and description structure
            response_text = "## Suggested Features:\n\n"
            for i, feature in enumerate(metta_features, 1):
                response_text += f"{i}. **{feature['name']}**\n   {feature['description']}\n\n"
        else:
            # Fallback to regular LLM analysis
            response_text = await repo_analyzer.analyze_repository(msg.text)
        
        ctx.logger.info(f"Generated repository analysis response")
        await ctx.send(sender, QueryResponse(text=response_text))

    except Exception as e:
        error_message = f"Failed to analyze repository: {e}"
        ctx.logger.error(error_message)
        await ctx.send(sender, QueryResponse(text=error_message))

# Enhanced chat protocol for ASI:One integration
chat_protocol = Protocol(spec=chat_protocol_spec)

@chat_protocol.on_message(ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    """
    Enhanced chat message handler optimized for ASI:One repository analysis requests.
    Supports structured responses and GitHub issue creation data.
    """
    ctx.logger.info(f"Received chat message from {sender}")
    
    # Send acknowledgment immediately
    ack = ChatAcknowledgement(
        timestamp=datetime.utcnow(),
        acknowledged_msg_id=msg.msg_id
    )
    await ctx.send(sender, ack)
    
    # Process each content item
    for item in msg.content:
        if isinstance(item, TextContent):
            query_text = item.text
            ctx.logger.info(f"Analyzing repository query: '{query_text[:100]}...'")
            
            # Clean the query text to prevent URL issues
            cleaned_query = query_text.strip()
            # Remove any trailing commas or unwanted characters
            cleaned_query = re.sub(r'[,\s]+$', '', cleaned_query)
            
            try:
                # Check if this is a GitHub repository URL
                repo_url = repo_analyzer.extract_repo_url(cleaned_query)
                
                if repo_url:
                    # Use MeTTa knowledge system for feature suggestions
                    print(f"Processing repository URL: {repo_url}")
                    metta_features = process_repository_query(repo_url, repository_rag)
                    print(f"MeTTa features: {metta_features}")
                    
                    # Also get LLM analysis for additional context
                    print("Getting LLM analysis...")
                    analysis_result = await repo_analyzer.analyze_repository(cleaned_query)
                    print(f"LLM analysis result: {analysis_result[:100]}...")
                    
                    # Format response with MeTTa features (name and description as requested)
                    feature_list = ""
                    for i, feature in enumerate(metta_features, 1):
                        feature_list += f"{i}. **{feature['name']}**\n   {feature['description']}\n\n"
                    
                    formatted_response = f"""## Repository Analysis Complete

### 🚀 Suggested Features:

{feature_list}

### 📋 Detailed Analysis:
{analysis_result}

*Features suggested using MeTTa knowledge graph integrated with AI analysis.*
"""
                else:
                    # Fallback to regular LLM analysis
                    analysis_result = await repo_analyzer.analyze_repository(cleaned_query)
                    formatted_response = f"## Repository Analysis Complete\n\n{analysis_result}"
                
                ctx.logger.info(f"Generated comprehensive repository analysis")
                
                # Send structured response
                response_msg = ChatMessage(
                    timestamp=datetime.utcnow(),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=formatted_response)]
                )
                await ctx.send(sender, response_msg)
                
            except Exception as e:
                error_message = f"Repository analysis failed: {str(e)}"
                ctx.logger.error(error_message)
                import traceback
                traceback.print_exc()
                
                # Send error response
                error_msg = ChatMessage(
                    timestamp=datetime.utcnow(),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=error_message)]
                )
                await ctx.send(sender, error_msg)

@chat_protocol.on_message(ChatAcknowledgement)
async def handle_chat_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """
    Handles acknowledgements from ASI:One and other agents.
    """
    ctx.logger.info(f"Received acknowledgement from {sender} for message: {msg.acknowledged_msg_id}")

# --- Agent Setup ---
agent = Agent(
    name="repository_analysis_agent",
    port=8000,
    seed="repository_analyzer_secret_phrase",
    mailbox=True,
    publish_agent_details=True
)

# Include both protocols for maximum compatibility
agent.include(query_protocol)
agent.include(chat_protocol, publish_manifest=True)

@agent.on_event("startup")
async def startup_handler(ctx: Context):
    """
    Agent startup handler with detailed information.
    """
    ctx.logger.info(f"Repository Analysis Agent Started")
    ctx.logger.info(f"Agent Address: {ctx.agent.address}")
    ctx.logger.info(f"Agent Name: {ctx.agent.name}")
    ctx.logger.info(f"Protocols: QueryRequest/Response + ChatMessage/Acknowledgement")
    ctx.logger.info(f"Specialization: GitHub Repository Analysis & Feature Suggestions")
    ctx.logger.info(f"AI Model: Google Gemini 2.5 Flash")
    ctx.logger.info(f"Ready for ASI:One integration!")

if __name__ == "__main__":
    print("Repository Analysis Agent with Enhanced Chat Protocol")
    print("=" * 70)
    print(f"Agent Address: {agent.address}")
    print(f"Agent Name: repository_analysis_agent")
    print(f"Port: 8000")
    print(f"Endpoint: http://127.0.0.1:8000/submit")
    print("=" * 70)
    print("Supported Protocols:")
    print("  1. QueryRequest/QueryResponse - Original protocol")
    print("  2. ChatMessage/ChatAcknowledgement - Enhanced chat protocol")
    print("=" * 70)  
    print("Specializations:")
    print("  - GitHub repository analysis")
    print("  - Feature enhancement suggestions")
    print("  - Implementation difficulty assessment")
    print("  - GitHub issue creation support")
    print("  - Modern web development recommendations")
    print("=" * 70)
    print("Ready for ASI:One agentic LLM queries!")
    print("Send repository URLs for comprehensive analysis...")
    agent.run()