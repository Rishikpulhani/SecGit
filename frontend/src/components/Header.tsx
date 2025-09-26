'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Coins, User, Settings } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleAddRepo = () => {
    router.push('/submit');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-gray-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">BountyHub</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#explore" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">
              Explore Projects
            </a>
            <a href="#contributors" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">
              Contributors
            </a>
            <a href="#rewards" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">
              Rewards
            </a>
            <a href="#about" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">
              About
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={handleAddRepo} className="btn-secondary">
              Add Repo
            </button>
            <button className="btn-primary">
              Solve
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-800/50 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-600/30">
            <div className="flex flex-col space-y-4">
              <a href="#explore" className="text-gray-300 hover:text-blue-400 font-medium transition-colors px-2 py-1">
                Explore Projects
              </a>
              <a href="#contributors" className="text-gray-300 hover:text-blue-400 font-medium transition-colors px-2 py-1">
                Contributors
              </a>
              <a href="#rewards" className="text-gray-300 hover:text-blue-400 font-medium transition-colors px-2 py-1">
                Rewards
              </a>
              <a href="#about" className="text-gray-300 hover:text-blue-400 font-medium transition-colors px-2 py-1">
                About
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-600/30">
                <button onClick={handleAddRepo} className="btn-secondary">
                  Add Repo
                </button>
                <button className="btn-primary">
                  Solve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
