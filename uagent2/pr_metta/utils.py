import json
import requests
import re
from .repositoryrag import PullRequestRAG

def extract_pr_info_from_url(pr_url: str):
    """Extract owner, repo, and PR number from GitHub PR URL."""
    try:
        # Handle various PR URL formats
        patterns = [
            r'https://github\.com/([^/]+)/([^/]+)/pull/(\d+)',
            r'github\.com/([^/]+)/([^/]+)/pull/(\d+)',
            r'https://www\.github\.com/([^/]+)/([^/]+)/pull/(\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, pr_url)
            if match:
                owner, repo, pr_number = match.groups()
                return {
                    'owner': owner,
                    'repo': repo,
                    'pr_number': int(pr_number),
                    'api_url': f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
                }
        
        print(f"Could not extract PR info from URL: {pr_url}")
        return None
    except Exception as e:
        print(f"Error extracting PR info: {e}")
        return None

def fetch_pr_data(pr_url: str):
    """Fetch comprehensive PR data from GitHub API."""
    try:
        pr_info = extract_pr_info_from_url(pr_url)
        if not pr_info:
            return None
        
        print(f"Fetching PR data from: {pr_info['api_url']}")
        
        # Fetch basic PR data
        response = requests.get(pr_info['api_url'])
        if response.status_code != 200:
            print(f"Failed to fetch PR data: {response.status_code}")
            return None
        
        pr_data = response.json()
        
        # Fetch files changed in the PR
        files_url = f"https://api.github.com/repos/{pr_info['owner']}/{pr_info['repo']}/pulls/{pr_info['pr_number']}/files"
        files_response = requests.get(files_url)
        files_data = files_response.json() if files_response.status_code == 200 else []
        
        # Fetch comments
        comments_url = pr_data.get('comments_url', '')
        comments_data = []
        if comments_url:
            comments_response = requests.get(comments_url)
            comments_data = comments_response.json() if comments_response.status_code == 200 else []
        
        # Fetch review comments
        review_comments_url = pr_data.get('review_comments_url', '')
        review_comments_data = []
        if review_comments_url:
            review_response = requests.get(review_comments_url)
            review_comments_data = review_response.json() if review_response.status_code == 200 else []
        
        # Extract relevant information
        processed_data = {
            'title': pr_data.get('title', ''),
            'body': pr_data.get('body', ''),
            'state': pr_data.get('state', ''),
            'number': pr_data.get('number', 0),
            'author': pr_data.get('user', {}).get('login', ''),
            'created_at': pr_data.get('created_at', ''),
            'updated_at': pr_data.get('updated_at', ''),
            'mergeable': pr_data.get('mergeable', None),
            'additions': pr_data.get('additions', 0),
            'deletions': pr_data.get('deletions', 0),
            'changed_files_count': pr_data.get('changed_files', 0),
            'commits': pr_data.get('commits', 0),
            'changed_files': [f['filename'] for f in files_data],
            'file_changes': [{
                'filename': f['filename'],
                'status': f['status'],
                'additions': f['additions'],
                'deletions': f['deletions'],
                'patch': f.get('patch', '')[:500]  # Limit patch size
            } for f in files_data],
            'comments_count': len(comments_data),
            'review_comments_count': len(review_comments_data),
            'labels': [label['name'] for label in pr_data.get('labels', [])],
            'assignees': [assignee['login'] for assignee in pr_data.get('assignees', [])],
            'requested_reviewers': [reviewer['login'] for reviewer in pr_data.get('requested_reviewers', [])],
            'base_branch': pr_data.get('base', {}).get('ref', ''),
            'head_branch': pr_data.get('head', {}).get('ref', ''),
            'url': pr_data.get('html_url', ''),
            'api_data': pr_info
        }
        
        print(f"Successfully fetched PR data: {processed_data['title']}")
        return processed_data
        
    except Exception as e:
        print(f"Error fetching PR data: {e}")
        import traceback
        traceback.print_exc()
        return None

def analyze_code_changes(file_changes):
    """Analyze the types of code changes in the PR."""
    change_summary = {
        'total_files': len(file_changes),
        'file_types': {},
        'change_types': {'added': 0, 'modified': 0, 'deleted': 0, 'renamed': 0},
        'language_distribution': {},
        'significant_changes': []
    }
    
    for file_change in file_changes:
        filename = file_change['filename']
        status = file_change['status']
        
        # Count change types
        if status in change_summary['change_types']:
            change_summary['change_types'][status] += 1
        else:
            change_summary['change_types']['modified'] += 1
        
        # Analyze file extensions
        ext = filename.split('.')[-1] if '.' in filename else 'no_extension'
        change_summary['file_types'][ext] = change_summary['file_types'].get(ext, 0) + 1
        
        # Language distribution (simplified)
        language_map = {
            'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript',
            'java': 'Java', 'cpp': 'C++', 'c': 'C', 'go': 'Go',
            'rs': 'Rust', 'php': 'PHP', 'rb': 'Ruby', 'md': 'Markdown'
        }
        language = language_map.get(ext, ext)
        change_summary['language_distribution'][language] = change_summary['language_distribution'].get(language, 0) + 1
        
        # Identify significant changes
        if file_change['additions'] + file_change['deletions'] > 50:
            change_summary['significant_changes'].append({
                'file': filename,
                'additions': file_change['additions'],
                'deletions': file_change['deletions']
            })
    
    return change_summary

def process_pr_query(pr_url: str, pr_rag: PullRequestRAG):
    """Process PR analysis query using MeTTa knowledge system."""
    try:
        print(f"Processing PR query for: {pr_url}")
        
        # Fetch PR data
        pr_data = fetch_pr_data(pr_url)
        if not pr_data:
            return [{"analysis": "Failed to fetch PR data", "description": "Could not retrieve PR information from GitHub"}]
        
        # Analyze code changes
        change_summary = analyze_code_changes(pr_data.get('file_changes', []))
        
        # Get comprehensive analysis plan from MeTTa
        analysis_result = pr_rag.get_comprehensive_analysis_plan(pr_data)
        
        # Format results for output
        formatted_results = []
        
        # Add PR overview
        formatted_results.append({
            "analysis": "PR Overview",
            "description": f"Title: {pr_data['title']}, Files: {change_summary['total_files']}, +{pr_data['additions']}/-{pr_data['deletions']}"
        })
        
        # Add change summary
        formatted_results.append({
            "analysis": "Change Analysis",
            "description": f"Languages: {', '.join(change_summary['language_distribution'].keys())}, Types: {pr_data.get('labels', [])}"
        })
        
        # Add MeTTa-based analysis suggestions
        for item in analysis_result['analysis_plan']:
            formatted_results.append({
                "analysis": item['area'].replace('_', ' ').title(),
                "description": item['description']
            })
        
        # Add specific recommendations based on PR data
        if pr_data['mergeable'] is False:
            formatted_results.append({
                "analysis": "Merge Conflicts",
                "description": "This PR has merge conflicts that need to be resolved before merging"
            })
        
        if pr_data['comments_count'] == 0 and pr_data['review_comments_count'] == 0:
            formatted_results.append({
                "analysis": "Review Status",
                "description": "No comments or reviews yet - consider requesting reviews from team members"
            })
        
        print(f"Generated {len(formatted_results)} analysis points for PR")
        return formatted_results
        
    except Exception as e:
        print(f"Error processing PR query: {e}")
        import traceback
        traceback.print_exc()
        return [{"analysis": "Error", "description": f"Failed to analyze PR: {str(e)}"}]

def classify_pr_priority(pr_data):
    """Classify PR priority based on various factors."""
    priority_score = 0
    factors = []
    
    # Check labels for priority indicators
    labels = [label.lower() for label in pr_data.get('labels', [])]
    if any(label in ['critical', 'urgent', 'hotfix'] for label in labels):
        priority_score += 3
        factors.append("Critical/Urgent labels")
    elif any(label in ['high', 'important'] for label in labels):
        priority_score += 2
        factors.append("High priority labels")
    
    # Check for security-related changes
    if any(keyword in pr_data['title'].lower() for keyword in ['security', 'vulnerability', 'auth']):
        priority_score += 2
        factors.append("Security-related changes")
    
    # Check file count and change size
    if pr_data['changed_files_count'] > 20:
        priority_score += 1
        factors.append("Large number of files changed")
    
    if pr_data['additions'] + pr_data['deletions'] > 1000:
        priority_score += 1
        factors.append("Large code changes")
    
    # Determine priority level
    if priority_score >= 4:
        priority = "High"
    elif priority_score >= 2:
        priority = "Medium"
    else:
        priority = "Low"
    
    return {
        'priority': priority,
        'score': priority_score,
        'factors': factors
    }