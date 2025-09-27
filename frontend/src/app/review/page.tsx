'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Github, ExternalLink, Plus, X, Bug, Shield, AlertCircle, Clock, DollarSign } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for AI-discovered issues - GitHub style
const mockIssues = [
  {
    id: 1,
    number: 771,
    type: 'bug',
    title: 'Memory leak in WebSocket connection handler',
    description: 'The WebSocket connection handler in src/websocket.js is not properly cleaning up event listeners, leading to memory leaks during frequent reconnections.',
    severity: 'high',
    estimatedHours: 8,
    suggestedBounty: 0.5,
    files: ['src/websocket.js'],
    approved: false,
    author: 'secgit-analyzer',
    createdAt: '2024-01-15',
    comments: 0
  },
  {
    id: 2,
    number: 772,
    type: 'feature',
    title: 'Add dark mode toggle functionality',
    description: 'Implement a dark mode toggle that persists user preference and provides smooth transitions between light and dark themes.',
    severity: 'medium',
    estimatedHours: 12,
    suggestedBounty: 0.3,
    files: ['src/components/ThemeToggle.jsx'],
    approved: false,
    author: 'secgit-analyzer',
    createdAt: '2024-01-14',
    comments: 2
  },
  {
    id: 3,
    number: 773,
    type: 'bug',
    title: 'Race condition in async data fetching',
    description: 'There\'s a race condition in the data fetching logic that can cause inconsistent state when multiple API calls are made simultaneously.',
    severity: 'medium',
    estimatedHours: 6,
    suggestedBounty: 0.4,
    files: ['src/hooks/useApiData.js'],
    approved: false,
    author: 'secgit-analyzer',
    createdAt: '2024-01-13',
    comments: 1
  },
  {
    id: 4,
    number: 774,
    type: 'security',
    title: 'Input validation bypass in form submission',
    description: 'Client-side validation can be bypassed, allowing invalid data to be submitted to the backend API.',
    severity: 'high',
    estimatedHours: 4,
    suggestedBounty: 0.6,
    files: ['src/components/ContactForm.jsx'],
    approved: false,
    author: 'secgit-analyzer',
    createdAt: '2024-01-12',
    comments: 0
  },
  {
    id: 5,
    number: 775,
    type: 'feature',
    title: 'Implement user authentication with OAuth',
    description: 'Add OAuth integration for Google, GitHub, and Discord to improve user onboarding and security.',
    severity: 'low',
    estimatedHours: 20,
    suggestedBounty: 0.8,
    files: ['src/auth/'],
    approved: false,
    author: 'secgit-analyzer',
    createdAt: '2024-01-11',
    comments: 3
  }
];

export default function IssueReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const githubUrl = searchParams.get('repo') || 'https://github.com/gyanshupathak/SolVest';
  
  const [issues, setIssues] = useState(mockIssues);

  const toggleApproval = (id: number) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, approved: !issue.approved } : issue
    ));
  };

  const approvedIssues = issues.filter(issue => issue.approved);
  const totalBounty = approvedIssues.reduce((sum, issue) => sum + issue.suggestedBounty, 0);

  const handleConfirmListing = () => {
    // Store approved issues for the success page
    localStorage.setItem('approvedIssuesForBounty', JSON.stringify(approvedIssues));
    
    router.push(`/success?repo=${encodeURIComponent(githubUrl)}&bounties=${approvedIssues.length}&total=${totalBounty}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'github-label-critical';
      case 'high': return 'github-label-high';
      case 'medium': return 'github-label-medium';
      case 'low': return 'github-label-low';
      default: return 'github-label-medium';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return Shield;
      case 'bug': return Bug;
      case 'feature': return Plus;
      default: return AlertCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'github-label-security';
      case 'bug': return 'github-label-bug';
      case 'feature': return 'github-label-enhancement';
      default: return 'github-label-enhancement';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="github-layout">
      <Header />
      
      <main className="pt-16">
        <div className="github-container">
          {/* Back Navigation */}
          <div className="py-4 border-b border-gray-800">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analysis
            </button>
          </div>

          {/* Repository Header */}
          <div className="py-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Github className="w-10 h-10 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-semibold text-white mb-1">
                    <span className="github-text-link font-normal">{githubUrl.split('/')[3]}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="font-semibold">{githubUrl.split('/')[4]}</span>
                  </h1>
                  <p className="github-text-muted text-sm">
                    Security Analysis Results • Review and approve issues for bounty creation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Summary */}
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm">
                <span className="flex items-center font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {issues.length} Open
                </span>
                <span className="flex items-center github-text-muted">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  0 Closed
                </span>
              </div>
              <div className="text-sm github-text-muted">
                <span className="text-white font-medium">{approvedIssues.length}</span> approved • 
                <span className="text-green-400 font-medium ml-1">{totalBounty.toFixed(2)} ETH</span> total bounty
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="border border-gray-800 rounded-md overflow-hidden">
            {issues.map((issue, index) => {
              const TypeIcon = getTypeIcon(issue.type);
              
              return (
                <div 
                  key={issue.id} 
                  className={`p-4 hover:bg-gray-900/50 transition-colors ${index !== issues.length - 1 ? 'border-b border-gray-800' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Issue Status */}
                    <div className="pt-1">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Issue Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and Number */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium text-base hover:text-blue-400 cursor-pointer transition-colors">
                          {issue.title}
                          <span className="github-text-muted font-normal ml-2">#{issue.number}</span>
                        </h3>
                        
                        {/* Approval Status */}
                        <button
                          onClick={() => toggleApproval(issue.id)}
                          className={`ml-4 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                            issue.approved
                              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                              : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                          }`}
                        >
                          {issue.approved ? '✓ Approved' : 'Approve'}
                        </button>
                      </div>
                      
                      {/* Meta Information */}
                      <div className="flex items-center gap-3 text-xs github-text-muted mb-3">
                        <span>opened {formatDate(issue.createdAt)}</span>
                        <span>by {issue.author}</span>
                        {issue.comments > 0 && (
                          <>
                            <span>•</span>
                            <span>{issue.comments} comment{issue.comments !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Description */}
                      <p className="github-text-muted text-sm leading-relaxed mb-3">
                        {issue.description}
                      </p>
                      
                      {/* Labels and Metrics */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`github-label text-xs ${getTypeColor(issue.type)}`}>
                            {issue.type}
                          </span>
                          <span className={`github-label text-xs ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          {issue.files && issue.files.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/50">
                              {issue.files[0]}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs github-text-muted">
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            <span className="text-green-400 font-medium">{issue.suggestedBounty} ETH</span>
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {issue.estimatedHours}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Section */}
          <div className="py-8">
            <div className="border border-gray-800 rounded-md p-6 bg-gray-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Ready to proceed?</h3>
                  <p className="github-text-muted text-sm">
                    {approvedIssues.length === 0 
                      ? "Select issues above to include in your security report"
                      : `${approvedIssues.length} issue${approvedIssues.length !== 1 ? 's' : ''} approved for ${totalBounty.toFixed(2)} ETH total bounty`
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => router.back()}
                    className="btn-github-secondary"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleConfirmListing}
                    disabled={approvedIssues.length === 0}
                    className="btn-github-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}