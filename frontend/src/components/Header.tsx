'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Coins, User, Settings, Wallet, LogOut, Github } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { user, isAuthenticated, logout } = useAuth();

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
            
            {/* User Profile / Auth */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Status */}
                {isConnected ? (
                  <div className="relative group">
                    <button className="px-3 py-1.5 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-xs hover:bg-green-600/30 transition-colors">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="hidden sm:inline">Wallet Connected</span>
                        <span className="sm:hidden">Wallet</span>
                        <span className="font-mono">{account?.substring(0, 4)}...{account?.substring(account.length - 4)}</span>
                      </div>
                    </button>
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-3">
                        <div className="text-xs text-gray-400 mb-1">Connected Account</div>
                        <div className="text-sm text-gray-200 font-mono break-all mb-3">{account}</div>
                        <button
                          onClick={disconnectWallet}
                          className="w-full flex items-center justify-center px-3 py-2 bg-red-600/20 border border-red-500/30 rounded text-red-300 text-xs hover:bg-red-600/30 transition-colors"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-xs transition-colors flex items-center space-x-1"
                  >
                    <Wallet className="w-3 h-3" />
                    <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}
                
                {/* User Profile */}
                <div className="flex items-center space-x-2">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-8 h-8 rounded-full border-2 border-gray-600"
                  />
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-white">{user.name || user.login}</div>
                    <div className="text-xs text-gray-400">@{user.login}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="btn-primary flex items-center space-x-2"
              >
                <Github className="w-4 h-4" />
                <span>Sign In</span>
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
