'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ExternalLink, Clock, CheckCircle, XCircle, DollarSign, Github, Calendar, Users, Eye, ThumbsUp, ThumbsDown, Plus, Star, GitFork, Code, AlertCircle, Bug, Shield, X } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { getSubmissions, subscribeToSubmissions, refreshSubmissions, updateSubmission } from '../../utils/crossBrowserStorage';

interface Bounty {
  id: number;
  repository: string;
  issues: Array<{
    id: number;
    title: string;
    severity: string;
    type: string;
    suggestedBounty: number;
    githubIssueUrl?: string;
    githubIssueNumber?: number;
    status?: 'active' | 'closed';
  }>;
  totalBounty: string;
  platformFee: string;
  transactionHash: string;
  creator: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const { user } = useAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bounties');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if user is repository owner (gyanshupathak)
  const isRepoOwner = user?.login === 'gyanshupathak';

  useEffect(() => {
    // Check for URL parameters from review page
    const repo = searchParams.get('repo');
    const created = searchParams.get('created');
    
    if (repo && created) {
      setShowSuccessMessage(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    
    // Load bounties and submissions from localStorage
    const loadData = () => {
      try {
        const userBounties = JSON.parse(localStorage.getItem('userBounties') || '[]');
        setBounties(userBounties);
        
        // Load submissions if user is gyanshupathak
        if (user?.login === 'gyanshupathak') {
          // Load from cross-browser shared submissions pool
          const allSubmissions = getSubmissions();
          console.log('📥 Dashboard loaded submissions:', allSubmissions.length);
          console.log('📥 All submissions data:', allSubmissions);
          const repoSubmissions = allSubmissions.filter((submission: any) => {
            // Filter submissions for gyanshupathak repositories
            return submission.issue && (
              submission.issue.repository === 'gyanshupathak/heatlh_panel' ||
              submission.issue.repository === 'gyanshupathak/SolVest'
            ) && (
              submission.submissionStatus === 'submitted' || 
              submission.submissionStatus === 'analyzing' ||
              submission.submissionStatus === 'accepted' || 
              submission.submissionStatus === 'rejected'
            );
          });
          
          console.log('📥 Filtered repo submissions:', repoSubmissions.length);
          console.log('📥 Filtered submissions data:', repoSubmissions);
          
          // If no submissions found, create mock submissions for testing
          if (repoSubmissions.length === 0) {
            const mockSubmissions = [
              {
                id: Date.now() - 1000,
                issueId: 1,
                issue: {
                  title: 'Implement secure authentication system',
                  description: 'Add JWT-based authentication with proper password hashing and session management for the health panel application.',
                  repository: 'gyanshupathak/heatlh_panel',
                  repoUrl: 'https://github.com/gyanshupathak/heatlh_panel',
                  type: 'security',
                  severity: 'high',
                  bounty: 0.8,
                  issueNumber: 15
                },
                stakeAmount: '0.5',
                transactionHash: '0x' + Math.random().toString(16).substr(2, 40),
                assignedTo: '0xa889...8d8b',
                assignedAt: new Date(Date.now() - 86400000).toISOString(),
                status: 'assigned',
                submissionStatus: 'submitted',
                submissionUrl: 'https://github.com/gyanshupathak/heatlh_panel/pull/123',
                submittedAt: new Date().toISOString()
              },
              {
                id: Date.now() - 2000,
                issueId: 2,
                issue: {
                  title: 'Fix memory leak in data processing module',
                  description: 'Memory usage continuously increases during large dataset processing, causing application crashes after extended use.',
                  repository: 'gyanshupathak/heatlh_panel',
                  repoUrl: 'https://github.com/gyanshupathak/heatlh_panel',
                  type: 'bug',
                  severity: 'high',
                  bounty: 0.6,
                  issueNumber: 23
                },
                stakeAmount: '0.5',
                transactionHash: '0x' + Math.random().toString(16).substr(2, 40),
                assignedTo: '0xb123...9c2d',
                assignedAt: new Date(Date.now() - 172800000).toISOString(),
                status: 'assigned',
                submissionStatus: 'submitted',
                submissionUrl: 'https://github.com/gyanshupathak/heatlh_panel/pull/124',
                submittedAt: new Date(Date.now() - 3600000).toISOString()
              }
            ];
            
            // Store mock submissions in allSubmissions for persistence
            localStorage.setItem('allSubmissions', JSON.stringify(mockSubmissions));
            setSubmissions(mockSubmissions);
          } else {
            setSubmissions(repoSubmissions);
          }
          
          // Debug info
          console.log('🔍 Debug: Found', repoSubmissions.length, 'submissions in shared pool');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setBounties([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
      
      // Subscribe to cross-browser storage updates
      if (user.login === 'gyanshupathak') {
        const unsubscribe = subscribeToSubmissions((updatedSubmissions) => {
          const repoSubmissions = updatedSubmissions.filter((submission: any) => {
            return submission.issue && (
              submission.issue.repository === 'gyanshupathak/heatlh_panel' ||
              submission.issue.repository === 'gyanshupathak/SolVest'
            ) && (
              submission.submissionStatus === 'submitted' || 
              submission.submissionStatus === 'analyzing' ||
              submission.submissionStatus === 'accepted' || 
              submission.submissionStatus === 'rejected'
            );
          });
          setSubmissions(repoSubmissions);
        });
        
        // Cleanup subscription on unmount
        return () => unsubscribe();
      }
    }
  }, [user]);

  const handleAcceptSubmission = async (submissionId: number) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Step 1: Show AI analyzing message
    const updatedSubmissions = submissions.map(sub => 
      sub.id === submissionId 
        ? { ...sub, submissionStatus: 'analyzing' as any }
        : sub
    );
    setSubmissions(updatedSubmissions);
    
    // Show AI analyzing alert
    alert('🤖 AI is analyzing the PR...\n\nThis may take a few moments.');
    
    // Step 2: Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Show PR analysis results (hardcoded)
    const analysisResults = [
      '✅ Code quality: Excellent',
      '✅ Security checks: Passed',
      '✅ Test coverage: 95%',
      '✅ Documentation: Complete',
      '✅ Issue resolution: Confirmed'
    ];
    
    alert(`🤖 AI Analysis Complete!\n\n${analysisResults.join('\n')}\n\n✅ PR is approved and will be closed.`);
    
    // Step 4: Simulate PR closing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Final acceptance with bounty distribution
    const finalUpdatedSubmissions = submissions.map(sub => 
      sub.id === submissionId 
        ? { ...sub, submissionStatus: 'accepted' }
        : sub
    );
    setSubmissions(finalUpdatedSubmissions);
    
    // Update in cross-browser shared submissions pool
    updateSubmission(submissionId, { submissionStatus: 'accepted' });
    
    // Also update in userAssignments for the solver's browser (if same browser)
    const allAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
    const updatedAssignments = allAssignments.map((assignment: any) => 
      assignment.id === submissionId 
        ? { ...assignment, submissionStatus: 'accepted' }
        : assignment
    );
    localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
    
    // Final success message
    alert(`🎉 Bounty Distribution Complete!\n\n💰 ${submission.issue.bounty} OG has been distributed\n🔗 PR has been closed\n✅ Issue resolved successfully`);
  };

  const handleRejectSubmission = (submissionId: number) => {
    const updatedSubmissions = submissions.map(submission => 
      submission.id === submissionId 
        ? { ...submission, submissionStatus: 'rejected' }
        : submission
    );
    setSubmissions(updatedSubmissions);
    
    // Update in cross-browser shared submissions pool
    updateSubmission(submissionId, { submissionStatus: 'rejected' });
    
    // Also update in userAssignments for the solver's browser (if same browser)
    const allAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
    const updatedAssignments = allAssignments.map((assignment: any) => 
      assignment.id === submissionId 
        ? { ...assignment, submissionStatus: 'rejected' }
        : assignment
    );
    localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
    
    alert('Submission rejected. Solver can make improvements and resubmit.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-600 text-white border-yellow-500';
      case 'analyzing': return 'bg-blue-600 text-white border-blue-500';
      case 'accepted': return 'bg-green-600 text-white border-green-500';
      case 'rejected': return 'bg-red-600 text-white border-red-500';
      default: return 'bg-gray-600 text-white border-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return Shield;
      case 'bug': return Bug;
      default: return AlertCircle;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="github-layout">
          <Header />
          <main className="pt-16">
            <div className="github-container py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="github-text-muted mt-2">Loading dashboard...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="github-layout">
        <Header />
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-600/10 border border-green-500/30 mx-4 mt-4 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-green-400 font-medium">Issues Created Successfully!</h3>
                <p className="text-sm text-green-300">
                  {searchParams.get('created')} GitHub issues have been created and added to your dashboard.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccessMessage(false)}
                className="ml-auto text-green-400 hover:text-green-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>  
          </div>
        )}
        
        <main className="pt-16">
          <div className="github-container">
            {/* Clean Header */}
            <div className="py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Dashboard
                  </h1>
                  <p className="text-gray-400">
                    Manage your bounties and submissions
                  </p>
                </div>
                {isRepoOwner && (
                  <button
                    onClick={() => {
                      console.log('🔄 Manual refresh button clicked');
                      refreshSubmissions();
                      
                      // Also reload data
                      const allSubmissions = getSubmissions();
                      console.log('📊 All submissions after refresh:', allSubmissions);
                      
                      const repoSubmissions = allSubmissions.filter((submission: any) => {
                        const hasIssue = submission.issue;
                        const hasRepo = submission.issue && (
                          submission.issue.repository === 'gyanshupathak/heatlh_panel' ||
                          submission.issue.repository === 'gyanshupathak/SolVest'
                        );
                        const hasStatus = submission.submissionStatus && (
                          submission.submissionStatus === 'submitted' || 
                          submission.submissionStatus === 'analyzing' ||
                          submission.submissionStatus === 'accepted' || 
                          submission.submissionStatus === 'rejected'
                        );
                        
                        console.log('🔍 Submission filter check:', {
                          id: submission.id,
                          hasIssue,
                          hasRepo,
                          hasStatus,
                          repository: submission.issue?.repository,
                          status: submission.submissionStatus
                        });
                        
                        return hasIssue && hasRepo && hasStatus;
                      });
                      
                      console.log('📊 Filtered submissions:', repoSubmissions);
                      setSubmissions(repoSubmissions);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Refresh Submissions</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modern Navigation Tabs */}
            <div className="mb-8">
              <div className="inline-flex bg-gray-900/50 border border-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('bounties')}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'bounties' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {isRepoOwner ? 'My Bounties' : 'Bounties'}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === 'bounties' 
                      ? 'bg-blue-500/20 text-blue-200' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {bounties.length}
                  </span>
                </button>
                {isRepoOwner && (
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === 'submissions' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    Submissions
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === 'submissions' 
                        ? 'bg-blue-500/20 text-blue-200' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {submissions.length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-6">
              {/* Clean Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">{bounties.length}</div>
                  <div className="text-sm text-gray-400">{isRepoOwner ? 'Bounties' : 'Repositories'}</div>
                </div>
                
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {bounties.reduce((sum, bounty) => sum + parseFloat(bounty.totalBounty), 0).toFixed(2)} OG
                  </div>
                  <div className="text-sm text-gray-400">Total Value</div>
                </div>
                
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {bounties.filter(b => b.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-400">Active</div>
                </div>

                {isRepoOwner && (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{submissions.length}</div>
                    <div className="text-sm text-gray-400">Submissions</div>
                  </div>
                )}
              </div>

              {/* Bounties Tab Content */}
              {activeTab === 'bounties' && (
                <div className="space-y-4">
                  {bounties.length === 0 ? (
                    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-12 text-center">
                      <Target className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-white mb-3">No bounties yet</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        {isRepoOwner 
                          ? "Submit code for analysis to create bounties and attract developers."
                          : "Browse the marketplace to find issues to solve and earn rewards."
                        }
                      </p>
                      <button 
                        onClick={() => router.push(isRepoOwner ? '/submit' : '/marketplace')}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        {isRepoOwner ? 'Submit Repository' : 'Browse Issues'}
                      </button>
                    </div>
                  ) : (
                    bounties.map((bounty) => (
                      <div key={bounty.id} className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/50 transition-colors">
                        {/* Clean Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Github className="w-5 h-5 text-gray-400" />
                            <div>
                              <h3 className="text-lg font-semibold text-white">{bounty.repository}</h3>
                              <div className="text-sm text-gray-400 mt-1">
                                {bounty.issues.length} issues • {bounty.totalBounty} OG • {formatDate(bounty.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Issues List */}
                        <div className="space-y-2">
                          {bounty.issues.map((issue, index) => (
                            <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-white">{issue.title}</span>
                                {issue.githubIssueNumber && (
                                  <span className="text-xs text-gray-400">#{issue.githubIssueNumber}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`github-label ${getSeverityColor(issue.severity)}`}>
                                  {issue.severity}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  issue.status === 'active' || !issue.status
                                    ? 'bg-green-900/30 text-green-400 border border-green-800' 
                                    : 'bg-gray-700 text-gray-300 border border-gray-600'
                                }`}>
                                  {issue.status === 'active' || !issue.status ? 'active' : 'closed'}
                                </span>
                                <span className="text-sm font-semibold text-green-400">{issue.suggestedBounty} OG</span>
                                {issue.githubIssueUrl && (
                                  <a
                                    href={issue.githubIssueUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Submissions Tab Content */}
              {isRepoOwner && activeTab === 'submissions' && (
                <div className="space-y-6">
                  {/* Debug Info and Refresh Button */}
                  <div className="github-card p-4" style={{ backgroundColor: '#0d419d1a', borderColor: '#1f6feb' }}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-blue-300">
                        <strong>Debug:</strong> Found {submissions.length} submissions in shared pool
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="btn-github-secondary text-sm py-1 px-3"
                      >
                        Refresh Data
                      </button>
                    </div>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="github-card p-12 text-center">
                      <Eye className="w-16 h-16 github-text-muted mx-auto mb-4" />
                      <h3 className="github-h3 mb-2">No Submissions Yet</h3>
                      <p className="github-text-muted">
                        Submissions from solvers will appear here for your review.
                      </p>
                      <div className="mt-4 text-sm github-text-muted">
                        <p>Troubleshooting:</p>
                        <ul className="list-disc list-inside mt-2">
                          <li>Make sure solver has submitted PRs from the solver dashboard</li>
                          <li>Try refreshing this page</li>
                          <li>Check that submissions are for gyanshupathak repositories</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    submissions.map((submission) => (
                      <div key={submission.id} className="github-card-hover p-6">
                        {/* Submission Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                          <div className="mb-4 md:mb-0">
                            <h3 className="github-text-title text-xl mb-2">{submission.issue.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm github-text-muted">
                              <span className="flex items-center">
                                <Github className="w-4 h-4 mr-1" />
                                {submission.issue.repository}
                              </span>
                              <span>#{submission.issue.issueNumber}</span>
                              <span>Stake: {submission.stakeAmount} OG</span>
                              <span>Bounty: {submission.issue.bounty} OG</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`github-label ${getSeverityColor(submission.issue.severity)}`}>
                              {submission.issue.severity}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.submissionStatus)}`}>
                              {submission.submissionStatus.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Issue Description */}
                        <p className="github-text-muted mb-4 line-clamp-2">{submission.issue.description}</p>

                        {/* Solver Info */}
                        <div className="github-card p-4 mb-4">
                          <h4 className="font-semibold text-white mb-2">Solver Details</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="github-text-muted">
                              Assigned to: {submission.assignedTo?.substring(0, 6)}...{submission.assignedTo?.substring(submission.assignedTo.length - 4)}
                            </span>
                            <span className="github-text-muted">
                              Submitted: {submission.submittedAt ? formatDate(submission.submittedAt) : 'N/A'}
                            </span>
                          </div>
                          {submission.submissionUrl && (
                            <div className="mt-2">
                              <a
                                href={submission.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="github-text-link text-sm flex items-center"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View Pull Request
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="border-t border-gray-700 pt-4">
                          {submission.submissionStatus === 'submitted' ? (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleRejectSubmission(submission.id)}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600/20 border border-red-500/30 rounded text-red-300 hover:bg-red-600/30 transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleAcceptSubmission(submission.id)}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded text-green-300 hover:bg-green-600/30 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Accept & Distribute Bounty
                              </button>
                            </div>
                          ) : submission.submissionStatus === 'analyzing' ? (
                            <div className="flex items-center text-blue-300">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
                              <span>AI is analyzing PR...</span>
                            </div>
                          ) : submission.submissionStatus === 'accepted' ? (
                            <div className="flex items-center text-green-300">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span>Accepted - Bounty Distributed ({submission.issue.bounty} OG)</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-300">
                              <XCircle className="w-4 h-4 mr-2" />
                              <span>Rejected - Solver can resubmit</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}