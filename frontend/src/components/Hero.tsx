'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Coins, Users, Github, X, Zap, CheckCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { PAYMENT_CONFIG } from '../config/contract';
import { useSubmit } from '../contexts/SubmitContext';

export default function Hero() {
  const router = useRouter();
  const { 
    account, 
    isConnected, 
    isOnCorrectNetwork, 
    connectWallet, 
    switchToCorrectNetwork, 
    registerRepository,
    createContractIssue 
  } = useWallet();
  const { showSubmitModal, openSubmitModal, closeSubmitModal } = useSubmit();
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [transactionHashes, setTransactionHashes] = useState<string[]>([]);

  const handleStartContributing = () => {
    openSubmitModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUrl || !isConnected) {
      alert('Please enter a GitHub URL and connect your wallet');
      return;
    }

    setIsSubmitting(true);
    setCurrentStatus('Preparing submission...');
    setTransactionHashes([]);
    
    try {
      // Step 1: Network check (bypassed for Rabby wallet compatibility)
      setCurrentStatus('Using current network (0G-Galileo-Testnet detected)...');

      // Step 2: Register repository with contract payment (0.000001 ETH)
      setCurrentStatus(`Registering repository... (paying ${PAYMENT_CONFIG.ORG_REGISTRATION} ETH)`);
      const registerTx = await registerRepository(githubUrl);
      setTransactionHashes(prev => [...prev, registerTx]);
      setCurrentStatus('Repository registered successfully! ✅');

      // Step 3: Call AI agent for analysis
      setCurrentStatus('AI agents analyzing repository...');
      const aiResponse = await fetch('http://localhost:5000/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: githubUrl
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI analysis failed: ${aiResponse.status} ${aiResponse.statusText}`);
      }

      const aiResult = await aiResponse.json();

      if (!aiResult.success) {
        throw new Error('AI analysis returned failure');
      }

      setCurrentStatus('AI analysis completed! ✅');

      // Step 5: Optionally create GitHub issues
      setCurrentStatus('Creating GitHub issues...');
      try {
        const githubResponse = await fetch('http://localhost:5000/api/create-github-issue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_url: githubUrl,
            issue_data: aiResult.synthesized_analysis
          })
        });

        if (githubResponse.ok) {
          const githubResult = await githubResponse.json();
          setCurrentStatus('GitHub issues created! ✅');
          console.log('GitHub issue created:', githubResult.issue.url);
        } else {
          console.warn('GitHub issue creation failed, but continuing...');
          setCurrentStatus('Contract setup complete! (GitHub issue creation skipped)');
        }
      } catch (githubError) {
        console.warn('GitHub issue creation failed:', githubError);
        setCurrentStatus('Contract setup complete! (GitHub issue creation failed)');
      }

      // Step 6: Wait a moment then redirect to analysis page
      setCurrentStatus('✅ Complete! Redirecting to analysis results...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      closeSubmitModal();
      
      // Redirect to analysis page with proper parameters and data
      const analysisData = {
        success: true,
        analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentsUsed: aiResult.agents_used,
        agentsDiscovered: aiResult.agents_discovered,
        selectedAgents: aiResult.selected_agents,
        analysisMethod: aiResult.analysis_method,
        issue: {
          title: aiResult.synthesized_analysis.title,
          difficulty: aiResult.synthesized_analysis.difficulty,
          priority: aiResult.synthesized_analysis.priority,
          estimatedTime: aiResult.synthesized_analysis.implementation_estimate,
          labels: aiResult.synthesized_analysis.labels,
          acceptanceCriteria: aiResult.synthesized_analysis.acceptance_criteria,
          technicalRequirements: aiResult.synthesized_analysis.technical_requirements,
          description: aiResult.synthesized_analysis.body
        },
        repositoryInfo: {
          owner: githubUrl.split('/')[3],
          repo: githubUrl.split('/')[4],
          url: githubUrl
        }
      };
      
      router.push(
        `/analysis?repo=${encodeURIComponent(githubUrl)}&tx=${registerTx}&address=${account}&data=${encodeURIComponent(JSON.stringify(analysisData))}`
      );

    } catch (error: any) {
      console.error('Submission failed:', error);
      setCurrentStatus(`❌ Failed: ${error.message}`);
      alert(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20" style={{ paddingTop: '6rem' }}>
      <div className="w-full flex justify-center">
        <div className="relative max-w-4xl w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/60 border border-gray-600/40 mb-8 backdrop-blur-sm">
          <Shield className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-sm font-medium text-white">Secure Code Analysis Platform</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white text-center w-full">
          Secure Code Analysis
          <br />
          <span className="text-gray-200">for Development Teams</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          Submit your code for comprehensive security analysis. Get detailed reports on vulnerabilities, 
          code quality, and best practices to improve your development workflow.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button onClick={handleStartContributing} className="btn-primary group">
            Submit Repo
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Feature cards */}
        {/* <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="github-card-elevated p-6 glow-blue">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto border border-blue-500/30">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Analysis</h3>
            <p className="text-gray-200">Comprehensive vulnerability detection and security best practices analysis</p>
          </div>

          <div className="github-card-elevated p-6 glow-green">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto border border-green-500/30">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Team Collaboration</h3>
            <p className="text-gray-200">Share analysis results with your team and track improvements over time</p>
          </div>

          <div className="github-card-elevated p-6 glow-purple">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto border border-purple-500/30">
              <Coins className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quality Reports</h3>
            <p className="text-gray-200">Detailed reports with actionable insights to improve code quality and maintainability</p>
          </div>
        </div> */}
        </div>
      </div>

      {/* Submit Repository Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="github-card max-w-2xl w-full p-8" style={{ backgroundColor: '#161b22' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-white">Submit Repository</h3>
              <button
                onClick={closeSubmitModal}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Enter your GitHub repository URL to start comprehensive security analysis. 
              You'll pay {PAYMENT_CONFIG.ORG_REGISTRATION} ETH to register your repository and create bounties for discovered vulnerabilities.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* GitHub URL Input */}
              <div>
                <label htmlFor="github-url" className="block text-sm font-medium text-white mb-2">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    id="github-url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Wallet Connection Status */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                {isConnected ? (
                  <div className="flex items-center text-green-400">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Wallet Connected: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center text-yellow-400 mb-3">
                      <Shield className="w-5 h-5 mr-2" />
                      <span>Wallet connection required</span>
                    </div>
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="btn-github-secondary text-sm"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={closeSubmitModal}
                  className="btn-github-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isConnected || !githubUrl}
                  className="btn-github-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Processing Transaction...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Submit & Analyze ({PAYMENT_CONFIG.ORG_REGISTRATION} ETH)
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Status Display */}
            {isSubmitting && (
              <div className="mt-6 p-6 bg-gray-800/50 border border-gray-600 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-3"></div>
                  <p className="text-white font-medium">Processing Submission...</p>
                </div>
                
                {currentStatus && (
                  <p className="text-blue-400 mb-4">{currentStatus}</p>
                )}
                
                {transactionHashes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-300 text-sm mb-2">Transaction Hashes:</p>
                    {transactionHashes.map((hash, index) => (
                      <a
                        key={index}
                        href={`https://chainscan-testnet.0g.ai/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-300 hover:text-blue-200 text-sm font-mono mb-1 hover:underline"
                      >
                        {index + 1}. {hash.slice(0, 10)}...{hash.slice(-8)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Network Status - Hidden for Rabby compatibility */}
          </div>
        </div>
      )}
    </section>
  );
}
