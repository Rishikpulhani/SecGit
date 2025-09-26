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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-8 shadow-lg shadow-green-500/25">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Header */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Bounties Created!</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Your repository has been successfully analyzed and {bountyCount} bounties have been created 
            with a total value of {totalAmount} ETH.
          </p>

          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-morphism rounded-xl p-6">
              <div className="text-3xl font-bold gradient-text mb-2">{bountyCount}</div>
              <div className="text-gray-300">Active Bounties</div>
            </div>
            
            <div className="glass-morphism rounded-xl p-6">
              <div className="text-3xl font-bold gradient-text mb-2">{totalAmount} ETH</div>
              <div className="text-gray-300">Total Rewards</div>
            </div>
            
            <div className="glass-morphism rounded-xl p-6">
              <div className="text-3xl font-bold gradient-text mb-2">Public</div>
              <div className="text-gray-300">Listing Status</div>
            </div>
          </div>

          {/* Repository Info */}
          <div className="glass-morphism rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Your Project is Now Live!</h2>
            <p className="text-gray-300 mb-6">
              Contributors can now discover and work on your bounties. You'll receive notifications when 
              someone starts working on an issue or submits a solution.
            </p>
            
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-400 mb-1">Repository</div>
              <div className="text-gray-100 break-all">{githubUrl}</div>
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
                View Bounty Dashboard
              </button>
              
              <button className="btn-secondary">
                <Share2 className="w-4 h-4 mr-2" />
                Share Project
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-morphism rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">What Happens Next?</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Your bounties are now discoverable by contributors
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Contributors will submit proposals and solutions
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  You review and approve completed work
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                  Payments are automatically distributed
                </li>
              </ul>
            </div>

            <div className="glass-morphism rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Manage Your Bounties</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Monitor progress in your dashboard
                </li>
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Communicate with contributors
                </li>
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Add new bounties anytime
                </li>
                <li className="flex items-start">
                  <ExternalLink className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                  Track your project's reputation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
