'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Coins, Users, Github, X, Zap, CheckCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useSubmit } from '../contexts/SubmitContext';

export default function Hero() {
  const router = useRouter();
  const { account, isConnected, connectWallet, sendTransaction } = useWallet();
  const { showSubmitModal, openSubmitModal, closeSubmitModal } = useSubmit();
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      closeSubmitModal();
      // Redirect to analysis
      router.push(`/analysis?repo=${encodeURIComponent(githubUrl)}`);
    } catch (error) {
      alert('Failed to submit. Please try again.');
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
          <button className="btn-secondary group">
            <Github className="mr-2 w-4 h-4" />
            View Dashboard
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
              Enter your GitHub repository URL to start comprehensive security analysis and create bounties for discovered issues.
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

              {/* Analysis Info */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                <div className="text-sm text-blue-300">
                  <strong>Free Analysis:</strong> No fees required for code submission. Get comprehensive security reports and create bounties for discovered vulnerabilities.
                </div>
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
                      Starting Analysis...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Start Analysis
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
