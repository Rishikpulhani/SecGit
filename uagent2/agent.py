import os
import json
import re
import requests
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

# Load environment variables from .env file
load_dotenv()

# Import MeTTa components for PR analysis
try:
    from hyperon import MeTTa
    from pr_metta.knowledge import initialize_pr_knowledge_graph
    from pr_metta.repositoryrag import PullRequestRAG
    from pr_metta.utils import process_pr_query
    METTA_AVAILABLE = True
    print("✅ MeTTa components loaded for PR analysis")
except ImportError as e:
    print(f"⚠️ MeTTa components not available: {e}")
    METTA_AVAILABLE = False
    MeTTa = None
    initialize_pr_knowledge_graph = None
    PullRequestRAG = None
    process_pr_query = None

# --- Message Models for PR Analysis ---
class PRQueryRequest(Model):
    """A request to analyze a Pull Request."""
    pr_url: str

class PRQueryResponse(Model):
    """A response from PR analysis."""
    analysis: str

# --- Pull Request Analysis Adapter ---
class PullRequestAnalysisAdapter:
    def __init__(self, api_key: str, github_token: str = None, model: str = "gemini-2.5-flash-preview-05-20"):
        """
        Initializes the Pull Request Analysis adapter with Google Gemini.
        Specialized for analyzing GitHub Pull Requests and providing insights.
        """
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=api_key, 
            model=model,
            convert_system_message_to_human=True,
            temperature=0.7,  # Balance creativity and accuracy
            max_tokens=4000   # Allow for detailed responses
        )
        self.github_token = github_token
        print("Pull Request Analysis Adapter initialized with Google Gemini.")
        
        # System prompt for PR analysis
        self.system_prompt = """
You are an expert code reviewer and pull request analyst. Your role is to:

1. Analyze GitHub Pull Requests thoroughly 
2. Understand the changes made, their purpose, and impact
3. Provide detailed code review insights
4. Identify potential issues, improvements, and risks
5. Assess code quality, security implications, and best practices
6. Generate comprehensive analysis reports

When analyzing a Pull Request, focus on:
- Code changes and their purpose
- Implementation quality and adherence to best practices
- Potential bugs, security vulnerabilities, or performance issues
- Testing coverage and approach
- Documentation updates needed
- Overall impact on the codebase
- Suggestions for improvement

Always provide constructive, actionable feedback with clear explanations.
"""

    def extract_pr_url(self, query: str) -> str:
        """Extract GitHub Pull Request URL from query text."""
        # Look for GitHub PR URLs in the query
        pr_patterns = [
            r'https://github\.com/([^/\s,]+)/([^/\s,]+)/pull/(\d+)',
            r'github\.com/([^/\s,]+)/([^/\s,]+)/pull/(\d+)',
            r'https://www\.github\.com/([^/\s,]+)/([^/\s,]+)/pull/(\d+)'
        ]
        
        for pattern in pr_patterns:
            match = re.search(pattern, query)
            if match:
                owner, repo, pr_number = match.groups()
                return f"https://github.com/{owner}/{repo}/pull/{pr_number}"
        
        return None

    def get_pr_data(self, pr_url: str) -> dict:
        """Fetch Pull Request data from GitHub API."""
        # Extract owner, repo, and PR number from URL
        match = re.search(r'github\.com/([^/]+)/([^/]+)/pull/(\d+)', pr_url)
        if not match:
            return None
        
        owner, repo, pr_number = match.groups()
        
        headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'PR-Analyzer-Agent'
        }
        
        if self.github_token:
            headers['Authorization'] = f'token {self.github_token}'
        
        try:
            # Get PR details
            pr_api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
            response = requests.get(pr_api_url, headers=headers)
            
            if response.status_code != 200:
                return None
            
            pr_data = response.json()
            
            # Get PR files/changes
            files_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
            files_response = requests.get(files_url, headers=headers)
            files_data = files_response.json() if files_response.status_code == 200 else []
            
            return {
                'title': pr_data.get('title', ''),
                'body': pr_data.get('body', ''),
                'state': pr_data.get('state', ''),
                'user': pr_data.get('user', {}).get('login', ''),
                'created_at': pr_data.get('created_at', ''),
                'updated_at': pr_data.get('updated_at', ''),
                'additions': pr_data.get('additions', 0),
                'deletions': pr_data.get('deletions', 0),
                'changed_files': pr_data.get('changed_files', 0),
                'files': files_data,
                'url': pr_url
            }
            
        except Exception as e:
            print(f"Error fetching PR data: {e}")
            return None

    async def analyze_pull_request(self, pr_url: str) -> str:
        """
        Analyzes a GitHub Pull Request and provides detailed insights.
        Optimized for comprehensive PR analysis.
        """
        # Get PR data from GitHub API
        pr_data = self.get_pr_data(pr_url)
        
        if not pr_data:
            return f"Error: Could not fetch data for Pull Request: {pr_url}"
        
        # Build comprehensive PR analysis prompt
        files_summary = ""
        if pr_data.get('files'):
            files_summary = "\n### Files Changed:\n"
            for file in pr_data['files'][:10]:  # Limit to first 10 files
                files_summary += f"- **{file.get('filename', 'Unknown')}**: {file.get('additions', 0)} additions, {file.get('deletions', 0)} deletions\n"
                if file.get('patch'):
                    # Include a snippet of the patch for context
                    patch_lines = file['patch'].split('\n')[:20]  # First 20 lines
                    files_summary += f"  ```diff\n  " + "\n  ".join(patch_lines) + "\n  ```\n\n"
        
        enhanced_query = f"""
{self.system_prompt}

Pull Request Analysis Request:
PR URL: {pr_url}

## Pull Request Details:
**Title**: {pr_data.get('title', 'N/A')}
**Author**: {pr_data.get('user', 'N/A')}
**State**: {pr_data.get('state', 'N/A')}
**Created**: {pr_data.get('created_at', 'N/A')}
**Last Updated**: {pr_data.get('updated_at', 'N/A')}

**Statistics**:
- Files Changed: {pr_data.get('changed_files', 0)}
- Lines Added: {pr_data.get('additions', 0)}
- Lines Deleted: {pr_data.get('deletions', 0)}

**Description**:
{pr_data.get('body', 'No description provided')}

{files_summary}

Please provide a comprehensive Pull Request analysis with the following structure:

## 🔍 Pull Request Analysis

### Summary
[Brief overview of what this PR does and its purpose]

### Code Changes Assessment
[Analysis of the actual code changes, their quality, and implementation approach]

### Potential Issues & Risks
[Identify any potential bugs, security concerns, or risks]

### Best Practices Compliance
[How well does this PR follow coding standards and best practices]

### Testing & Documentation
[Assessment of test coverage and documentation updates]

### Performance Impact
[Potential performance implications of these changes]

### Security Considerations
[Any security implications or vulnerabilities introduced]

### Recommendations
[Specific suggestions for improvement or areas of concern]

### Overall Assessment
[Final verdict: Approve, Request Changes, or Needs Discussion]

Provide a detailed, constructive analysis that would be valuable for code review.
"""
        
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
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GOOGLE_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file. Please add it.")

