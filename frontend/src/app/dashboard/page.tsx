'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ExternalLink, Clock, CheckCircle, XCircle, DollarSign, Github, Calendar, Users, Eye, ThumbsUp, ThumbsDown, Plus, Star, GitFork, Code, AlertCircle, Bug, Shield } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bounties');

  // Check if user is repository owner (gyanshupathak)
  const isRepoOwner = user?.login === 'gyanshupathak';

  useEffect(() => {
    // Load bounties and submissions from localStorage
    const loadData = () => {
      try {
        const userBounties = JSON.parse(localStorage.getItem('userBounties') || '[]');
        setBounties(userBounties);
        
        // Load submissions if user is gyanshupathak
        if (user?.login === 'gyanshupathak') {
          // Load from shared submissions pool (cross-browser accessible)
          const allSubmissions = JSON.parse(localStorage.getItem('allSubmissions') || '[]');
          const repoSubmissions = allSubmissions.filter((submission: any) => {
            // Filter submissions for gyanshupathak repositories
            return submission.issue && (
              submission.issue.repository === 'gyanshupathak/health_panel' ||
              submission.issue.repository === 'gyanshupathak/SolVest'
            ) && (
              submission.submissionStatus === 'submitted' || 
              submission.submissionStatus === 'accepted' || 
              submission.submissionStatus === 'rejected'
            );
          });
          
          // If no submissions found, create mock submissions for testing
          if (repoSubmissions.length === 0) {
            const mockSubmissions = [
              {
                id: Date.now() - 1000,
                issueId: 1,
                issue: {
                  title: 'Implement secure authentication system',
                  description: 'Add JWT-based authentication with proper password hashing and session management for the health panel application.',
                  repository: 'gyanshupathak/health_panel',
                  repoUrl: 'https://github.com/gyanshupathak/health_panel',
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
                submissionUrl: 'https://github.com/gyanshupathak/health_panel/pull/123',
                submittedAt: new Date().toISOString()
              },
              {
                id: Date.now() - 2000,
                issueId: 2,
                issue: {
                  title: 'Fix memory leak in data processing module',
                  description: 'Memory usage continuously increases during large dataset processing, causing application crashes after extended use.',
                  repository: 'gyanshupathak/health_panel',
                  repoUrl: 'https://github.com/gyanshupathak/health_panel',
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
                submissionUrl: 'https://github.com/gyanshupathak/health_panel/pull/124',
                submittedAt: new Date(Date.now() - 3600000).toISOString()
              }
            ];
            
            // Store mock submissions in allSubmissions for persistence
            localStorage.setItem('allSubmissions', JSON.stringify(mockSubmissions));
            setSubmissions(mockSubmissions);
          } else {
            setSubmissions(repoSubmissions);
          }
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
    }
  }, [user]);

  const handleAcceptSubmission = (submissionId: number) => {
    const updatedSubmissions = submissions.map(submission => 
      submission.id === submissionId 
        ? { ...submission, submissionStatus: 'accepted' }
        : submission
    );
    setSubmissions(updatedSubmissions);
    
    // Update in shared submissions pool
    const allSubmissions = JSON.parse(localStorage.getItem('allSubmissions') || '[]');
    const updatedAllSubmissions = allSubmissions.map((submission: any) => 
      submission.id === submissionId 
        ? { ...submission, submissionStatus: 'accepted' }
        : submission
    );
    localStorage.setItem('allSubmissions', JSON.stringify(updatedAllSubmissions));
    
    // Also update in userAssignments for the solver's browser (if same browser)
    const allAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
    const updatedAssignments = allAssignments.map((assignment: any) => 
      assignment.id === submissionId 
        ? { ...assignment, submissionStatus: 'accepted' }
        : assignment
    );
    localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
    
    alert('Submission accepted! Bounty has been distributed.');
  };

  const handleRejectSubmission = (submissionId: number) => {
    const updatedSubmissions = submissions.map(submission => 
      submission.id === submissionId 
        ? { ...submission, submissionStatus: 'rejected' }
        : submission
    );
    setSubmissions(updatedSubmissions);
    
    // Update in shared submissions pool
    const allSubmissions = JSON.parse(localStorage.getItem('allSubmissions') || '[]');
    const updatedAllSubmissions = allSubmissions.map((submission: any) => 
      submission.id === submissionId 
        ? { ...submission, submissionStatus: 'rejected' }
        : submission
    );
    localStorage.setItem('allSubmissions', JSON.stringify(updatedAllSubmissions));
    
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
        
        <main className="pt-16">
          <div className="github-container">
            {/* GitHub Repository Header */}
            <div className="github-repo-header py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Github className="w-8 h-8 text-gray-400" />
                  <div>
                    <h1 className="github-h1 mb-0">
                      <span className="github-text-link">{user?.login || 'User'}</span>
                      <span className="text-gray-400 mx-2">/</span>
                      <span>SecGit</span>
                    </h1>
                    <p className="github-text-muted text-sm">
                      Security auditing and bounty management platform
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-github-secondary text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Star
                  </button>
                  <button 
                    onClick={() => router.push('/submit')}
                    className="btn-github-primary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Submit Code
                  </button>
                </div>
              </div>

              {/* GitHub Stats */}
              <div className="flex items-center space-x-6 text-sm github-text-muted">
                <div className="flex items-center space-x-1">
                  <Code className="w-4 h-4" />
                  <span>TypeScript</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>0</span>
                </div>
                <div className="flex items-center space-x-1">
                  <GitFork className="w-4 h-4" />
                  <span>0</span>
                </div>
              </div>
            </div>

            {/* GitHub Navigation Tabs */}
            <div className="github-nav-tabs">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('bounties')}
                  className={`github-nav-tab ${activeTab === 'bounties' ? 'active' : ''}`}
                >
                  <Target className="w-4 h-4 mr-2" />
                  {isRepoOwner ? 'My Bounties' : 'Bounties'}
                  <span className="github-counter ml-2">{bounties.length}</span>
                </button>
                {isRepoOwner && (
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`github-nav-tab ${activeTab === 'submissions' ? 'active' : ''}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Submissions
                    <span className="github-counter ml-2">{submissions.length}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-6">
              {/* Stats Cards - GitHub Style */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{bounties.length}</div>
                      <div className="github-text-muted text-sm">Total {isRepoOwner ? 'Bounties' : 'Repositories'}</div>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {bounties.reduce((sum, bounty) => sum + parseFloat(bounty.totalBounty), 0).toFixed(2)} ETH
                      </div>
                      <div className="github-text-muted text-sm">Total Value</div>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {bounties.filter(b => b.status === 'active').length}
                      </div>
                      <div className="github-text-muted text-sm">Active {isRepoOwner ? 'Bounties' : 'Issues'}</div>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                {isRepoOwner && (
                  <div className="github-stat-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{submissions.length}</div>
                        <div className="github-text-muted text-sm">Submissions</div>
                      </div>
                      <Users className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Bounties Tab Content */}
              {activeTab === 'bounties' && (
                <div className="space-y-4">
                  {bounties.length === 0 ? (
                    <div className="github-card p-12 text-center">
                      <Target className="w-16 h-16 github-text-muted mx-auto mb-4" />
                      <h3 className="github-h3 mb-2">No bounties yet</h3>
                      <p className="github-text-muted mb-4">
                        {isRepoOwner 
                          ? "You haven't created any bounties yet. Submit code for analysis to get started."
                          : "You haven't participated in any bounties yet. Check out the marketplace to find issues to solve."
                        }
                      </p>
                      <button 
                        onClick={() => router.push(isRepoOwner ? '/submit' : '/marketplace')}
                        className="btn-github-primary"
                      >
                        {isRepoOwner ? 'Submit Code' : 'Browse Issues'}
                      </button>
                    </div>
                  ) : (
                    bounties.map((bounty) => (
                      <div key={bounty.id} className="github-card-hover p-6">
                        {/* Bounty Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="github-text-title text-lg mb-2">
                              <Github className="w-4 h-4 inline mr-2" />
                              {bounty.repository}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm github-text-muted">
                              <span>{bounty.issues.length} issues</span>
                              <span>•</span>
                              <span>{bounty.totalBounty} ETH total</span>
                              <span>•</span>
                              <span>Created {formatDate(bounty.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-4 md:mt-0">
                            <span className={`github-state-${bounty.status === 'active' ? 'open' : 'closed'}`}>
                              {bounty.status}
                            </span>
                          </div>
                        </div>

                        {/* Issues List */}
                        <div className="space-y-3">
                          {bounty.issues.map((issue, index) => {
                            const TypeIcon = getTypeIcon(issue.type);
                            return (
                              <div key={index} className="github-issue-item">
                                <div className="flex items-start space-x-3">
                                  <TypeIcon className={`w-4 h-4 mt-1 ${issue.type === 'bug' ? 'text-red-500' : 'text-purple-500'}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="github-text-title">{issue.title}</span>
                                      {issue.githubIssueNumber && (
                                        <span className="github-issue-number">#{issue.githubIssueNumber}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm">
                                      <span className={`github-label ${getSeverityColor(issue.severity)}`}>
                                        {issue.severity}
                                      </span>
                                      <span className="github-text-muted">{issue.suggestedBounty} ETH</span>
                                      {issue.githubIssueUrl && (
                                        <a
                                          href={issue.githubIssueUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="github-text-link flex items-center"
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          View
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
                              <span>Stake: {submission.stakeAmount} ETH</span>
                              <span>Bounty: {submission.issue.bounty} ETH</span>
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
                          ) : submission.submissionStatus === 'accepted' ? (
                            <div className="flex items-center text-green-300">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span>Accepted - Bounty Distributed ({submission.issue.bounty} ETH)</span>
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