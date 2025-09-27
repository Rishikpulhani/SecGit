'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, DollarSign, Clock, Users, Github, ExternalLink, Target, Zap, Shield, Bug, AlertCircle, Plus, CheckCircle, X } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Featured issues from gyanshupathak repositories
const featuredIssues = [
  {
    id: 1,
    title: 'Implement secure authentication system',
    description: 'Add JWT-based authentication with proper password hashing and session management for the health panel application.',
    repository: 'gyanshupathak/health_panel',
    repoUrl: 'https://github.com/gyanshupathak/health_panel',
    type: 'security',
    severity: 'high',
    bounty: 0.8,
    estimatedHours: 12,
    applicants: 3,
    tags: ['authentication', 'security', 'backend'],
    createdAt: '2024-01-15',
    issueNumber: 15,
    author: 'gyanshupathak',
    comments: 5,
    status: 'open'
  },
  {
    id: 2,
    title: 'Fix memory leak in data processing module',
    description: 'Memory usage continuously increases during large dataset processing, causing application crashes after extended use.',
    repository: 'gyanshupathak/health_panel',
    repoUrl: 'https://github.com/gyanshupathak/health_panel',
    type: 'bug',
    severity: 'high',
    bounty: 0.6,
    estimatedHours: 8,
    applicants: 2,
    tags: ['performance', 'memory', 'optimization'],
    createdAt: '2024-01-12',
    issueNumber: 23,
    author: 'gyanshupathak',
    comments: 3,
    status: 'open'
  },
  {
    id: 3,
    title: 'Add input validation for user registration',
    description: 'User registration form lacks proper input validation, allowing malformed data to be submitted.',
    repository: 'gyanshupathak/SolVest',
    repoUrl: 'https://github.com/gyanshupathak/SolVest',
    type: 'security',
    severity: 'medium',
    bounty: 0.4,
    estimatedHours: 6,
    applicants: 5,
    tags: ['validation', 'frontend', 'security'],
    createdAt: '2024-01-10',
    issueNumber: 8,
    author: 'gyanshupathak',
    comments: 2,
    status: 'open'
  },
  {
    id: 4,
    title: 'Optimize database queries for user analytics',
    description: 'Current analytics queries are slow and cause performance issues. Need to implement proper indexing and query optimization.',
    repository: 'gyanshupathak/SolVest',
    repoUrl: 'https://github.com/gyanshupathak/SolVest',
    type: 'performance',
    severity: 'medium',
    bounty: 0.5,
    estimatedHours: 10,
    applicants: 1,
    tags: ['database', 'performance', 'analytics'],
    createdAt: '2024-01-08',
    issueNumber: 12,
    author: 'gyanshupathak',
    comments: 7,
    status: 'open'
  },
  {
    id: 5,
    title: 'Implement rate limiting for API endpoints',
    description: 'API endpoints are vulnerable to abuse without proper rate limiting. Need to implement rate limiting middleware.',
    repository: 'gyanshupathak/health_panel',
    repoUrl: 'https://github.com/gyanshupathak/health_panel',
    type: 'security',
    severity: 'critical',
    bounty: 1.0,
    estimatedHours: 15,
    applicants: 4,
    tags: ['api', 'security', 'middleware'],
    createdAt: '2024-01-05',
    issueNumber: 31,
    author: 'gyanshupathak',
    comments: 9,
    status: 'open'
  }
];