pr_analyzer = PullRequestAnalysisAdapter(api_key=GOOGLE_KEY, github_token=GITHUB_TOKEN)

# Initialize MeTTa knowledge system for PR analysis (if available)
if METTA_AVAILABLE:
    try:
        metta = MeTTa()
        initialize_pr_knowledge_graph(metta)
        pr_rag = PullRequestRAG(metta)
        print("✅ MeTTa PR knowledge system initialized")
    except Exception as e:
        print(f"⚠️ Failed to initialize MeTTa system: {e}")
        metta = None
        pr_rag = None
else:
    metta = None
    pr_rag = None
    print("⚠️ MeTTa system not available - using LLM-only analysis")

# --- Agent Protocol Handlers ---
# PR analysis protocol
pr_query_protocol = Protocol("PRAnalysisQuery")

@pr_query_protocol.on_message(model=PRQueryRequest, replies=PRQueryResponse)
async def handle_pr_query(ctx: Context, sender: str, msg: PRQueryRequest):
    """
    Handles PR analysis requests.
    """
    ctx.logger.info(f"Received PR analysis request from {sender}: '{msg.pr_url}'")

    try:
        # Check if this is a GitHub PR URL
        pr_url = pr_analyzer.extract_pr_url(msg.pr_url)
        
        if pr_url:
            # Use MeTTa knowledge system if available
            if pr_rag and process_pr_query:
                ctx.logger.info("Using MeTTa knowledge system for PR analysis")
                metta_features = process_pr_query(pr_url, pr_rag)
                
                # Format response with MeTTa analysis
                response_text = "## Pull Request Analysis (MeTTa Enhanced)\n\n"
                for i, feature in enumerate(metta_features, 1):
                    response_text += f"{i}. **{feature['analysis']}**\n   {feature['description']}\n\n"
            else:
                # Fallback to LLM-only analysis
                ctx.logger.info("Using LLM-only analysis for PR")
                analysis_result = await pr_analyzer.analyze_pull_request(pr_url)
                response_text = analysis_result
        else:
            response_text = f"Error: Invalid PR URL format. Expected GitHub PR URL like: https://github.com/owner/repo/pull/123"
        
        ctx.logger.info(f"Generated PR analysis response")
        await ctx.send(sender, PRQueryResponse(analysis=response_text))

    except Exception as e:
        error_message = f"Failed to analyze Pull Request: {e}"
        ctx.logger.error(error_message)
        await ctx.send(sender, PRQueryResponse(analysis=error_message))

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
                # Check if this is a GitHub PR URL
                pr_url = pr_analyzer.extract_pr_url(cleaned_query)
                
                if pr_url:
                    print(f"Processing Pull Request URL: {pr_url}")
                    
                    # Use MeTTa knowledge system if available
                    if pr_rag and process_pr_query:
                        print("Using MeTTa knowledge system for PR analysis")
                        metta_features = process_pr_query(pr_url, pr_rag)
                        print(f"MeTTa PR analysis: {metta_features}")
                        
                        # Also get LLM analysis for additional context
                        print("Getting LLM analysis...")
                        llm_analysis = await pr_analyzer.analyze_pull_request(pr_url)
                        
                        # Format response with MeTTa features
                        feature_list = ""
                        for i, feature in enumerate(metta_features, 1):
                            feature_list += f"{i}. **{feature['analysis']}**\n   {feature['description']}\n\n"
                        
                        formatted_response = f"""## Pull Request Analysis Complete

### 🔍 MeTTa Knowledge Analysis:

{feature_list}

### 📋 Detailed LLM Analysis:
{llm_analysis}

*Analysis provided by MeTTa-enhanced PR Analyzer Agent*
"""
                    else:
                        # Fallback to LLM-only analysis
                        analysis_result = await pr_analyzer.analyze_pull_request(pr_url)
                        print(f"PR analysis result: {analysis_result[:100]}...")
                        
                        formatted_response = f"""## Pull Request Analysis Complete

{analysis_result}

*Analysis provided by PR Analyzer Agent*
"""
                else:
                    # Not a PR URL - provide guidance
                    formatted_response = f"""## Error: Invalid Input

Expected a GitHub Pull Request URL in the format:
`https://github.com/owner/repo/pull/123`

You provided: {cleaned_query}

Please provide a valid GitHub PR URL for analysis."""
                
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
    name="pr_analysis_agent",
    port=8001,
    seed="pr_analyzer_secret_phrase",
    mailbox=True,
    publish_agent_details=True
)

