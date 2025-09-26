'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Coins, User, Settings, Wallet } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();

  const handleAddRepo = () => {
    router.push('/submit');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 github-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">SecGit</span>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-3">
            <button onClick={handleAddRepo} className="btn-secondary">
              Submit Code
            </button>
            <button 
              onClick={() => router.push('/marketplace')}
              className="btn-primary"
            >
              Solve
            </button>
            
            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{account?.substring(0, 6)}...{account?.substring(account.length - 4)}</span>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Disconnect Wallet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-secondary flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-200 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
 
      </div>
    </header>
  );
}
