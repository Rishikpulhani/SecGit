'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Wallet, LogOut, Github, Search, Plus, Bell, Wrench } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubmit } from '../contexts/SubmitContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { user, isAuthenticated, logout } = useAuth();
  const { openSubmitModal } = useSubmit();

  return (
    <header className="github-header border-b border-gray-700">
      <div className="github-container">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Left: GitHub Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
              <Github className="w-8 h-8" />
              <span className="text-lg font-semibold">SecGit</span>
            </button>
          </div>

          {/* Center: GitHub Navigation */}
          <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            <button 
              onClick={() => router.push('/marketplace')}
              className="px-3 py-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Issues
            </button>
            <button 
              onClick={openSubmitModal}
              className="px-3 py-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Submit
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-3 py-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Dashboard
            </button>
          </nav>

          {/* Right: Solve Button */}
          <div className="hidden md:flex items-center">
            <button 
              onClick={() => router.push('/solver-dashboard')}
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Solve
            </button>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-3">

            {/* Wallet Status */}
            {isAuthenticated && (
              <div className="hidden md:block">
                {isConnected ? (
                  <div className="relative group">
                    <button className="px-2 py-1 text-xs bg-green-600 text-white rounded flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                      <span>{account?.substring(0, 6)}...</span>
                    </button>
                    
                    {/* Wallet Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-64 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{ backgroundColor: '#161b22' }}>
                      <div className="p-3">
                        <div className="text-xs text-gray-400 mb-1">Connected Account</div>
                        <div className="text-sm text-gray-200 font-mono break-all mb-3">{account}</div>
                        <button
                          onClick={disconnectWallet}
                          className="w-full px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-600 transition-colors flex items-center space-x-1"
                    style={{ backgroundColor: '#21262d', borderColor: '#30363d', color: 'white' }}
                  >
                    <Wallet className="w-3 h-3" />
                    <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                  </button>
                )}
              </div>
            )}

            {/* User Profile - GitHub Style */}
            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="flex items-center">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-8 h-8 rounded-full border border-gray-600 hover:border-gray-500 transition-colors"
                  />
                </button>
                
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-64 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{ backgroundColor: '#161b22' }}>
                  <div className="p-3 border-b border-gray-700">
                    <div className="text-sm font-medium text-white">{user.name || user.login}</div>
                    <div className="text-xs text-gray-400">@{user.login}</div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      Your repositories
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      Your bounties
                    </button>
                    <div className="border-t border-gray-700 my-1"></div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="btn-github-primary flex items-center space-x-1"
              >
                <span>Sign in</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <nav className="flex flex-col space-y-3">
              <button 
                onClick={() => {
                  router.push('/marketplace');
                  setIsMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Issues
              </button>
              <button 
                onClick={() => {
                  openSubmitModal();
                  setIsMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Submit
              </button>
              <button 
                onClick={() => {
                  router.push('/dashboard');
                  setIsMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              
              {/* Mobile Wallet */}
              {isAuthenticated && (
                <div className="border-t border-gray-700 pt-3 mt-3">
                  {isConnected ? (
                    <div className="px-3">
                      <div className="text-xs text-gray-400 mb-1">Wallet Connected</div>
                      <div className="text-sm text-gray-200 font-mono mb-2">{account?.substring(0, 10)}...</div>
                      <button
                        onClick={disconnectWallet}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="mx-3 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}