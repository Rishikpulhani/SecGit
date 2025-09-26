import { NextRequest, NextResponse } from 'next/server';

interface CreateIssueRequest {
  accessToken: string;
  repoUrl: string;
  title: string;
  body: string;
  labels?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, repoUrl, title, body, labels = [], severity, type }: CreateIssueRequest = await request.json();

    if (!accessToken || !repoUrl || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: accessToken, repoUrl, title, body' },
        { status: 400 }
      );
    }

    // Extract owner and repo from GitHub URL
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = urlMatch;
    const repoName = repo.replace(/\.git$/, ''); // Remove .git suffix if present

    // Prepare labels based on severity and type
    const issueLabels = [
      `security-${severity}`,
      `vulnerability`,
      `secgit-analysis`,
      type.toLowerCase().replace(/\s+/g, '-'),
      ...labels
    ];

    // Create GitHub issue
    const issueResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: issueLabels,
      }),
    });

    if (!issueResponse.ok) {
      const errorData = await issueResponse.json();
      
      if (issueResponse.status === 403) {
        return NextResponse.json(
          { error: 'Permission denied. You need write access to this repository to create issues.' },
          { status: 403 }
        );
      }
      
      if (issueResponse.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or not accessible.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: errorData.message || 'Failed to create GitHub issue' },
        { status: issueResponse.status }
      );
    }

    const issue = await issueResponse.json();

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        html_url: issue.html_url,
        state: issue.state,
        created_at: issue.created_at,
      }
    });

  } catch (error) {
    console.error('GitHub issue creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
