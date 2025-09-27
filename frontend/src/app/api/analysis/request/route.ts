import { NextRequest, NextResponse } from 'next/server';

interface AnalysisRequest {
  githubUrl: string;
  userAddress: string;
  transactionHash: string;
}

interface AIAgentResponse {
  agents_discovered: number;
  agents_used: number;
  analysis_method: string;
  repository: string;
  selected_agents: string[];
  success: boolean;
  synthesized_analysis: {
    title: string;
    difficulty: string;
    priority: string;
    implementation_estimate: string;
    labels: string[];
    acceptance_criteria: string[];
    technical_requirements: string[];
    body: string;
  };
  github_payload: {
    title: string;
    body: string;
    labels: string[];
    assignees: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, userAddress, transactionHash }: AnalysisRequest = await request.json();

    if (!githubUrl || !userAddress || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: githubUrl, userAddress, transactionHash' },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = urlMatch;
    const repoName = repo.replace(/\.git$/, '');

    console.log('Starting AI analysis for:', {
      githubUrl,
      userAddress,
      transactionHash,
      owner,
      repoName
    });

    // TODO: In production, verify the blockchain transaction here
    // For now, we'll proceed directly to AI analysis

    try {
      // Call your friend's AI agent
      const aiResponse = await fetch('http://localhost:5000/api/analyze-repo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          repo_url: githubUrl 
        }),
        // Add timeout for AI agent call
        signal: AbortSignal.timeout(600000) // 10 minutes timeout
      });

      if (!aiResponse.ok) {
        throw new Error(`AI Agent responded with status: ${aiResponse.status}`);
      }

      const analysisResult: AIAgentResponse = await aiResponse.json();

      if (!analysisResult.success) {
        throw new Error('AI analysis reported failure');
      }

      // Generate unique analysis ID
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // TODO: In production, save to database
      // For now, we'll store in memory/localStorage simulation
      const analysisData = {
        id: analysisId,
        githubUrl,
        userAddress,
        transactionHash,
        status: 'completed',
        agentsDiscovered: analysisResult.agents_discovered,
        agentsUsed: analysisResult.agents_used,
        selectedAgents: analysisResult.selected_agents,
        analysisMethod: analysisResult.analysis_method,
        issue: {
          title: analysisResult.synthesized_analysis.title,
          difficulty: analysisResult.synthesized_analysis.difficulty,
          priority: analysisResult.synthesized_analysis.priority,
          estimatedTime: analysisResult.synthesized_analysis.implementation_estimate,
          labels: analysisResult.synthesized_analysis.labels,
          acceptanceCriteria: analysisResult.synthesized_analysis.acceptance_criteria,
          technicalRequirements: analysisResult.synthesized_analysis.technical_requirements,
          description: analysisResult.synthesized_analysis.body,
          githubPayload: analysisResult.github_payload
        },
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        analysisId,
        status: 'completed',
        agentsUsed: analysisResult.agents_used,
        agentsDiscovered: analysisResult.agents_discovered,
        selectedAgents: analysisResult.selected_agents,
        analysisMethod: analysisResult.analysis_method,
        issue: analysisData.issue,
        repositoryInfo: {
          owner,
          repo: repoName,
          url: githubUrl
        }
      });

    } catch (aiError: any) {
      console.error('AI Agent error:', aiError);
      
      if (aiError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI analysis timed out. Please try again.' },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { error: `AI analysis failed: ${aiError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Analysis request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve analysis results
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get('analysisId');

  if (!analysisId) {
    return NextResponse.json(
      { error: 'Missing analysisId parameter' },
      { status: 400 }
    );
  }

  // TODO: Retrieve from database
  // For now, return success status
  return NextResponse.json({
    analysisId,
    status: 'completed',
    message: 'Analysis completed successfully'
  });
}
