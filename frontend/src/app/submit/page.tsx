'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Github, Zap, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import Header from '../../components/Header';

export default function SubmitProject() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState('');
  const [depositAmount, setDepositAmount] = useState('0.01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{github?: string; deposit?: string}>({});

  const validateGithubUrl = (url: string) => {
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: {github?: string; deposit?: string} = {};
    
    if (!githubUrl) {
      newErrors.github = 'GitHub URL is required';
    } else if (!validateGithubUrl(githubUrl)) {
      newErrors.github = 'Please enter a valid GitHub repository URL';
    }

    if (!depositAmount || parseFloat(depositAmount) < 0.001) {
      newErrors.deposit = 'Minimum deposit is 0.001 ETH';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would integrate with your backend/smart contract
    console.log('Submitting:', { githubUrl, depositAmount });
    
    setIsSubmitting(false);
    
    // Redirect to analysis page
    router.push(`/analysis?repo=${encodeURIComponent(githubUrl)}&deposit=${depositAmount}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-400 hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 mb-6 backdrop-blur-sm">
              <Github className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Project Submission</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Submit Your Repository</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Submit your GitHub repository for AI analysis and connect with skilled contributors ready to solve your issues.
            </p>
          </div>

          {/* Main form */}
          <div className="glass-morphism rounded-2xl p-8 mb-8">
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
                    className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                {errors.github && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.github}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  Make sure your repository is public and contains clear issues or tasks.
                </p>
              </div>

              {/* Deposit Amount */}
              <div>
                <label htmlFor="deposit" className="block text-sm font-semibold text-gray-200 mb-3">
                  Analysis Deposit (ETH) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-mono">Ξ</span>
                  </div>
                  <input
                    type="number"
                    id="deposit"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="0.001"
                    step="0.001"
                    placeholder="0.01"
                    className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                {errors.deposit && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.deposit}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  This deposit covers the initial AI analysis of your repository. Minimum: 0.001 ETH
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Analyzing Repository...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Submit for Analysis
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-morphism rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">
                Our AI analyzes your repository structure, identifies issues, and estimates complexity for potential bounties.
              </p>
            </div>

            <div className="glass-morphism rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Secure Escrow</h3>
              <p className="text-gray-400 text-sm">
                Your deposit is held in a smart contract escrow until contributors complete the work to your satisfaction.
              </p>
            </div>

            <div className="glass-morphism rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Public Listing</h3>
              <p className="text-gray-400 text-sm">
                Once analyzed, your project will be listed publicly for contributors to discover and work on.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