export default function Marketplace() {
  const router = useRouter();
  const { account, isConnected, sendTransaction } = useWallet();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSeverity] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('0.5');
  const [isStaking, setIsStaking] = useState(false);

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
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });
        } catch (addError) {
          throw new Error('Failed to add Base network to MetaMask. Please add it manually.');
        }
      } else {
        throw new Error('Failed to switch to Base network. Please switch manually in MetaMask.');
      }
    }
  };

  const filteredIssues = featuredIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || issue.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleStakeAndAssign = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to stake and assign issues');
      return;
    }

    setIsStaking(true);
    
    try {
      // Check and switch to Base network if needed
      await switchToBaseNetwork();
      
      // Send 0.00 ETH transaction (UI shows 0.5 ETH stake for display)
      const weiHex = '0x0'; // 0 ETH in hex
      
      // Base network contract address (placeholder - replace with actual contract)
      const contractAddress = '0x742d35Cc6566C4d9EA3D3F4c10b5A2E1e9D4c5aF';
      
      const txHash = await sendTransaction(contractAddress, weiHex);
      
      // Store assignment data
      const assignmentData = {
        id: Date.now(),
        issueId: selectedIssue.id,
        issue: selectedIssue,
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
      
      // Redirect to solver dashboard
      router.push('/solver-dashboard');
      
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
    <ProtectedRoute>
      <div className="github-layout">
        <Header />
        
        <main className="pt-16">
          <div className="github-container">
            {/* GitHub Issues Header */}
            <div className="github-repo-header py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-gray-400" />
                  <div>
                    <h1 className="github-h1 mb-0">Issues</h1>
                    <p className="github-text-muted text-sm">
                      Solve security issues and earn bounties from open source repositories
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn-github-secondary text-sm">
                    <Filter className="w-4 h-4 mr-1" />
                    Filters
                  </button>
                  <button 
                    onClick={() => router.push('/submit')}
                    className="btn-github-primary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New Issue
                  </button>
                </div>
              </div>
            </div>

            {/* GitHub Search and Filters */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* Search Bar */}
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
                
                {/* Filter Dropdowns */}
                <div className="flex gap-2">
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
                    onChange={(e) => setSeverity(e.target.value)}
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

              {/* GitHub Issue Counter */}
              <div className="flex items-center justify-between text-sm github-text-muted mb-4">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 github-icon-open" />
                    {filteredIssues.length} Open
                  </span>
                  <span className="flex items-center">
                    <X className="w-4 h-4 mr-1 github-icon-closed" />
                    0 Closed
                  </span>
                </div>
              </div>
            </div>

            {/* GitHub Issues List */}
            <div className="github-card">
              {filteredIssues.length === 0 ? (
                <div className="p-12 text-center">
                  <Target className="w-16 h-16 github-text-muted mx-auto mb-4" />
                  <h3 className="github-h3 mb-2">No issues found</h3>
                  <p className="github-text-muted">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              ) : (
                <div>
                  {filteredIssues.map((issue, index) => {
                    const TypeIcon = getTypeIcon(issue.type);
                    
                    return (
                      <div key={issue.id} className={`github-issue-item ${index === filteredIssues.length - 1 ? 'border-b-0' : ''}`}>
                        <div className="flex items-start space-x-3">
                          {/* Issue Icon */}
                          <CheckCircle className="w-4 h-4 mt-1 github-icon-open flex-shrink-0" />
                          
                          {/* Issue Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Issue Title */}
                                <h3 className="github-text-title text-base font-medium hover:text-blue-400 cursor-pointer mb-1">
                                  {issue.title}
                                  <span className="github-issue-number ml-1">#{issue.issueNumber}</span>
                                </h3>
                                
                                {/* Issue Meta */}
                                <div className="flex flex-wrap items-center gap-2 text-sm github-text-muted mb-2">
                                  <span>opened {formatDate(issue.createdAt)} by</span>
                                  <span className="github-text-link">{issue.author}</span>
                                  <span>•</span>
                                  <span>{issue.comments} comments</span>
                                  <span>•</span>
                                  <span className="github-text-link flex items-center">
                                    <Github className="w-3 h-3 mr-1" />
                                    {issue.repository}
                                  </span>
                                </div>
                                
                                {/* Issue Description */}
                                <p className="github-text-muted text-sm mb-3 line-clamp-2">
                                  {issue.description}
                                </p>
                                
                                {/* Labels and Tags */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className={`github-label ${getTypeColor(issue.type)}`}>
                                    {issue.type}
                                  </span>
                                  <span className={`github-label ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </span>
                                  {issue.tags.slice(0, 2).map((tag, index) => (
                                    <span key={index} className="github-label" style={{ backgroundColor: '#6366f1', color: 'white' }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                
                                {/* Bounty Info */}
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center github-text-muted">
                                    <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                                    <span className="text-green-400 font-medium">{issue.bounty} ETH</span>
                                    <span className="ml-1">bounty</span>
                                  </span>
                                  <span className="flex items-center github-text-muted">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {issue.estimatedHours}h estimated
                                  </span>
                                  <span className="flex items-center github-text-muted">
                                    <Users className="w-4 h-4 mr-1" />
                                    {issue.applicants} interested
                                  </span>
                                </div>
                              </div>
                              
                              {/* Action Button */}
                              <div className="flex-shrink-0 ml-4">
                                <button
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setShowStakingModal(true);
                                  }}
                                  className="btn-github-primary text-sm"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Staking Modal */}
        {showStakingModal && selectedIssue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="github-card max-w-md w-full p-6" style={{ backgroundColor: '#161b22' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="github-h3 mb-0">Stake and Assign Issue</h3>
                <button
                  onClick={() => setShowStakingModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="github-text-title text-lg mb-2">{selectedIssue.title}</h4>
                <p className="github-text-muted text-sm mb-4">{selectedIssue.description}</p>
                
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
                  Stake Amount (ETH on Base)
                </label>
                <input
                  type="text"
                  id="stake"
                  value="0.5"
                  readOnly
                  className="github-input bg-gray-700 cursor-not-allowed"
                />
                <div className="mt-2 p-3 github-card text-sm">
                  <div className="text-blue-300">
                    <strong>Fixed Stake:</strong> Standard 0.5 ETH stake amount for all issues. 
                    Transaction processed on Base network with promotional 0.00 ETH fee.
                  </div>
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
                  disabled={isStaking || !isConnected}
                  className="btn-github-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStaking ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Staking...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Target className="w-4 h-4 mr-2" />
                      Stake & Assign
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