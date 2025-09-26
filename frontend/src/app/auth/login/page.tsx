'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Shield, Code, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white ml-3">SecGit</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SecGit</h1>
          <p className="text-gray-400">Sign in with GitHub to access secure code analysis</p>
        </div>

        {/* Login Card */}
        <div className="github-card-elevated p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Sign in to continue</h2>
            <p className="text-gray-300 text-sm">
              Connect with your GitHub account to submit and analyze code repositories
            </p>
          </div>

          {/* GitHub Login Button */}
          <button
            onClick={login}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white font-medium"
          >
            <Github className="w-5 h-5 mr-3" />
            Continue with GitHub
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our terms and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
