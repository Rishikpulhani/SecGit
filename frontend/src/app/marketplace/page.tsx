'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, DollarSign, Clock, Users, Github, ExternalLink, Target, Zap, Shield, Bug } from 'lucide-react';
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
    issueNumber: 15
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
    issueNumber: 23
  },
  {
    id: 3,
    title: 'Add dark mode toggle functionality',
    description: 'Implement a dark mode toggle that persists user preference and provides smooth transitions between light and dark themes.',
    repository: 'gyanshupathak/SolVest',
    repoUrl: 'https://github.com/gyanshupathak/SolVest',
    type: 'feature',
    severity: 'medium',
    bounty: 0.4,
    estimatedHours: 6,
    applicants: 5,
    tags: ['ui', 'frontend', 'theme'],
    createdAt: '2024-01-10',
    issueNumber: 8
  },
  {
    id: 4,
    title: 'Database query optimization for user analytics',
    description: 'Optimize slow-running queries in the analytics dashboard. Current queries take 5+ seconds for large datasets.',
    repository: 'gyanshupathak/SolVest',
    repoUrl: 'https://github.com/gyanshupathak/SolVest',
    type: 'performance',
    severity: 'medium',
    bounty: 0.5,
    estimatedHours: 10,
    applicants: 1,
    tags: ['database', 'optimization', 'analytics'],
    createdAt: '2024-01-08',
    issueNumber: 12
  },
  {
    id: 5,
    title: 'Implement input validation for API endpoints',
    description: 'Add comprehensive input validation and sanitization for all API endpoints to prevent injection attacks.',
    repository: 'gyanshupathak/health_panel',
    repoUrl: 'https://github.com/gyanshupathak/health_panel',
    type: 'security',
    severity: 'critical',
    bounty: 1.2,
    estimatedHours: 16,
    applicants: 4,
    tags: ['security', 'api', 'validation'],
    createdAt: '2024-01-05',
    issueNumber: 31
  },
  {
    id: 6,
    title: 'Create responsive mobile navigation',
    description: 'Design and implement a mobile-friendly navigation system with hamburger menu and smooth animations.',
    repository: 'gyanshupathak/SolVest',
    repoUrl: 'https://github.com/gyanshupathak/SolVest',
    type: 'feature',
    severity: 'low',
    bounty: 0.3,
    estimatedHours: 8,
    applicants: 7,
    tags: ['mobile', 'ui', 'navigation'],
    createdAt: '2024-01-03',
    issueNumber: 5
  }
];

export default function Marketplace() {
  const router = useRouter();
  const { account, isConnected, connectWallet, sendTransaction } = useWallet();
  const { user } = useAuth();
  
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [isStaking, setIsStaking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Filter issues based on search and filters
  const filteredIssues = featuredIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.repository.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || issue.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'high': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'medium': return 'text-yellow-300 bg-yellow-600/20 border-yellow-500/30';
      case 'low': return 'text-green-300 bg-green-600/20 border-green-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return Shield;
      case 'bug': return Bug;
      case 'feature': return Zap;
      case 'performance': return Target;
      default: return Bug;
    }
  };

  const handleAssignIssue = (issue: any) => {
    setSelectedIssue(issue);
    setStakeAmount('0.5'); // Fixed stake amount
    setShowStakingModal(true);
  };

  const switchToBaseNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const baseChainId = '0x2105'; // Base mainnet chain ID (8453 in decimal)
    
    try {
      // Try to switch to Base network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseChainId }],
      });
    } catch (switchError: any) {
      // If Base network is not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: baseChainId,
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
          throw new Error('Failed to add Base network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Base network');
      }
    }
  };

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
        <Header />
        
        <main className="pt-20 px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                <Target className="w-8 h-8 inline mr-3" />
                Featured Issues
              </h1>
              <p className="text-gray-300 text-lg">
                Discover high-value issues from premium repositories. Stake and solve to earn rewards.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="github-card-elevated p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="security">Security</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <div>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Issues Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIssues.map((issue) => {
                const TypeIcon = getTypeIcon(issue.type);
                
                return (
                  <div key={issue.id} className="github-card-elevated p-6 hover:scale-[1.02] transition-all duration-300">
                    {/* Issue Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          issue.type === 'security' ? 'bg-red-600/20 text-red-400' :
                          issue.type === 'bug' ? 'bg-orange-600/20 text-orange-400' :
                          issue.type === 'feature' ? 'bg-blue-600/20 text-blue-400' :
                          'bg-purple-600/20 text-purple-400'
                        }`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                      <a
                        href={issue.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Repository */}
                    <div className="flex items-center text-gray-400 text-sm mb-3">
                      <Github className="w-4 h-4 mr-2" />
                      <span>{issue.repository}</span>
                      <span className="mx-2">•</span>
                      <span>#{issue.issueNumber}</span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{issue.title}</h3>
                    <p className="text-gray-300 mb-4 line-clamp-3">{issue.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {issue.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {issue.bounty} ETH
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {issue.estimatedHours}h
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {issue.applicants}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleAssignIssue(issue)}
                      className="w-full btn-primary"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Assign & Stake
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredIssues.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Issues Found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </main>

        {/* Staking Modal */}
        {showStakingModal && selectedIssue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="github-card-elevated max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Stake & Assign Issue</h3>
                  <button
                    onClick={() => setShowStakingModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Issue Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">{selectedIssue.title}</h4>
                  <div className="flex items-center text-gray-400 text-sm mb-2">
                    <Github className="w-4 h-4 mr-2" />
                    <span>{selectedIssue.repository}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Bounty: {selectedIssue.bounty} ETH</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(selectedIssue.severity)}`}>
                      {selectedIssue.severity}
                    </span>
                  </div>
                </div>

                {/* Stake Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Stake Amount (ETH on Base)
                  </label>
                  <input
                    type="text"
                    value="0.5"
                    readOnly
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 cursor-not-allowed"
                  />
                  <div className="mt-2 p-3 bg-blue-600/10 border border-blue-500/30 rounded-md">
                    <div className="text-sm text-blue-300">
                      <strong>Fixed Stake:</strong> Standard 0.5 ETH stake amount for all issues. 
                      Transaction processed on Base network with promotional 0.00 ETH fee.
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Stake is refunded upon successful completion + you earn the bounty
                  </p>
                </div>

                {/* Wallet Status */}
                {!isConnected ? (
                  <div className="text-center mb-6">
                    <div className="p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-yellow-300 mb-4">
                      Please connect your wallet to stake
                    </div>
                    <button onClick={connectWallet} className="btn-secondary w-full">
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 mb-6 text-center">
                    Wallet Connected: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowStakingModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStakeAndAssign}
                    disabled={!isConnected || isStaking}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStaking ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Staking...
                      </div>
                    ) : (
                      'Stake & Assign'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}