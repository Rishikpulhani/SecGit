'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Clock, DollarSign, Github, ExternalLink, Send, CheckCircle, XCircle, AlertCircle, Plus, Star, GitFork, Code, Shield, Bug, Zap, X, Search } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { getTypeColor, getSeverityColor } from '../../utils/labelUtils';
import { useWallet } from '../../contexts/WalletContext';

interface Assignment {
  id: number;
  issueId: number;
  issue: {
    title: string;
    description: string;
    repository: string;
    repoUrl: string;
    type: string;
    severity: string;
    bounty: number;
    issueNumber: number;
  };
  stakeAmount: string;
  transactionHash: string;
  assignedTo: string;
  assignedAt: string;
  status: 'assigned' | 'active' | 'closed';
  submissionStatus: 'not_submitted' | 'submitted' | 'accepted' | 'rejected';
  submissionUrl?: string;
  submittedAt?: string;
}

// GitHub Issues interface
type GitHubIssue = {
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
};

export default function SolverDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { account, isConnected, sendTransaction } = useWallet();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // GitHub issues state
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  
  // Staking modal state
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('0.5');
  const [isStaking, setIsStaking] = useState(false);

  useEffect(() => {
    // Load assignments from localStorage
    const loadAssignments = () => {
      try {
        const userAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
        setAssignments(userAssignments);
      } catch (error) {
        console.error('Error loading assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  // Fetch GitHub issues
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIssuesLoading(true);
        setIssuesError(null);
        
        const response = await fetch('/api/github/fetch-issues');
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        
        const data = await response.json();
        if (data.success) {
          setIssues(data.issues);
        } else {
          throw new Error(data.error || 'Failed to fetch issues');
        }
      } catch (err: any) {
        console.error('Error fetching issues:', err);
        setIssuesError(err.message);
        setIssues([]);
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const handleSubmitSolution = async () => {
    if (!selectedAssignment || !prUrl.trim()) {
      alert('Please enter a valid Pull Request URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate submission processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update assignment status
      const updatedAssignments = assignments.map(assignment => 
        assignment.id === selectedAssignment.id 
          ? { 
              ...assignment, 
              submissionStatus: 'submitted' as const,
              submissionUrl: prUrl,
              submittedAt: new Date().toISOString()
            }
          : assignment
      );

      setAssignments(updatedAssignments);
      localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
      
      // Also store in shared submissions pool for cross-browser access
      const allSubmissions = JSON.parse(localStorage.getItem('allSubmissions') || '[]');
      const submissionData = updatedAssignments.find(a => a.id === selectedAssignment.id);
      if (submissionData) {
        // Remove any existing submission with same ID and add the updated one
        const filteredSubmissions = allSubmissions.filter((s: any) => s.id !== submissionData.id);
        filteredSubmissions.push(submissionData);
        localStorage.setItem('allSubmissions', JSON.stringify(filteredSubmissions));
      }

      setShowSubmitModal(false);
      alert('Solution submitted successfully!');

    } catch (error) {
      console.error('Error submitting solution:', error);
      alert('Failed to submit solution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      case 'performance': return Zap;
      default: return AlertCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'github-label-security';
      case 'bug': return 'github-label-bug';
      case 'performance': return 'github-label-enhancement';
      default: return 'github-label-enhancement';
    }
  };

  const getStatusBadge = (submissionStatus: string) => {
    switch (submissionStatus) {
      case 'not_submitted':
        return <span className="github-state-open">Not Submitted</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-medium text-white rounded-full" style={{ backgroundColor: '#d29922' }}>Submitted</span>;
      case 'accepted':
        return <span className="github-state-open" style={{ backgroundColor: '#238636' }}>Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium text-white rounded-full" style={{ backgroundColor: '#da3633' }}>Rejected</span>;
      default:
        return <span className="github-counter">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Switch to Base network
  const switchToBaseNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
    }

    try {
      // Try to switch to Base network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base mainnet chain ID
      });
    } catch (switchError: any) {
      // If the network is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org/'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Base network to MetaMask.');
        }
      } else {
        throw new Error('Failed to switch to Base network. Please switch manually in MetaMask.');
      }
    }
  };

  // Handle staking and assignment
  const handleStakeAndAssign = async () => {
    if (!selectedIssue || !account) {
      alert('Please connect your wallet first.');
      return;
    }

    setIsStaking(true);

    try {
      // Switch to Base network
      await switchToBaseNetwork();

      // Simulate staking transaction (0 ETH transaction for demo)
      const txHash = await sendTransaction({
        to: account, // Send to self for demo
        value: '0', // 0 ETH
        gasLimit: '21000',
      });

      // Create assignment data
      const assignmentData: Assignment = {
        id: Date.now(),
        issueId: selectedIssue.id,
        issue: {
          title: selectedIssue.title,
          description: selectedIssue.description,
          repository: selectedIssue.repository,
          repoUrl: selectedIssue.repoUrl,
          type: selectedIssue.type,
          severity: selectedIssue.severity,
          bounty: selectedIssue.bounty,
          issueNumber: selectedIssue.issueNumber,
        },
        stakeAmount: '0.5', // Fixed stake amount for display
        transactionHash: txHash,
        assignedTo: account,
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        submissionStatus: 'not_submitted'
      };
      
      // Store in localStorage (in production, this would be in a database)
      const existingAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
      existingAssignments.push(assignmentData);
      localStorage.setItem('userAssignments', JSON.stringify(existingAssignments));
      
      // Also store in shared pool for cross-browser access
      const allSubmissions = JSON.parse(localStorage.getItem('allSubmissions') || '[]');
      allSubmissions.push(assignmentData);
      localStorage.setItem('allSubmissions', JSON.stringify(allSubmissions));
      
      setShowStakingModal(false);
      setAssignments(existingAssignments); // Update local state
      
    } catch (error: any) {
      console.error('Error staking and assigning:', error);
      
      if (error.message.includes('Base network')) {
        alert(`Network Error: ${error.message}. Please ensure MetaMask is installed and try again.`);
      } else if (error.code === 4001) {
        alert('Transaction cancelled by user.');
      } else if (error.code === -32603) {
        alert('Transaction failed. Please check your balance and try again.');
      } else {
        alert('Failed to stake and assign issue. Please try again.');
      }
    } finally {
      setIsStaking(false);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || issue.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  // Stats calculations
  const totalAssigned = assignments.length;
  const activeIssues = assignments.filter(a => a.submissionStatus === 'not_submitted' || a.submissionStatus === 'submitted').length;
  const completedIssues = assignments.filter(a => a.submissionStatus === 'accepted').length;
  const totalEarned = assignments
    .filter(a => a.submissionStatus === 'accepted')
    .reduce((sum, a) => sum + a.issue.bounty, 0);

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
                  <Target className="w-8 h-8 text-gray-400" />
                  <div>
                    <h1 className="github-h1 mb-0">
                      <span className="github-text-link">{user?.login || 'Solver'}</span>
                      <span className="text-gray-400 mx-2">/</span>
                      <span>Solver Dashboard</span>
                    </h1>
                    <p className="github-text-muted text-sm">
                      Track your assigned issues and submissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-github-secondary text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Star
                  </button>
                </div>
              </div>

              {/* GitHub Stats */}
              <div className="flex items-center space-x-6 text-sm github-text-muted">
                <div className="flex items-center space-x-1">
                  <Code className="w-4 h-4" />
                  <span>Solidity</span>
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
                <button className="github-nav-tab active">
                  <Target className="w-4 h-4 mr-2" />
                  Assignments
                  <span className="github-counter ml-2">{totalAssigned}</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-6">
              {/* Stats Cards - GitHub Style */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{totalAssigned}</div>
                      <div className="github-text-muted text-sm">Total Assigned</div>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">{activeIssues}</div>
                      <div className="github-text-muted text-sm">Active</div>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{completedIssues}</div>
                      <div className="github-text-muted text-sm">Completed</div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="github-stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{totalEarned.toFixed(2)} ETH</div>
                      <div className="github-text-muted text-sm">Total Earned</div>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Assignments List */}
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="github-card p-12 text-center">
                    <Target className="w-16 h-16 github-text-muted mx-auto mb-4" />
                    <h3 className="github-h3 mb-2">No assignments yet</h3>
                    <p className="github-text-muted mb-4">
                      You haven't been assigned any issues yet. Browse the marketplace to find issues to solve.
                    </p>
                    <button 
                      onClick={() => router.push('/marketplace')}
                      className="btn-github-primary"
                    >
                      Browse Issues
                    </button>
                  </div>
                ) : (
                  assignments.map((assignment) => {
                    const TypeIcon = getTypeIcon(assignment.issue.type);
                    
                    return (
                      <div key={assignment.id} className="github-card-hover p-6">
                        {/* Assignment Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="github-text-title text-lg mb-2 flex items-center">
                              <TypeIcon className={`w-5 h-5 mr-2 ${assignment.issue.type === 'security' ? 'text-purple-500' : assignment.issue.type === 'bug' ? 'text-red-500' : 'text-yellow-500'}`} />
                              {assignment.issue.title}
                              <span className="github-issue-number ml-2">#{assignment.issue.issueNumber}</span>
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm github-text-muted">
                              <span className="flex items-center">
                                <Github className="w-4 h-4 mr-1" />
                                {assignment.issue.repository}
                              </span>
                              <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                              <span>Stake: {assignment.stakeAmount} ETH</span>
                              <span>Bounty: {assignment.issue.bounty} ETH</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-4 md:mt-0">
                            <span className={`github-label ${getSeverityColor(assignment.issue.severity)}`}>
                              {assignment.issue.severity}
                            </span>
                            {getStatusBadge(assignment.submissionStatus)}
                          </div>
                        </div>

                        {/* Issue Description */}
                        <p className="github-text-muted mb-4 line-clamp-2">{assignment.issue.description}</p>

                        {/* Labels */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className={`github-label ${getTypeColor(assignment.issue.type)}`}>
                            {assignment.issue.type}
                          </span>
                        </div>

                        {/* Submission Status */}
                        {assignment.submissionStatus === 'submitted' && (
                          <div className="github-card p-3 mb-4" style={{ backgroundColor: '#d292221a', borderColor: '#d29922' }}>
                            <div className="flex items-center text-yellow-300">
                              <Clock className="w-4 h-4 mr-2" />
                              <span className="font-medium">Solution submitted, waiting for review</span>
                            </div>
                            {assignment.submissionUrl && (
                              <a
                                href={assignment.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="github-text-link text-sm flex items-center mt-2"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View PR
                              </a>
                            )}
                          </div>
                        )}

                        {assignment.submissionStatus === 'accepted' && (
                          <div className="github-card p-3 mb-4" style={{ backgroundColor: '#2386361a', borderColor: '#238636' }}>
                            <div className="flex items-center text-green-300">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="font-medium">Solution accepted! Bounty distributed: {assignment.issue.bounty} ETH</span>
                            </div>
                          </div>
                        )}

                        {assignment.submissionStatus === 'rejected' && (
                          <div className="github-card p-3 mb-4" style={{ backgroundColor: '#da36331a', borderColor: '#da3633' }}>
                            <div className="flex items-center text-red-300">
                              <XCircle className="w-4 h-4 mr-2" />
                              <span className="font-medium">Solution rejected. You can make improvements and resubmit.</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="border-t border-gray-700 pt-4">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <a
                              href={assignment.issue.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-github-secondary text-sm flex items-center justify-center"
                            >
                              <Github className="w-4 h-4 mr-2" />
                              View Repository
                            </a>
                            
                            {assignment.submissionStatus === 'not_submitted' && (
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowSubmitModal(true);
                                  setPrUrl('');
                                }}
                                className="btn-github-primary text-sm flex items-center justify-center"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Submit Solution
                              </button>
                            )}
                            
                            {assignment.submissionUrl && (
                              <a
                                href={assignment.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="github-text-link text-sm flex items-center justify-center px-3 py-2 border border-gray-600 rounded"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View PR
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Submit Solution Modal */}
        {showSubmitModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="github-card max-w-2xl w-full p-6" style={{ backgroundColor: '#161b22' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="github-h3 mb-0">Submit Solution</h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="github-text-title text-lg mb-2">{selectedAssignment.issue.title}</h4>
                <p className="github-text-muted text-sm mb-4">{selectedAssignment.issue.description}</p>
                
                <div className="github-card p-3 mb-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="github-text-muted">Repository:</span>
                    <span className="github-text-link">{selectedAssignment.issue.repository}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="github-text-muted">Issue:</span>
                    <span className="text-white">#{selectedAssignment.issue.issueNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="github-text-muted">Bounty:</span>
                    <span className="text-green-400 font-medium">{selectedAssignment.issue.bounty} ETH</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="prUrl" className="block text-sm font-medium github-text-title mb-2">
                  Pull Request URL *
                </label>
                <input
                  type="url"
                  id="prUrl"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="github-input w-full"
                  required
                />
                <p className="mt-2 text-sm github-text-muted">
                  Enter the URL of your pull request that addresses this issue.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-github-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSolution}
                  disabled={!prUrl.trim() || isSubmitting}
                  className="btn-github-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Solution
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}