'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { Target, Clock, DollarSign, Github, ExternalLink, Send, CheckCircle, XCircle, AlertCircle, Plus, Star, GitFork, Code, Shield, Bug, Zap, X, Search } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { getTypeColor, getSeverityColor } from '../../utils/labelUtils';
import { addSubmission, updateSubmission } from '../../utils/crossBrowserStorage';

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
  submissionStatus: 'not_submitted' | 'submitted' | 'analyzing' | 'accepted' | 'rejected';
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
  const { account, isConnected, contract, connectWallet } = useWallet();
  
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
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [isStaking, setIsStaking] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'assignments' | 'available'>('assignments');
  
  // Mock mode for testing without real funds
  const [mockMode, setMockMode] = useState(true);

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
      // Simulate submission processing with progress updates
      console.log('🔄 Submitting solution...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📝 Validating PR URL...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Solution submitted to organization for review...');
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      
      // Store in cross-browser shared submissions pool
      const submissionData = updatedAssignments.find(a => a.id === selectedAssignment.id);
      if (submissionData) {
        console.log('📤 Submitting to cross-browser storage:', submissionData);
        addSubmission(submissionData);
      }

      setShowSubmitModal(false);
      setPrUrl('');
      
      // Show success message with more details
      alert(`✅ Solution submitted successfully!\n\n📋 Issue: ${selectedAssignment.issue.title}\n🔗 PR: ${prUrl}\n⏳ Status: Waiting for organization review\n\nYou can check the status in your assignments tab.`);

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
      case 'analyzing':
        return <span className="px-2 py-1 text-xs font-medium text-white rounded-full" style={{ backgroundColor: '#0969da' }}>AI Analyzing</span>;
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

  // Handle staking and assignment using smart contract
  const handleStakeAndAssign = async () => {
    if (!selectedIssue) {
      alert('Please select an issue first.');
      return;
    }

    if (!mockMode) {
      if (!isConnected) {
        alert('Please connect your wallet to take an issue.');
        await connectWallet();
        return;
      }

      if (!contract) {
        alert('Contract not available. Please try again.');
        return;
      }
    }

    setIsStaking(true);

    try {
      let receipt;
      
      if (mockMode) {
        // Mock mode - simulate transaction without real contract call
        console.log('🎯 [MOCK MODE] Taking issue:', selectedIssue.id);
        console.log('💰 [MOCK MODE] Stake amount:', stakeAmount, 'ETH');
        console.log('🎁 [MOCK MODE] Bounty:', selectedIssue.bounty, 'ETH');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock transaction hash
        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        receipt = { transactionHash: mockTxHash };
        
        console.log('✅ [MOCK MODE] Transaction simulated:', mockTxHash);
      } else {
        // Real contract call
        // Calculate required stake amount (5-20% of bounty)
        const bountyWei = ethers.utils.parseEther(selectedIssue.bounty.toString());
        const minStake = (bountyWei.mul(5)).div(100); // 5% minimum
        const maxStake = (bountyWei.mul(20)).div(100); // 20% maximum
        const userStake = ethers.utils.parseEther(stakeAmount);
        
        // Validate stake amount
        if (userStake.lt(minStake) || userStake.gt(maxStake)) {
          const minStakeEth = ethers.utils.formatEther(minStake);
          const maxStakeEth = ethers.utils.formatEther(maxStake);
          alert(`Stake amount must be between ${minStakeEth} and ${maxStakeEth} ETH (5-20% of bounty).`);
          return;
        }

        console.log('🎯 Taking issue:', selectedIssue.id);
        console.log('💰 Stake amount:', stakeAmount, 'ETH');
        console.log('🎁 Bounty:', selectedIssue.bounty, 'ETH');

        // Call the smart contract takeIssue function
        const tx = await contract.takeIssue(selectedIssue.id, {
          value: userStake // Send stake amount with transaction
        });

        console.log('⏳ Transaction sent:', tx.hash);
        
        // Wait for transaction confirmation
        receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt.transactionHash);
      }

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
        stakeAmount: stakeAmount,
        transactionHash: receipt.transactionHash,
        assignedTo: user?.login || account || 'user',
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        submissionStatus: 'not_submitted'
      };
      
      // Store in localStorage (in production, this would be in a database)
      const existingAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
      existingAssignments.push(assignmentData);
      localStorage.setItem('userAssignments', JSON.stringify(existingAssignments));
      
      // Store in cross-browser shared submissions pool
      console.log('📤 Adding assignment to cross-browser storage:', assignmentData);
      addSubmission(assignmentData);
      
      setShowStakingModal(false);
      setAssignments(existingAssignments); // Update local state
      
      // Show success message
      const successMessage = mockMode 
        ? `Issue assigned successfully! (Mock Mode) Transaction: ${receipt.transactionHash}`
        : `Issue assigned successfully! Transaction: ${receipt.transactionHash}`;
      alert(successMessage);
      
    } catch (error: any) {
      console.error('Error taking issue:', error);
      
      if (error.code === 4001) {
        alert('Transaction cancelled by user.');
      } else if (error.message?.includes('Issue already assigned')) {
        alert('This issue has already been assigned to someone else.');
      } else if (error.message?.includes('Invalid stake amount')) {
        alert('Invalid stake amount. Please check the minimum and maximum stake requirements.');
      } else if (error.message?.includes('already attempted')) {
        alert('You have already attempted this issue.');
      } else {
        alert(`Failed to take issue: ${error.message || 'Unknown error'}`);
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
                <button 
                  className={`github-nav-tab ${activeTab === 'assignments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignments')}
                >
                  Assignments
                  <span className="github-counter ml-2">{totalAssigned}</span>
                </button>
                <button 
                  className={`github-nav-tab ${activeTab === 'available' ? 'active' : ''}`}
                  onClick={() => setActiveTab('available')}
                >
                  Available Issues
                  <span className="github-counter ml-2">{issues.length}</span>
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

              {/* Assignments Tab Content */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="github-card p-12 text-center">
                    <Target className="w-16 h-16 github-text-muted mx-auto mb-4" />
                    <h3 className="github-h3 mb-2">No assignments yet</h3>
                    <p className="github-text-muted mb-4">
                      You haven't been assigned any issues yet. Switch to the "Available Issues" tab to see issues you can take on.
                    </p>
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

                        {assignment.submissionStatus === 'analyzing' && (
                          <div className="github-card p-3 mb-4" style={{ backgroundColor: '#0969da1a', borderColor: '#0969da' }}>
                            <div className="flex items-center text-blue-300">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
                              <span className="font-medium">AI is analyzing your PR...</span>
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
              )}

              {/* Available Issues Tab Content */}
              {activeTab === 'available' && (
                <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="github-h2">Available Issues</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search issues..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="github-search pl-10 pr-4 py-2 w-full"
                      />
                    </div>
                    
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="github-select py-2 pr-8"
                    >
                      <option value="all">All types</option>
                      <option value="security">Security</option>
                      <option value="bug">Bug</option>
                      <option value="performance">Performance</option>
                    </select>
                    
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="github-select py-2 pr-8"
                    >
                      <option value="all">All severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-4">
                  {issuesLoading ? (
                    <div className="github-card p-12 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <h3 className="github-h3 mb-2">Loading issues...</h3>
                      <p className="github-text-muted">
                        Fetching issues from GitHub repositories.
                      </p>
                    </div>
                  ) : issuesError ? (
                    <div className="github-card p-12 text-center">
                      <Target className="w-16 h-16 github-text-muted mx-auto mb-4" />
                      <h3 className="github-h3 mb-2">Failed to load issues</h3>
                      <p className="github-text-muted mb-4">{issuesError}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="btn-github-primary text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  ) : filteredIssues.length === 0 ? (
                    <div className="github-card p-12 text-center">
                      <Target className="w-16 h-16 github-text-muted mx-auto mb-4" />
                      <h3 className="github-h3 mb-2">No issues found</h3>
                      <p className="github-text-muted">
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  ) : (
                    filteredIssues.map((issue, index) => {
                      const TypeIcon = getTypeIcon(issue.type);
                      
                      return (
                        <div key={issue.id} className="github-card-hover p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h3 className="github-text-title text-lg mb-2 flex items-center">
                                <TypeIcon className={`w-5 h-5 mr-2 ${issue.type === 'security' ? 'text-purple-500' : issue.type === 'bug' ? 'text-red-500' : 'text-yellow-500'}`} />
                                <a 
                                  href={issue.html_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-400 transition-colors"
                                >
                                  {issue.title}
                                  <span className="github-issue-number ml-2">#{issue.issueNumber}</span>
                                </a>
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm github-text-muted">
                                <span className="flex items-center">
                                  <Github className="w-4 h-4 mr-1" />
                                  {issue.repository}
                                </span>
                                <span>opened {formatDate(issue.createdAt)} by {issue.author}</span>
                                <span>{issue.comments} comments</span>
                                <span>Bounty: {issue.bounty} ETH</span>
                                <span>{issue.estimatedHours}h estimated</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-4 md:mt-0">
                              <span className={`github-label ${getSeverityColor(issue.severity)}`}>
                                {issue.severity}
                              </span>
                              <span className={`github-label ${getTypeColor(issue.type)}`}>
                                {issue.type}
                              </span>
                            </div>
                          </div>

                          <p className="github-text-muted mb-4 line-clamp-2">{issue.description}</p>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {issue.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="github-label github-label-default">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="border-t border-gray-700 pt-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <a
                                href={issue.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-github-secondary text-sm flex items-center justify-center"
                              >
                                <Github className="w-4 h-4 mr-2" />
                                View Repository
                              </a>
                              
                              <button
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setShowStakingModal(true);
                                }}
                                className="btn-github-primary text-sm flex items-center justify-center"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                Take Issue
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                </div>
              )}
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

        {/* Staking Modal */}
        {showStakingModal && selectedIssue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="github-card max-w-md w-full p-6" style={{ backgroundColor: '#161b22' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="github-h3 mb-0">Assign Issue</h3>
                <button
                  onClick={() => setShowStakingModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="github-text-title text-lg mb-2">{selectedIssue.title}</h4>
                
                <div className="github-card p-3 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="github-text-muted">Repository:</span>
                    <span className="github-text-link">{selectedIssue.repository}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="github-text-muted">Bounty:</span>
                    <span className="text-green-400 font-medium">{selectedIssue.bounty} ETH</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="github-text-muted">Estimated time:</span>
                    <span className="text-white">{selectedIssue.estimatedHours} hours</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="stake" className="block text-sm font-medium github-text-title mb-2">
                  Stake Amount
                </label>
                <input
                  type="text"
                  id="stake"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="github-input w-full"
                />
                <p className="mt-2 text-sm github-text-muted">
                  {mockMode ? (
                    <>Mock mode active - no real transaction will occur. Enter any amount for testing.</>
                  ) : (
                    <>Enter the amount you want to stake for this issue (5-20% of bounty: {selectedIssue && ((selectedIssue.bounty * 0.05).toFixed(6))} - {selectedIssue && ((selectedIssue.bounty * 0.20).toFixed(6))} ETH).</>
                  )}
                </p>
                
                <div className="mt-3 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="mockMode"
                    checked={mockMode}
                    onChange={(e) => setMockMode(e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  <label htmlFor="mockMode" className="text-sm github-text-muted">
                    Mock Mode (for testing without real funds)
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStakingModal(false)}
                  className="btn-github-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStakeAndAssign}
                  disabled={isStaking}
                  className="btn-github-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStaking ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Target className="w-4 h-4 mr-2" />
                      Assign Issue
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