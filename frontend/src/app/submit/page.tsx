'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Github, Zap, Shield, AlertCircle, ExternalLink, Wallet, CheckCircle } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useWallet } from '../../contexts/WalletContext';

export default function SubmitProject() {
  const router = useRouter();
  const { account, isConnected, connectWallet, sendTransaction } = useWallet();
  const [githubUrl, setGithubUrl] = useState('');
  const [depositAmount, setDepositAmount] = useState('0.00'); // Set to 0.00 ETH as requested
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{github?: string; deposit?: string; wallet?: string}>({});

  const validateGithubUrl = (url: string) => {
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: {github?: string; deposit?: string; wallet?: string} = {};
    
    if (!githubUrl) {
      newErrors.github = 'GitHub URL is required';
    } else if (!validateGithubUrl(githubUrl)) {
      newErrors.github = 'Please enter a valid GitHub repository URL';
    }

    if (!isConnected) {
      newErrors.wallet = 'Please connect your wallet to continue';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send 0.00 ETH (no value transaction, just for record keeping)
      const weiHex = '0x0'; // 0 ETH in hex
      
      // Send transaction to a placeholder address (in real implementation, this would be your smart contract)
      const contractAddress = '0x742d35Cc6566C4d9EA3D3F4c10b5A2E1e9D4c5aF'; // Placeholder address
      
      const txHash = await sendTransaction(contractAddress, weiHex);
      setTransactionHash(txHash);
      
      // Simulate API call to save repository data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Submission successful:', { 
        githubUrl, 
        depositAmount, 
        transactionHash: txHash,
        account 
      });
      
      setShowSuccess(true);
      
      // Redirect to analysis page after showing success
      setTimeout(() => {
        router.push(`/analysis?repo=${encodeURIComponent(githubUrl)}&deposit=0.00&tx=${txHash}`);
      }, 3000);
      
    } catch (error) {
      console.error('Transaction failed:', error);
      setErrors({ wallet: 'Transaction failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
        <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-400 hover:text-gray-200 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 border border-gray-700 mb-6">
              <Github className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Code Submission</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-100">
              Submit Your Code
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Submit your code for comprehensive security analysis and quality review.
            </p>
          </div>

          {/* Main form */}
          <div className="github-card-elevated p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* GitHub URL Input */}
              <div>
                <label htmlFor="github-url" className="block text-sm font-semibold text-gray-200 mb-3">
                  GitHub Repository URL *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Github className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    id="github-url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
                {errors.github && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.github}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  Make sure your repository is public and accessible for analysis.
                </p>
              </div>

              {/* Wallet Connection Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Wallet Connection *
                </label>
                
                {isConnected ? (
                  <div className="flex items-center p-3 bg-green-600/10 border border-green-500/30 rounded-md">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    <div>
                      <div className="text-green-300 font-medium">Wallet Connected</div>
                      <div className="text-sm text-green-400">
                        {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-red-600/10 border border-red-500/30 rounded-md">
                      <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                      <div className="text-red-300">Wallet not connected</div>
                    </div>
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Connect MetaMask</span>
                    </button>
                  </div>
                )}
                
                {errors.wallet && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.wallet}
                  </p>
                )}
              </div>

              {/* Deposit Amount */}
              <div>
                <label htmlFor="deposit" className="block text-sm font-semibold text-gray-200 mb-3">
                  Analysis Fee (ETH) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-mono">Ξ</span>
                  </div>
                  <input
                    type="text"
                    id="deposit"
                    value="0.00"
                    readOnly
                    className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 cursor-not-allowed"
                  />
                </div>
                {errors.deposit && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.deposit}
                  </p>
                )}
                <div className="mt-2 p-3 bg-blue-600/10 border border-blue-500/30 rounded-md">
                  <div className="text-sm text-blue-300">
                    <strong>Free Analysis:</strong> No fee required for code submission. This is a promotional offer.
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {transactionHash ? 'Processing Analysis...' : 'Confirming Transaction...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    {isConnected ? 'Submit Code & Process Transaction' : 'Connect Wallet to Continue'}
                  </div>
                )}
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="github-card-elevated max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">Transaction Successful!</h3>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Repository</div>
                  <div className="text-white text-sm break-all">{githubUrl}</div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Transaction Hash</div>
                  <div className="text-green-400 text-sm font-mono break-all">{transactionHash}</div>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Analysis Fee</div>
                  <div className="text-white text-sm">0.00 ETH (Free Promotion)</div>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-6">
                Your code submission has been processed successfully. You will be redirected to the analysis page shortly.
              </p>
              
              <div className="flex items-center justify-center text-blue-400 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                Redirecting...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