# Include protocols for PR analysis
agent.include(pr_query_protocol)
agent.include(chat_protocol, publish_manifest=True)

@agent.on_event("startup")
async def startup_handler(ctx: Context):
    """
    Agent startup handler with detailed information.
    """
    ctx.logger.info(f"Pull Request Analysis Agent Started")
    ctx.logger.info(f"Agent Address: {ctx.agent.address}")
    ctx.logger.info(f"Agent Name: {ctx.agent.name}")
    ctx.logger.info(f"Protocols: PRQueryRequest/Response + ChatMessage/Acknowledgement")
    ctx.logger.info(f"Specialization: GitHub Pull Request Analysis & Code Review")
    ctx.logger.info(f"AI Model: Google Gemini 2.5 Flash")
    if METTA_AVAILABLE and pr_rag:
        ctx.logger.info(f"MeTTa Knowledge System: ✅ Active")
    else:
        ctx.logger.info(f"MeTTa Knowledge System: ❌ Not Available")
    ctx.logger.info(f"Ready for PR analysis!")

if __name__ == "__main__":
    print("Pull Request Analysis Agent with Enhanced Chat Protocol")
    print("=" * 70)
    print(f"Agent Address: {agent.address}")
    print(f"Agent Name: pr_analysis_agent")
    print(f"Port: 8001")
    print(f"Endpoint: http://127.0.0.1:8001/submit")
    print("=" * 70)
    print("Supported Protocols:")
    print("  1. PRQueryRequest/PRQueryResponse - PR analysis protocol")
    print("  2. ChatMessage/ChatAcknowledgement - Enhanced chat protocol")
    print("=" * 70)  
    print("Specializations:")
    print("  - GitHub Pull Request analysis")
    print("  - Code review and quality assessment")
    print("  - Security and performance analysis")
    print("  - Best practices compliance checking")
    print("  - Detailed change impact analysis")
    print("=" * 70)
    if METTA_AVAILABLE and pr_rag:
        print("🧠 MeTTa Knowledge System: ACTIVE - Enhanced PR analysis available")
    else:
        print("🧠 MeTTa Knowledge System: NOT AVAILABLE - Using LLM-only analysis")
    print("=" * 70)
    print("Ready for PR analysis queries!")
    print("Send GitHub PR URLs like: https://github.com/owner/repo/pull/123")
    agent.run()