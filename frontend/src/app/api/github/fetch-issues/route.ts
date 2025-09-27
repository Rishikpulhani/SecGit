import { NextRequest, NextResponse } from 'next/server';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
  repository: {
    full_name: string;
    html_url: string;
  };
}

interface ProcessedIssue {
  id: number;
  title: string;
  description: string;
  repository: string;
  repoUrl: string;
  type: string;
  severity: string;
  bounty: number;
  estimatedHours: number;
  applicants: number;
  tags: string[];
  createdAt: string;
  issueNumber: number;
  author: string;
  comments: number;
  status: 'open' | 'closed';
  html_url: string;
}

export async function GET(request: NextRequest) {
  try {
    const repositories = [
      'gyanshupathak/heatlh_panel',
      'gyanshupathak/SolVest'
    ];

    const allIssues: ProcessedIssue[] = [];

    for (const repo of repositories) {
      try {
        // Fetch issues from GitHub API (public access, no auth needed for public repos)
        const response = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=50`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SecGit-Platform'
          }
        });

        if (!response.ok) {
          console.warn(`Failed to fetch issues from ${repo}:`, response.status);
          continue;
        }

        const issues: GitHubIssue[] = await response.json();

        // Process each issue
        for (const issue of issues) {
          // Skip pull requests (they have pull_request property)
          if ('pull_request' in issue) {
            continue;
          }

          // Extract type and severity from labels
          const labels = issue.labels.map(label => label.name.toLowerCase());
          let type = 'feature';
          let severity = 'medium';

          // Determine type from labels
          if (labels.some(l => ['bug', 'bugfix', 'fix'].includes(l))) {
            type = 'bug';
          } else if (labels.some(l => ['security', 'vulnerability', 'sec'].includes(l))) {
            type = 'security';
          } else if (labels.some(l => ['performance', 'optimization', 'optimize'].includes(l))) {
            type = 'performance';
          } else if (labels.some(l => ['enhancement', 'feature', 'improvement'].includes(l))) {
            type = 'enhancement';
          }

          // Determine severity from labels
          if (labels.some(l => ['critical', 'urgent'].includes(l))) {
            severity = 'critical';
          } else if (labels.some(l => ['high', 'important'].includes(l))) {
            severity = 'high';
          } else if (labels.some(l => ['medium', 'normal'].includes(l))) {
            severity = 'medium';
          } else if (labels.some(l => ['low', 'minor'].includes(l))) {
            severity = 'low';
          }

          // Calculate bounty based on severity and type
          let bounty = 0.3; // base bounty
          if (severity === 'critical') bounty += 0.7;
          else if (severity === 'high') bounty += 0.5;
          else if (severity === 'medium') bounty += 0.3;
          else bounty += 0.1;

          if (type === 'security') bounty += 0.2;
          else if (type === 'bug') bounty += 0.1;

          // Estimate hours based on complexity
          let estimatedHours = 8; // base
          if (severity === 'critical') estimatedHours += 8;
          else if (severity === 'high') estimatedHours += 4;
          else if (severity === 'low') estimatedHours -= 2;

          if (type === 'security') estimatedHours += 4;
          else if (type === 'performance') estimatedHours += 2;

          // Generate some interest (random between 1-5)
          const applicants = Math.floor(Math.random() * 5) + 1;

          const processedIssue: ProcessedIssue = {
            id: issue.id,
            title: issue.title,
            description: issue.body || 'No description provided',
            repository: repo,
            repoUrl: `https://github.com/${repo}`,
            type,
            severity,
            bounty: Math.round(bounty * 100) / 100, // Round to 2 decimal places
            estimatedHours: Math.max(2, estimatedHours), // Minimum 2 hours
            applicants,
            tags: labels.slice(0, 4), // Take first 4 labels as tags
            createdAt: issue.created_at,
            issueNumber: issue.number,
            author: issue.user.login,
            comments: issue.comments,
            status: issue.state,
            html_url: issue.html_url
          };

          allIssues.push(processedIssue);
        }
      } catch (error) {
        console.error(`Error fetching issues from ${repo}:`, error);
        continue;
      }
    }

    // Sort by creation date (newest first)
    allIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      issues: allIssues,
      count: allIssues.length
    });

  } catch (error) {
    console.error('GitHub issues fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub issues' },
      { status: 500 }
    );
  }
}
