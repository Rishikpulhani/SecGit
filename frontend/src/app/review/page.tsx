'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Github, ExternalLink, Plus, X, Bug, Shield, AlertCircle, Clock, DollarSign, Users, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';

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

  // Bounty calculation system based on difficulty only
  const calculateBounty = (difficulty: string) => {
    // Fixed bounty amounts per difficulty level
    const difficultyBounties = {
      'easy': 1,     // 1 ETH for easy
      'low': 1,      // 1 ETH for low (alias for easy)
      'medium': 2,   // 2 ETH for medium
      'hard': 3,     // 3 ETH for hard
      'high': 3,     // 3 ETH for high (alias for hard)
      'critical': 3  // 3 ETH for critical (alias for hard)
    };
    
    // Get bounty amount based on difficulty (default to medium if unknown)
    const bountyAmount = difficultyBounties[difficulty.toLowerCase()] || 2;
    
    return {
      bounty: bountyAmount,
      calculation: {
        difficulty: difficulty,
        bountyAmount: bountyAmount,
        formula: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty = ${bountyAmount} ETH`
      }
    };
  };

  // Helper function to create issue from analysis data
  const createIssueFromAnalysis = (parsed: any, isFromCache = false) => {
    const difficulty = parsed.issue?.difficulty?.toLowerCase() || 'medium';
    const estimatedHours = parseInt(parsed.issue?.estimatedTime?.match(/\d+/)?.[0] || '8');
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

  const handleConfirmListing = () => {
    // Store approved issues for the success page
    localStorage.setItem('approvedIssuesForBounty', JSON.stringify(approvedIssues));
    
    router.push(`/success?repo=${encodeURIComponent(githubUrl)}&bounties=${approvedIssues.length}&total=${totalBounty}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'github-label-critical';
      case 'high': return 'github-label-high';
      case 'medium': return 'github-label-medium';
      case 'low': return 'github-label-low';
      default: return 'github-label-medium';
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'github-label-security';
      case 'bug': return 'github-label-bug';
      case 'feature': return 'github-label-enhancement';
      default: return 'github-label-enhancement';
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
                            <span className={`github-label text-xs ${getTypeColor(issue.type)}`}>
                              {issue.type}
                            </span>
                            <span className={`github-label text-xs ${getSeverityColor(issue.severity)}`}>
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
                          <span className="github-label text-xs" style={{ backgroundColor: '#0969da', color: 'white' }}>
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
                        
                        {/* Technical Requirements */}
                        {issue.technicalRequirements && issue.technicalRequirements.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Technical Requirements</h4>
                            <ul className="text-sm text-gray-400 space-y-1">
                              {issue.technicalRequirements.map((req: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2 text-gray-500">•</span>
                                  <span>{req}</span>
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
                        disabled={approvedIssues.length === 0}
                        className="btn-github-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Generate Report
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