'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

export default function Marketplace() {
  const router = useRouter();
  const [showStakingModal, setShowStakingModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Issue Marketplace
          </h1>
          
          <p className="text-gray-200 mb-8">
            Browse and solve issues to earn rewards.
          </p>

          <div className="github-card-elevated p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Sample Issue
            </h3>
            <p className="text-gray-200 mb-4">
              This is a test issue to verify the page works.
            </p>
            <button
              onClick={() => setShowStakingModal(true)}
              className="btn-primary"
            >
              Assign & Stake
            </button>
          </div>
        </div>
      </main>

      {showStakingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="github-card-elevated max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Test Modal</h3>
            <p className="text-gray-200 mb-6">This is a test modal.</p>
            <button
              onClick={() => setShowStakingModal(false)}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}