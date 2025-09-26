'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ExternalLink, Home, Eye, Share2 } from 'lucide-react';
import Header from '../../components/Header';

export default function Success() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const githubUrl = searchParams.get('repo') || '';
  const bountyCount = searchParams.get('bounties') || '0';
  const totalAmount = searchParams.get('total') || '0';

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
            Analysis Complete!
          </h1>
          
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            Your code has been successfully analyzed and a comprehensive security report has been generated 
            with {bountyCount} findings requiring attention.
          </p>

          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="github-card-elevated p-6">
              <div className="text-3xl font-bold text-white mb-2">{bountyCount}</div>
              <div className="text-gray-300">Security Issues</div>
            </div>
            
            <div className="github-card-elevated p-6 glow-blue">
              <div className="text-3xl font-bold text-blue-400 mb-2">{totalAmount} ETH</div>
              <div className="text-gray-300">Analysis Cost</div>
            </div>
            
            <div className="github-card-elevated p-6 glow-green">
              <div className="text-3xl font-bold text-green-400 mb-2">Complete</div>
              <div className="text-gray-300">Report Status</div>
            </div>
          </div>

          {/* Repository Info */}
          <div className="github-card-elevated p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Analysis Report Ready!</h2>
            <p className="text-gray-200 mb-6">
              Your comprehensive security and code quality report is now available. Download the detailed 
              findings and recommendations to improve your codebase.
            </p>
            
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600/30">
              <div className="text-sm text-gray-300 mb-1">Repository</div>
              <div className="text-white break-all">{githubUrl}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/')}
                className="btn-secondary"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </button>
              
              <button className="btn-primary">
                <Eye className="w-4 h-4 mr-2" />
                View Report
              </button>
              
              <button className="btn-secondary">
                <Share2 className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="github-card-elevated p-6 text-left glow-green">
              <h3 className="text-lg font-semibold text-white mb-3">Your Analysis Report</h3>
              <ul className="space-y-2 text-gray-200 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Detailed security vulnerability assessment
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Code quality and maintainability analysis
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Best practices recommendations
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Step-by-step remediation guides
                </li>
              </ul>
            </div>

            <div className="github-card-elevated p-6 text-left glow-blue">
              <h3 className="text-lg font-semibold text-white mb-3">Take Action</h3>
              <ul className="space-y-2 text-gray-200 text-sm">
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Download the complete report PDF
                </li>
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Share findings with your team
                </li>
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Schedule follow-up analysis
                </li>
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Track improvement over time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
