'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Wallet, DollarSign, Target, Github } from 'lucide-react';
import Header from '../../components/Header';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { generateGitHubIssueBody, generateIssueTitle } from '../../utils/issueTemplates';

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account, isConnected, connectWallet, sendTransaction } = useWallet();
  const { user } = useAuth();
  
  const githubUrl = searchParams.get('repo') || '';
  const bountyCount = searchParams.get('bounties') || '0';
  const totalAmount = searchParams.get('total') || '0';
  
  const [bountyFee, setBountyFee] = useState('0.05'); // Platform fee
  const [isCreatingBounty, setIsCreatingBounty] = useState(false);
  const [approvedIssues, setApprovedIssues] = useState<any[]>([]);

  // Load actual approved issues from localStorage (stored from review page)
  useEffect(() => {
    try {
      const storedApprovedIssues = localStorage.getItem('approvedIssuesForBounty');
      if (storedApprovedIssues) {
        const parsedIssues = JSON.parse(storedApprovedIssues);
        setApprovedIssues(parsedIssues);
        // Clear the stored data after using it
        localStorage.removeItem('approvedIssuesForBounty');
      } else {
        // Fallback to mock data if no real data available
        const mockApprovedIssues = [
          {
            id: 1,
            type: 'security',
            title: 'Memory leak in WebSocket connection handler',
            description: 'The WebSocket connection handler is not properly cleaning up event listeners.',
            severity: 'high',
            estimatedHours: 8,
            suggestedBounty: 0.5,
            files: ['src/websocket.js']
          },
          {
            id: 2,
            type: 'bug',
            title: 'Race condition in async data fetching',
            description: 'Race condition in the data fetching logic causing inconsistent state.',
            severity: 'medium',
            estimatedHours: 6,
            suggestedBounty: 0.4,
            files: ['src/hooks/useApiData.js']
          }
        ];
        setApprovedIssues(mockApprovedIssues);
      }
    } catch (error) {
      console.error('Error loading approved issues:', error);
      setApprovedIssues([]);
    }
  }, []);

  const createGitHubIssuesForApproved = async () => {
    if (!user) return [];
    
    const accessToken = localStorage.getItem('github_access_token');
    if (!accessToken) return [];

    const createdIssues = [];
    
    for (const issue of approvedIssues) {
      try {
        const issueTitle = generateIssueTitle({
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          type: issue.type,
          file: issue.files?.[0]
        });

        const issueBody = generateGitHubIssueBody({
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          type: issue.type,
          file: issue.files?.[0]
        }, githubUrl);

        const response = await fetch('/api/github/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            repoUrl: githubUrl,
            title: issueTitle,
            body: issueBody,
            severity: issue.severity,
            type: issue.type
          }),
        });

        const result = await response.json();
        if (response.ok) {
          createdIssues.push({
            ...issue,
            githubIssueUrl: result.issue.html_url,
            githubIssueNumber: result.issue.number
          });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error creating GitHub issue:', error);
      }
    }
    
    return createdIssues;
  };

  const handleCreateBounty = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to create bounties');
      return;
    }

    setIsCreatingBounty(true);
    
    try {
      // Step 1: Create GitHub issues for all approved findings
      const issuesWithGitHub = await createGitHubIssuesForApproved();
      
      // Step 2: Send wallet transaction (0.00 ETH for now)
      const weiHex = '0x0'; // 0 ETH in hex
      const contractAddress = '0x742d35Cc6566C4d9EA3D3F4c10b5A2E1e9D4c5aF'; // Placeholder
      
      const txHash = await sendTransaction(contractAddress, weiHex);
      
      // Step 3: Store bounty data (in real app, this would be stored in database/blockchain)
      const bountyData = {
        id: Date.now(),
        repository: githubUrl,
        issues: issuesWithGitHub,
        totalBounty: totalAmount,
        platformFee: bountyFee,
        transactionHash: txHash,
        creator: account,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Store in localStorage for now (in production, this would be in a database)
      const existingBounties = JSON.parse(localStorage.getItem('userBounties') || '[]');
      existingBounties.push(bountyData);
      localStorage.setItem('userBounties', JSON.stringify(existingBounties));
      
      // Step 4: Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert('Failed to create bounty. Please try again.');
    } finally {
      setIsCreatingBounty(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-8">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Header */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Create Bounties!
          </h1>
          
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            Your analysis is complete with {bountyCount} approved findings. Create bounties to incentivize 
            developers to fix these issues in your repository.
          </p>

          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="github-card-elevated p-6">
              <div className="text-3xl font-bold text-white mb-2">{bountyCount}</div>
              <div className="text-gray-300">Security Issues</div>
            </div>
            
            <div className="github-card-elevated p-6 glow-blue">
              <div className="text-3xl font-bold text-blue-400 mb-2">{totalAmount} ETH</div>
              <div className="text-gray-300">Total Bounty Value</div>
            </div>
            
            <div className="github-card-elevated p-6 glow-green">
              <div className="text-3xl font-bold text-green-400 mb-2">Complete</div>
              <div className="text-gray-300">Report Status</div>
            </div>
          </div>

          {/* Bounty Creation */}
          <div className="github-card-elevated p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              <Target className="w-6 h-6 inline mr-2" />
              Stake and Create Bounty
            </h2>
            <p className="text-gray-200 mb-6">
              Create bounties for approved security findings. This will create GitHub issues and set up 
              rewards for developers who provide solutions.
            </p>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600/30">
              <div className="text-sm text-gray-300 mb-1">Repository</div>
              <div className="text-white break-all">{githubUrl}</div>
            </div>

            {/* Fee Information */}
            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-blue-300 font-semibold">Platform Fee</div>
                  <div className="text-blue-200 text-sm">One-time bounty creation fee</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-bold text-lg">{bountyFee} ETH</div>
                  <div className="text-blue-300 text-sm">Fixed Rate</div>
                </div>
              </div>
            </div>

            {/* Wallet Connection Status */}
            <div className="mb-6">
              {isConnected ? (
                <div className="flex items-center justify-center p-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Wallet Connected: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}</span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-yellow-300 mb-4">
                    <Wallet className="w-5 h-5 inline mr-2" />
                    <span>Please connect your wallet to create bounties</span>
                  </div>
                  <button
                    onClick={connectWallet}
                    className="btn-secondary"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Back to Review
              </button>
              
              <button 
                onClick={handleCreateBounty}
                disabled={!isConnected || isCreatingBounty}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingBounty ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Bounties...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Stake & Create Bounty ({bountyCount} issues)
                  </div>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
