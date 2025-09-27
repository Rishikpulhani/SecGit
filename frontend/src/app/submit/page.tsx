'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Github, Shield, Zap } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useWallet } from '../../contexts/WalletContext';

export default function SubmitProject() {
  const router = useRouter();
  const { account, isConnected, connectWallet, sendTransaction } = useWallet();
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Redirect to analysis
      router.push(`/analysis?repo=${encodeURIComponent(githubUrl)}`);
    } catch (error) {
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="github-layout">
        <Header />
        
        <main className="pt-16">
          <section className="relative min-h-screen flex items-center justify-center px-4 py-20" style={{ paddingTop: '6rem' }}>
            <div className="w-full flex justify-center">
              <div className="relative max-w-4xl w-full text-center">
                
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/60 border border-gray-600/40 mb-8 backdrop-blur-sm">
                  <Shield className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium text-white">Code Submission</span>
                </div>

                {/* Main headline */}
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white text-center w-full">
                  Submit Your Repository
                  <br />
                  <span className="text-gray-200">for Security Analysis</span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                  Enter your GitHub repository URL to start comprehensive security analysis. 
                  Get detailed reports and create bounties for discovered vulnerabilities.
                </p>

                {/* Simple Form */}
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="w-full px-6 py-4 text-lg bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isConnected}
                      className="btn-github-primary px-8 py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Analyzing...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Zap className="w-5 h-5 mr-2" />
                          Analyze
                        </div>
                      )}
                    </button>
                  </div>
                </form>

                {/* Connection Status */}
                {!isConnected && (
                  <div className="mb-8">
                    <p className="text-gray-400 mb-4">Connect your wallet to continue</p>
                    <button
                      onClick={connectWallet}
                      className="btn-github-secondary"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </button>
                  </div>
                )}

              </div>
            </div>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}