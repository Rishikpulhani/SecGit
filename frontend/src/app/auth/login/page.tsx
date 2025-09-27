'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Shield, Code, Users, Loader2 } from 'lucide-react';
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
      <div className="github-layout min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <div className="github-text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="github-layout min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Github className="w-12 h-12 text-white" />
            <span className="text-2xl font-bold text-white ml-3">SecGit</span>
          </div>
          <h1 className="github-h1 text-center mb-2">Welcome to SecGit</h1>
          <p className="github-text-muted">Sign in with GitHub to access secure code analysis</p>
        </div>

        {/* Login Card */}
        <div className="github-card p-8" style={{ backgroundColor: '#161b22' }}>
          <div className="text-center mb-6">
            <h2 className="github-h2 text-center mb-2">Sign in to continue</h2>
            <p className="github-text-muted text-sm">
              Connect with your GitHub account to submit and analyze code repositories
            </p>
          </div>

          {/* GitHub Login Button */}
          <button
            onClick={login}
            className="btn-github-primary w-full flex items-center justify-center py-3 text-lg"
          >
            <Github className="w-5 h-5 mr-3" />
            Continue with GitHub
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs github-text-muted">
              By signing in, you agree to our <span className="github-text-link">terms</span> and <span className="github-text-link">privacy policy</span>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="github-card p-4">
            <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-sm github-text-title">Secure</div>
            <div className="text-xs github-text-muted">Code Analysis</div>
          </div>
          <div className="github-card p-4">
            <Code className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-sm github-text-title">Smart</div>
            <div className="text-xs github-text-muted">Bounties</div>
          </div>
          <div className="github-card p-4">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-sm github-text-title">Community</div>
            <div className="text-xs github-text-muted">Driven</div>
          </div>
        </div>
      </div>
    </div>
  );
}