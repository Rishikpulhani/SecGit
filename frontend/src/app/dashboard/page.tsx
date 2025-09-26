'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ExternalLink, Clock, CheckCircle, XCircle, DollarSign, Github, Calendar, Users, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
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

    loadData();
  }, [user]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'high': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'medium': return 'text-yellow-300 bg-yellow-600/20 border-yellow-500/30';
      case 'low': return 'text-green-300 bg-green-600/20 border-green-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-300 bg-green-600/20 border-green-500/30';
      case 'completed': return 'text-blue-300 bg-blue-600/20 border-blue-500/30';
      case 'cancelled': return 'text-red-300 bg-red-600/20 border-red-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    
    alert('Submission rejected. Solver can resubmit with improvements.');
  };

  const totalBountiesCreated = bounties.length;
  const totalBountyValue = bounties.reduce((sum, bounty) => sum + parseFloat(bounty.totalBounty), 0);
  const activeBounties = bounties.filter(b => b.status === 'active').length;
  
  // Show submissions tab only for gyanshupathak
  const isRepoOwner = user?.login === 'gyanshupathak';
  const pendingSubmissions = submissions.filter(s => s.submissionStatus === 'submitted').length;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900">
          <Header />
          <main className="pt-20 px-4 py-12">
            <div className="max-w-6xl mx-auto text-center">
              <div className="text-white">Loading your dashboard...</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
        <Header />
        
        <main className="pt-20 px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isRepoOwner ? 'Repository Dashboard' : 'Bounty Dashboard'}
              </h1>
              <p className="text-gray-300">
                {isRepoOwner ? 'Manage your repositories, bounties and review submissions' : 'Manage your security bounties and track progress'}
              </p>
            </div>

            {/* Tabs (only show if repo owner) */}
            {isRepoOwner && (
              <div className="mb-8">
                <div className="border-b border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('bounties')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'bounties'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      My Bounties ({totalBountiesCreated})
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'submissions'
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Submissions ({submissions.length})
                      {pendingSubmissions > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {pendingSubmissions}
                        </span>
                      )}
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalBountiesCreated}</div>
                    <div className="text-gray-300 text-sm">Total Bounties</div>
                  </div>
                </div>
              </div>

              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalBountyValue.toFixed(2)} ETH</div>
                    <div className="text-gray-300 text-sm">Total Value</div>
                  </div>
                </div>
              </div>

              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{activeBounties}</div>
                    <div className="text-gray-300 text-sm">Active Bounties</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content based on active tab */}
            {(!isRepoOwner || activeTab === 'bounties') && (
              <>
                {/* Bounties List */}
                {bounties.length === 0 ? (
              <div className="github-card-elevated p-12 text-center">
                <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Bounties Created Yet</h3>
                <p className="text-gray-300 mb-6">
                  Start by submitting a repository for analysis to create your first bounty.
                </p>
                <button
                  onClick={() => router.push('/submit')}
                  className="btn-primary"
                >
                  Submit Repository
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {bounties.map((bounty) => (
                  <div key={bounty.id} className="github-card-elevated p-6">
                    {/* Bounty Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                          <Github className="w-5 h-5 mr-2" />
                          {bounty.repository.split('/').slice(-2).join('/')}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(bounty.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {bounty.issues.length} issues
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {bounty.totalBounty} ETH
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bounty.status)}`}>
                          {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                        </span>
                        <a
                          href={bounty.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="View Repository"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Issues Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bounty.issues.map((issue) => (
                        <div key={issue.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                            {issue.githubIssueUrl && (
                              <a
                                href={issue.githubIssueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300 transition-colors"
                                title={`GitHub Issue #${issue.githubIssueNumber}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                            {issue.title}
                          </h4>
                          
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="capitalize">{issue.type}</span>
                            <span className="font-medium">{issue.suggestedBounty} ETH</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Transaction Info */}
                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <div className="text-xs text-gray-400">
                        <span className="mr-4">
                          Transaction: 
                          <span className="font-mono ml-1">
                            {bounty.transactionHash.substring(0, 10)}...{bounty.transactionHash.substring(bounty.transactionHash.length - 8)}
                          </span>
                        </span>
                        <span>Platform Fee: {bounty.platformFee} ETH</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}

            {/* Submissions Tab Content */}
            {isRepoOwner && activeTab === 'submissions' && (
              <div className="space-y-6">
                {/* Debug Info and Refresh Button */}
                <div className="github-card-elevated p-4 bg-blue-600/10 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-300">
                      <strong>Debug:</strong> Found {submissions.length} submissions in shared pool
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-secondary text-sm py-1 px-3"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>

                {submissions.length === 0 ? (
                  <div className="github-card-elevated p-12 text-center">
                    <Eye className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                    <p className="text-gray-300">
                      Submissions from solvers will appear here for your review.
                    </p>
                    <div className="mt-4 text-sm text-gray-400">
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
                    <div key={submission.id} className="github-card-elevated p-6">
                      {/* Submission Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-xl font-bold text-white mb-2">{submission.issue.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(submission.issue.severity)}`}>
                            {submission.issue.severity}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.submissionStatus)}`}>
                            {submission.submissionStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Issue Description */}
                      <p className="text-gray-300 mb-4 line-clamp-2">{submission.issue.description}</p>

                      {/* Solver Info */}
                      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-white mb-2">Solver Details</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            Assigned to: {submission.assignedTo?.substring(0, 6)}...{submission.assignedTo?.substring(submission.assignedTo.length - 4)}
                          </span>
                          <span className="text-gray-400">
                            Submitted: {submission.submittedAt ? formatDate(submission.submittedAt) : 'N/A'}
                          </span>
                        </div>
                        {submission.submissionUrl && (
                          <div className="mt-2">
                            <a
                              href={submission.submissionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center"
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
        </main>
      </div>
    </ProtectedRoute>
  );
}
