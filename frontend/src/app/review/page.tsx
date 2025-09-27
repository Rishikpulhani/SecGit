'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Github, ExternalLink, Plus, X, Bug, Shield, AlertCircle, Clock, DollarSign, Users, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { getTypeColor, getSeverityColor, getLabelClass } from '../../utils/labelUtils';

interface AIIssue {
  title: string;
  difficulty: string;
  priority: string;
  estimatedTime: string;
  labels: string[];
  acceptanceCriteria: string[];
  technicalRequirements: string[];
  description: string;
}

interface AnalysisResult {
  analysisId: string;
  agentsUsed: number;
  agentsDiscovered: number;
  selectedAgents: string[];
  analysisMethod: string;
  issue: AIIssue;
  repositoryInfo: {
    owner: string;
    repo: string;
    url: string;
  };
}

// No more mock data - using real AI analysis results

export default function IssueReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const githubUrl = searchParams.get('repo') || 'https://github.com/gyanshupathak/SolVest';
  const analysisData = searchParams.get('data');
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [realIssues, setRealIssues] = useState<any[]>([]);
  const [showAIResults, setShowAIResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  
  // Manual issue creation states
  const [showManualIssueForm, setShowManualIssueForm] = useState(false);
  const [existingIssues, setExistingIssues] = useState<any[]>([]);
  const [loadingExistingIssues, setLoadingExistingIssues] = useState(false);
  const [showExistingIssues, setShowExistingIssues] = useState(false);
  
  // Manual issue form data
  const [manualIssueForm, setManualIssueForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    type: 'feature',
    estimatedHours: 8
  });
  
  // Loading state for GitHub issue creation
  const [isCreatingIssues, setIsCreatingIssues] = useState(false);

  // Bounty calculation system - weighted averages between contract values and display weights
  const calculateBounty = (difficulty: string) => {
    // Contract hardcoded values (actual blockchain amounts)
    const contractValues = {
      'easy': 0.00001,   // 0.00001 ETH - actual contract value
      'low': 0.00001,    // 0.00001 ETH - alias for easy
      'medium': 0.00005, // 0.00005 ETH - actual contract value  
      'hard': 0.0001,    // 0.0001 ETH - actual contract value
      'high': 0.0001,    // 0.0001 ETH - alias for hard
      'critical': 0.0001 // 0.0001 ETH - alias for hard
    };
    
    // Display weight multipliers for realistic presentation
    const displayWeights = {
      'easy': 1,     // 1x multiplier for easy
      'low': 1,      // 1x multiplier for low
      'medium': 2,   // 2x multiplier for medium
      'hard': 3,     // 3x multiplier for hard
      'high': 3,     // 3x multiplier for high
      'critical': 3  // 3x multiplier for critical
    };
    
    const difficultyKey = difficulty.toLowerCase();
    const contractValue = contractValues[difficultyKey] || contractValues.medium;
    const weight = displayWeights[difficultyKey] || displayWeights.medium;
    
    // Calculate weighted average: (contract_value + weight) / 2
    // But multiply by 10000 to make it a reasonable display amount
    const scalingFactor = 10000; // Scale up for better display
    const weightedAverage = ((contractValue * scalingFactor) + weight) / 2;
    
    // Round to reasonable precision
    const finalBounty = Math.round(weightedAverage * 1000) / 1000;
    
    return {
      bounty: finalBounty,
      calculation: {
        difficulty: difficulty,
        contractValue: contractValue,
        displayWeight: weight,
        scalingFactor: scalingFactor,
        weightedAverage: weightedAverage,
        finalAmount: finalBounty,
        formula: `((${contractValue} × ${scalingFactor}) + ${weight}) ÷ 2 = ${finalBounty} ETH`
      }
    };
  };

  // Function to fetch existing GitHub issues
  const fetchExistingIssues = async () => {
    setLoadingExistingIssues(true);
    try {
      const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub URL');
      }
      
      const [, owner, repo] = repoMatch;
      const cleanRepo = repo.replace(/\.git$/, '');
      
      // Call GitHub API to fetch existing issues
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/issues?state=open&per_page=20`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const issues = await response.json();
      
      // Transform GitHub issues to our format
      const transformedIssues = issues.map((issue: any) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.body || 'No description provided',
        difficulty: 'medium', // Default difficulty
        type: issue.labels.some((l: any) => l.name.includes('bug')) ? 'bug' :
              issue.labels.some((l: any) => l.name.includes('security')) ? 'security' : 'feature',
        severity: issue.labels.some((l: any) => l.name.includes('critical')) ? 'critical' :
                 issue.labels.some((l: any) => l.name.includes('high')) ? 'high' :
                 issue.labels.some((l: any) => l.name.includes('low')) ? 'low' : 'medium',
        estimatedHours: 8, // Default estimate
        suggestedBounty: 1.25, // Default medium bounty
        githubUrl: issue.html_url,
        createdAt: issue.created_at,
        author: issue.user.login,
        labels: issue.labels.map((l: any) => l.name),
        hasExistingBounty: false // Track if bounty is already added
      }));
      
      setExistingIssues(transformedIssues);
    } catch (error: any) {
      console.error('Error fetching existing issues:', error);
      alert(`Failed to fetch existing issues: ${error.message}`);
    } finally {
      setLoadingExistingIssues(false);
    }
  };
  
  // Function to create manual issue
  const createManualIssue = () => {
    const bountyInfo = calculateBounty(manualIssueForm.difficulty);
    
    const newIssue = {
      id: Date.now(), // Temporary ID
      number: Math.floor(Math.random() * 1000) + 1000,
      type: manualIssueForm.type,
      title: manualIssueForm.title,
      description: manualIssueForm.description,
      severity: manualIssueForm.difficulty,
      estimatedHours: manualIssueForm.estimatedHours,
      suggestedBounty: bountyInfo.bounty,
      files: [], // Empty for manual issues
      isManual: true,
      createdAt: new Date().toISOString()
    };
    
    setRealIssues(prev => [...prev, newIssue]);
    
    // Reset form
    setManualIssueForm({
      title: '',
      description: '',
      difficulty: 'medium',
      type: 'feature',
      estimatedHours: 8
    });
    
    setShowManualIssueForm(false);
  };
  
  // Function to create GitHub issues for approved issues
  const createGitHubIssuesForApproved = async () => {
    const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub URL');
    }
    
    const [, owner, repo] = repoMatch;
    const cleanRepo = repo.replace(/\.git$/, '');
    const createdIssues: { [key: string]: any } = {};
    
    // Filter issues that need to be created (not from existing GitHub issues)
    const issuesToCreate = approvedIssues.filter(issue => !issue.isFromExisting);
    
    for (const issue of issuesToCreate) {
      try {
        const issuePayload = {
          title: issue.title,
          body: `## Description\n${issue.description}\n\n## Type\n${issue.type}\n\n## Severity\n${issue.severity}\n\n## Estimated Time\n${issue.estimatedHours} hours\n\n## Bounty\n${issue.suggestedBounty} ETH\n\n---\n\n*This issue was generated by SecGit AI analysis.*`,
          labels: [
            issue.type,
            issue.severity,
            'ai-generated',
            'bounty'
          ]
        };
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/issues`, {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
            // Note: In production, you'd need proper GitHub authentication
          },
          body: JSON.stringify(issuePayload)
        });
        
        if (response.ok) {
          const createdIssue = await response.json();
          createdIssues[issue.id] = createdIssue;
          console.log(`Created GitHub issue #${createdIssue.number}: ${issue.title}`);
        } else {
          console.error(`Failed to create GitHub issue for: ${issue.title}`, response.status);
          // Continue with other issues even if one fails
        }
      } catch (error) {
        console.error(`Error creating GitHub issue for: ${issue.title}`, error);
        // Continue with other issues
      }
    }
    
    return createdIssues;
  };

  // Function to add bounty to existing issue
  const addBountyToExistingIssue = (existingIssue: any, difficulty: string) => {
    const bountyInfo = calculateBounty(difficulty);
    
    const issueWithBounty = {
      ...existingIssue,
      severity: difficulty,
      suggestedBounty: bountyInfo.bounty,
      hasExistingBounty: true,
      isFromExisting: true
    };
    
    setRealIssues(prev => [...prev, issueWithBounty]);
    
    // Update the existing issues list to show bounty is added
    setExistingIssues(prev => 
      prev.map(issue => 
        issue.id === existingIssue.id 
          ? { ...issue, hasExistingBounty: true }
          : issue
      )
    );
  };

  // Helper function to create issue from analysis data
  const createIssueFromAnalysis = (parsed: any, isFromCache = false) => {
    const difficulty = parsed.issue?.difficulty?.toLowerCase() || 'medium';
    
    // Parse time estimate properly (handle weeks, days, hours)
    const timeString = parsed.issue?.estimatedTime || '8 hours';
    let estimatedHours = 8; // default
    
    if (timeString.includes('week')) {
      const weeks = parseInt(timeString.match(/(\d+)(?:\s*-\s*\d+)?\s*week/)?.[1] || '1');
      estimatedHours = weeks * 40; // Assume 40 hours per week
    } else if (timeString.includes('day')) {
      const days = parseInt(timeString.match(/(\d+)(?:\s*-\s*\d+)?\s*day/)?.[1] || '1');
      estimatedHours = days * 8; // Assume 8 hours per day
    } else if (timeString.includes('hour')) {
      estimatedHours = parseInt(timeString.match(/(\d+)(?:\s*-\s*\d+)?\s*hour/)?.[1] || '8');
    } else {
      // Fallback: extract first number
      estimatedHours = parseInt(timeString.match(/\d+/)?.[0] || '8');
    }
    
    const bountyInfo = calculateBounty(difficulty);
    
    return {
      id: 1,
      number: Math.floor(Math.random() * 1000) + 100,
      type: parsed.issue?.labels?.includes('security') ? 'security' : 
            parsed.issue?.labels?.includes('bug') ? 'bug' : 'feature',
      title: parsed.issue?.title || 'AI Generated Issue',
      description: parsed.issue?.description || 'AI analysis generated issue',
      severity: difficulty,
      estimatedHours: estimatedHours,
      suggestedBounty: bountyInfo.bounty,
      bountyCalculation: bountyInfo.calculation,
      files: [isFromCache ? 'AI Analysis (Cached)' : 'AI Analysis'],
      approved: false,
      author: 'ai-agent',
      createdAt: new Date().toISOString().split('T')[0],
      comments: 0,
      labels: parsed.issue?.labels || ['enhancement'],
      acceptanceCriteria: parsed.issue?.acceptanceCriteria || [],
      technicalRequirements: parsed.issue?.technicalRequirements || [],
      priority: parsed.issue?.priority || 'medium',
      agentsUsed: parsed.agentsUsed,
      agentsDiscovered: parsed.agentsDiscovered,
      selectedAgents: parsed.selectedAgents,
      analysisMethod: parsed.analysisMethod
    };
  };

  useEffect(() => {
    const fetchRealAnalysis = async () => {
      setLoading(true);
      try {
        // First, check localStorage for existing analysis
        const storageKey = `analysis_${githubUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const cachedAnalysis = localStorage.getItem(storageKey);
        
        if (analysisData) {
          // Use passed analysis data
          const parsed = JSON.parse(decodeURIComponent(analysisData));
          console.log('Parsed analysis data:', parsed);
          setAnalysisResult(parsed);
          
          // Also save to localStorage for future use
          localStorage.setItem(storageKey, JSON.stringify(parsed));
          
          const aiIssue = createIssueFromAnalysis(parsed, false);
          setRealIssues([aiIssue]);
          setShowAIResults(true);
          setLoading(false); // Ensure loading is turned off
        } else if (cachedAnalysis) {
          // Use cached analysis data
          const parsed = JSON.parse(cachedAnalysis);
          console.log('Using cached analysis data:', parsed);
          setAnalysisResult(parsed);
          
          const aiIssue = createIssueFromAnalysis(parsed, true);
          setRealIssues([aiIssue]);
          setShowAIResults(true);
          setLoading(false);
        } else {
          // Call real backend API directly
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout
          
          const response = await fetch('http://localhost:5000/api/analyze-repo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              repo_url: githubUrl
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const backendResult = await response.json();
            
            if (backendResult.success) {
              // Convert backend response to our format
              const difficulty = backendResult.synthesized_analysis.difficulty.toLowerCase();
              const estimatedHours = parseInt(backendResult.synthesized_analysis.implementation_estimate.match(/\d+/)?.[0] || '8');
              const bountyInfo = calculateBounty(difficulty);
              
              const aiIssue = {
                id: 1,
                number: Math.floor(Math.random() * 1000) + 100,
                type: backendResult.synthesized_analysis.labels.includes('security') ? 'security' : 
                      backendResult.synthesized_analysis.labels.includes('bug') ? 'bug' : 'feature',
                title: backendResult.synthesized_analysis.title,
                description: backendResult.synthesized_analysis.body,
                severity: difficulty,
                estimatedHours: estimatedHours,
                suggestedBounty: bountyInfo.bounty,
                bountyCalculation: bountyInfo.calculation,
                files: ['AI Analysis'],
                approved: false,
                author: 'ai-agent',
                createdAt: new Date().toISOString().split('T')[0],
                comments: 0,
                labels: backendResult.synthesized_analysis.labels,
                acceptanceCriteria: backendResult.synthesized_analysis.acceptance_criteria,
                technicalRequirements: backendResult.synthesized_analysis.technical_requirements,
                priority: backendResult.synthesized_analysis.priority,
                agentsUsed: backendResult.agents_used,
                agentsDiscovered: backendResult.agents_discovered,
                selectedAgents: backendResult.selected_agents,
                analysisMethod: backendResult.analysis_method
              };

              setRealIssues([aiIssue]);
              const analysisResultData = {
                analysisId: `analysis_${Date.now()}`,
                agentsUsed: backendResult.agents_used,
                agentsDiscovered: backendResult.agents_discovered,
                selectedAgents: backendResult.selected_agents,
                analysisMethod: backendResult.analysis_method,
                issue: {
                  title: backendResult.synthesized_analysis.title,
                  difficulty: backendResult.synthesized_analysis.difficulty,
                  priority: backendResult.synthesized_analysis.priority,
                  estimatedTime: backendResult.synthesized_analysis.implementation_estimate,
                  labels: backendResult.synthesized_analysis.labels,
                  acceptanceCriteria: backendResult.synthesized_analysis.acceptance_criteria,
                  technicalRequirements: backendResult.synthesized_analysis.technical_requirements,
                  description: backendResult.synthesized_analysis.body
                },
                repositoryInfo: {
                  owner: githubUrl.split('/')[3] || 'unknown',
                  repo: githubUrl.split('/')[4] || 'unknown',
                  url: githubUrl
                }
              };
              
              setAnalysisResult(analysisResultData);
              
              // Save to localStorage for future use
              localStorage.setItem(storageKey, JSON.stringify(analysisResultData));
              localStorage.setItem('lastAnalysisKey', storageKey);
              
              setShowAIResults(true);
            }
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch real analysis:', error);
        
        if (error.name === 'AbortError') {
          console.log('AI analysis timed out, will show loading state until user refreshes');
          // Keep loading state - user can refresh page to try again
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRealAnalysis();
  }, [analysisData, githubUrl]);

  const toggleApproval = (id: number) => {
    setRealIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, approved: !issue.approved } : issue
    ));
  };

  const currentIssues = realIssues;
  const approvedIssues = currentIssues.filter(issue => issue.approved);
  const totalBounty = approvedIssues.reduce((sum, issue) => sum + issue.suggestedBounty, 0);

  const handleConfirmListing = async () => {
    setIsCreatingIssues(true);
    try {
      // Create GitHub issues for approved issues that don't already exist in the repo
      const createdIssues = await createGitHubIssuesForApproved();
      
      // Prepare data for dashboard
      const dashboardData = {
        repository: githubUrl,
        issues: approvedIssues.map(issue => ({
          ...issue,
          githubIssueUrl: createdIssues[issue.id]?.html_url || null,
          githubIssueNumber: createdIssues[issue.id]?.number || null
        })),
        totalBounty: totalBounty,
        transactionHash: 'pending', // Will be updated when contract integration is complete
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Store in dashboard data
      const existingBounties = JSON.parse(localStorage.getItem('userBounties') || '[]');
      existingBounties.push(dashboardData);
      localStorage.setItem('userBounties', JSON.stringify(existingBounties));
      
      // Store approved issues for success page (if needed)
      localStorage.setItem('approvedIssuesForBounty', JSON.stringify(approvedIssues));
      
      // Redirect to dashboard
      router.push(`/dashboard?repo=${encodeURIComponent(githubUrl)}&created=${createdIssues.length}`);
      
    } catch (error) {
      console.error('Error creating GitHub issues:', error);
      alert('Failed to create some GitHub issues. Check console for details.');
      
      // Still proceed to dashboard even if some issues failed
      const dashboardData = {
        repository: githubUrl,
        issues: approvedIssues,
        totalBounty: totalBounty,
        transactionHash: 'pending',
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      const existingBounties = JSON.parse(localStorage.getItem('userBounties') || '[]');
      existingBounties.push(dashboardData);
      localStorage.setItem('userBounties', JSON.stringify(existingBounties));
      
      router.push(`/dashboard?repo=${encodeURIComponent(githubUrl)}`);
    } finally {
      setIsCreatingIssues(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return Shield;
      case 'bug': return Bug;
      case 'feature': return Plus;
      default: return AlertCircle;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="github-layout">
      <Header />
      
      <main className="pt-16">
        <div className="github-container">
          {/* Back Navigation */}
          <div className="py-4 border-b border-gray-800">
          <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </button>
          </div>

              {/* Repository Header */}
              <div className="py-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Github className="w-6 h-6 text-gray-400" />
                    <div>
                      <h1 className="text-xl font-medium text-white">
                        <span className="github-text-link font-normal">{githubUrl.split('/')[3]}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="font-medium">{githubUrl.split('/')[4]}</span>
                      </h1>
                      <p className="github-text-muted text-xs mt-0.5">
                        Security Analysis • Review AI-generated issues
                      </p>
                    </div>
                  </div>
                  {analysisResult && (
                    <div className="text-xs github-text-muted">
                      {analysisResult.agentsUsed} AI agents • {realIssues.length} issue{realIssues.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            
              {/* Loading State */}
              {loading && (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center text-gray-400 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-3"></div>
                    Analyzing repository...
                  </div>
                </div>
              )}

            
              {/* Issue Summary */}
              {!loading && currentIssues.length > 0 && (
                <div className="py-3 border-b border-gray-800">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {currentIssues.length} open
                      </span>
                    </div>
                    <div className="github-text-muted">
                      {approvedIssues.length > 0 && (
                        <>
                          <span className="text-white">{approvedIssues.length}</span> approved • 
                          <span className="text-green-400 ml-1">{totalBounty.toFixed(1)} ETH</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

          {/* Issues List */}
          {!loading && (
            <div className="border border-gray-800 rounded-md overflow-hidden">
            {currentIssues.map((issue, index) => {
              const isExpanded = expandedIssue === issue.id;
              
              return (
                <div 
                  key={issue.id} 
                  className={`hover:bg-gray-900/50 transition-colors ${index !== currentIssues.length - 1 ? 'border-b border-gray-800' : ''}`}
                >
                  {/* Main Issue Tile */}
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      {/* Issue Status */}
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      
                      {/* Issue Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-medium text-base">
                              {issue.title}
                              <span className="github-text-muted font-normal text-sm ml-2">#{issue.number}</span>
                            </h3>
                            <span className={`github-label ${getTypeColor(issue.type)}`}>
                              {issue.type}
                            </span>
                            <span className={`github-label ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-medium text-sm">{issue.suggestedBounty} ETH</span>
                            <span className="github-text-muted text-sm">{issue.estimatedHours}h</span>
                            
                            {/* Expand/Collapse Button */}
                            <button
                              onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                              className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            
                            {/* Approval Status */}
                            <button
                              onClick={() => toggleApproval(issue.id)}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                issue.approved
                                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                  : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                              }`}
                            >
                              {issue.approved ? '✓ Approved' : 'Approve'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Meta Information */}
                        <div className="flex items-center gap-3 text-xs github-text-muted mt-1">
                          <span>opened {formatDate(issue.createdAt)}</span>
                          <span>•</span>
                          <span className="github-label github-label-ai-generated">
                            AI Generated
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-800/50">
                      <div className="pt-4 space-y-4">
                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                          <p className="github-text-muted text-sm leading-relaxed">
                            {issue.description}
                          </p>
                        </div>
                        
                        {/* Acceptance Criteria */}
                        {issue.acceptanceCriteria && issue.acceptanceCriteria.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Acceptance Criteria</h4>
                            <ul className="text-sm text-gray-400 space-y-1">
                              {issue.acceptanceCriteria.map((criteria: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2 text-gray-500">•</span>
                                  <span>{criteria}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      
                        
                        {/* Bounty Calculation */}
                        {issue.bountyCalculation && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">💰 Bounty Calculation</h4>
                            <div className="text-sm text-gray-400 space-y-1">
                              <div className="flex justify-between">
                                <span>Difficulty Level:</span>
                                <span className="text-blue-400 capitalize">{issue.bountyCalculation.difficulty}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Fixed Bounty Amount:</span>
                                <span className="text-green-400 font-semibold">{issue.bountyCalculation.bountyAmount} ETH</span>
                              </div>
                              <div className="border-t border-gray-700/50 pt-2 mt-2">
                                <div className="text-xs text-gray-500 mb-1">Pricing Logic:</div>
                                <div className="text-xs text-gray-400 font-mono bg-gray-800/50 p-2 rounded">
                                  {issue.bountyCalculation.formula}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  💡 Time estimate ({issue.estimatedHours}h) is separate from bounty calculation
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}

          {/* Manual Issue Creation & Existing Issues Section */}
          {!loading && (
            <div className="mt-8 space-y-6">
              
              {/* Manual Issue Creation */}
              <div className="border border-gray-800 rounded-md overflow-hidden">
                <div className="bg-gray-900/50 px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4 text-blue-400" />
                      <h3 className="text-white font-medium">Create Manual Issue</h3>
                    </div>
                    <button
                      onClick={() => setShowManualIssueForm(!showManualIssueForm)}
                      className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded border border-blue-500/30 hover:border-blue-400/40 transition-colors"
                    >
                      {showManualIssueForm ? 'Cancel' : 'New Issue'}
                    </button>
                  </div>
                </div>
                
                {showManualIssueForm && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Issue Title *
                        </label>
                        <input
                          type="text"
                          value={manualIssueForm.title}
                          onChange={(e) => setManualIssueForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter issue title..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Difficulty
                          </label>
                          <select
                            value={manualIssueForm.difficulty}
                            onChange={(e) => setManualIssueForm(prev => ({ ...prev, difficulty: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Type
                          </label>
                          <select
                            value={manualIssueForm.type}
                            onChange={(e) => setManualIssueForm(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="feature">Feature</option>
                            <option value="bug">Bug</option>
                            <option value="security">Security</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hours
                          </label>
                          <input
                            type="number"
                            value={manualIssueForm.estimatedHours}
                            onChange={(e) => setManualIssueForm(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 8 }))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            max="200"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={manualIssueForm.description}
                        onChange={(e) => setManualIssueForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the issue, requirements, and acceptance criteria..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        Estimated Bounty: <span className="text-green-400 font-medium">
                          {calculateBounty(manualIssueForm.difficulty).bounty} ETH
                        </span>
                      </div>
                      <button
                        onClick={createManualIssue}
                        disabled={!manualIssueForm.title.trim() || !manualIssueForm.description.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-md transition-colors text-sm font-medium"
                      >
                        Create Issue
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Existing GitHub Issues */}
              <div className="border border-gray-800 rounded-md overflow-hidden">
                <div className="bg-gray-900/50 px-4 py-3 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Github className="w-4 h-4 text-purple-400" />
                      <h3 className="text-white font-medium">Existing Repository Issues</h3>
                      {existingIssues.length > 0 && (
                        <span className="text-xs text-gray-400">({existingIssues.length} found)</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!showExistingIssues && (
                        <button
                          onClick={() => {
                            setShowExistingIssues(true);
                            fetchExistingIssues();
                          }}
                          disabled={loadingExistingIssues}
                          className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1 rounded border border-purple-500/30 hover:border-purple-400/40 transition-colors disabled:opacity-50"
                        >
                          {loadingExistingIssues ? 'Loading...' : 'Load Issues'}
                        </button>
                      )}
                      {showExistingIssues && (
                        <button
                          onClick={() => setShowExistingIssues(false)}
                          className="text-gray-400 hover:text-gray-300 text-sm px-3 py-1 rounded border border-gray-600/30 hover:border-gray-500/40 transition-colors"
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {showExistingIssues && (
                  <div className="max-h-96 overflow-y-auto">
                    {loadingExistingIssues && (
                      <div className="p-8 text-center">
                        <div className="inline-flex items-center text-gray-400 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-3"></div>
                          Fetching existing issues from GitHub...
                        </div>
                      </div>
                    )}
                    
                    {!loadingExistingIssues && existingIssues.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No open issues found in this repository.
                      </div>
                    )}
                    
                    {!loadingExistingIssues && existingIssues.map((issue, index) => (
                      <div key={issue.id} className={`p-4 hover:bg-gray-900/50 transition-colors ${index !== existingIssues.length - 1 ? 'border-b border-gray-800' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-white font-medium text-sm">{issue.title}</h4>
                              <span className="text-gray-400 text-xs">#{issue.number}</span>
                              {issue.hasExistingBounty && (
                                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30">
                                  Bounty Added
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-400 mb-2">
                              <span>by {issue.author}</span>
                              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                              <a 
                                href={issue.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View on GitHub</span>
                              </a>
                            </div>
                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                              {issue.description.length > 150 
                                ? `${issue.description.substring(0, 150)}...` 
                                : issue.description
                              }
                            </p>
                            {issue.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                              {issue.labels.slice(0, 3).map((label, idx) => (
                                <span key={idx} className="github-label github-label-outline">
                                  {label}
                                </span>
                              ))}
                                {issue.labels.length > 3 && (
                                  <span className="text-gray-400 text-xs">+{issue.labels.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {!issue.hasExistingBounty && (
                            <div className="ml-4 flex flex-col space-y-2">
                              <div className="text-xs text-gray-400 mb-1">Add Bounty:</div>
                              {['easy', 'medium', 'hard'].map((difficulty) => (
                                <button
                                  key={difficulty}
                                  onClick={() => addBountyToExistingIssue(issue, difficulty)}
                                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                                    difficulty === 'easy' ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' :
                                    difficulty === 'medium' ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10' :
                                    'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                  }`}
                                >
                                  {difficulty} ({calculateBounty(difficulty).bounty} ETH)
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

              {/* Action Section */}
              {!loading && currentIssues.length > 0 && (
                <div className="py-6 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm github-text-muted">
                      {approvedIssues.length === 0 
                        ? "Select issues to include in your report"
                        : `${approvedIssues.length} issue${approvedIssues.length !== 1 ? 's' : ''} approved`
                      }
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => router.back()}
                        className="btn-github-secondary text-sm"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleConfirmListing}
                        disabled={approvedIssues.length === 0 || isCreatingIssues}
                        className="btn-github-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isCreatingIssues ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Issues...
                          </div>
                        ) : (
                          'Generate Report'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </main>
    </div>
  );
}