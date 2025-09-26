'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bug, Plus, Edit, Trash2, CheckCircle, AlertTriangle, DollarSign, Clock, User } from 'lucide-react';
import Header from '../../components/Header';

// Mock data for AI-discovered issues and features
// In real implementation, all issues would start as "pending" and owner decides approval
const mockIssues = [
  {
    id: 1,
    type: 'bug',
    title: 'Memory leak in WebSocket connection handler',
    description: 'The WebSocket connection handler in src/websocket.js is not properly cleaning up event listeners, leading to memory leaks during frequent reconnections.',
    severity: 'high',
    estimatedHours: 8,
    suggestedBounty: 0.5,
    files: ['src/websocket.js', 'src/utils/connection.js'],
    approved: false  // Owner decides - starts pending
  },
  {
    id: 2,
    type: 'feature',
    title: 'Add dark mode toggle functionality',
    description: 'Implement a dark mode toggle that persists user preference and provides smooth transitions between light and dark themes.',
    severity: 'medium',
    estimatedHours: 12,
    suggestedBounty: 0.3,
    files: ['src/components/ThemeToggle.jsx', 'src/styles/themes.css'],
    approved: false  // Owner decides - starts pending
  },
  {
    id: 3,
    type: 'bug',
    title: 'Race condition in async data fetching',
    description: 'There\'s a race condition in the data fetching logic that can cause inconsistent state when multiple API calls are made simultaneously.',
    severity: 'medium',
    estimatedHours: 6,
    suggestedBounty: 0.4,
    files: ['src/hooks/useApiData.js', 'src/services/api.js'],
    approved: false  // Owner decides - starts pending
  },
  {
    id: 4,
    type: 'feature',
    title: 'Implement user authentication with OAuth',
    description: 'Add OAuth integration for Google, GitHub, and Discord to improve user onboarding and security.',
    severity: 'low',
    estimatedHours: 20,
    suggestedBounty: 0.8,
    files: ['src/auth/', 'src/components/LoginModal.jsx'],
    approved: false  // Owner decides - starts pending
  },
  {
    id: 5,
    type: 'bug',
    title: 'Input validation bypass in form submission',
    description: 'Client-side validation can be bypassed, allowing invalid data to be submitted to the backend API.',
    severity: 'high',
    estimatedHours: 4,
    suggestedBounty: 0.6,
    files: ['src/components/ContactForm.jsx', 'src/utils/validation.js'],
    approved: false  // Owner decides - starts pending
  }
];

export default function IssueReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const githubUrl = searchParams.get('repo') || 'https://github.com/example/repo';
  
  const [issues, setIssues] = useState(mockIssues);
  const [editingIssue, setEditingIssue] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleApproval = (id: number) => {
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, approved: !issue.approved } : issue
    ));
  };

  const deleteIssue = (id: number) => {
    setIssues(prev => prev.filter(issue => issue.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'medium': return 'text-yellow-300 bg-yellow-600/20 border-yellow-500/30';
      case 'low': return 'text-green-300 bg-green-600/20 border-green-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'bug' ? Bug : Plus;
  };

  const approvedIssues = issues.filter(issue => issue.approved);
  const totalBounty = approvedIssues.reduce((sum, issue) => sum + issue.suggestedBounty, 0);
  const totalHours = approvedIssues.reduce((sum, issue) => sum + issue.estimatedHours, 0);

  const handleConfirmListing = () => {
    // This would integrate with smart contracts to create bounties
    router.push(`/success?repo=${encodeURIComponent(githubUrl)}&bounties=${approvedIssues.length}&total=${totalBounty}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-600/20 border border-green-500/30 backdrop-blur-sm mb-6">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-sm font-medium text-white">Analysis Complete</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Review Analysis Results
            </h1>
            
            <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-4">
              Review the identified security vulnerabilities and code quality issues. You can approve, edit, or remove items before generating the final report.
            </p>
            
            <p className="text-sm text-gray-300 break-all max-w-3xl mx-auto">
              Repository: {githubUrl}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="github-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Issues</p>
                  <p className="text-2xl font-bold text-white">{issues.length}</p>
                </div>
                <Bug className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            
            <div className="github-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedIssues.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="github-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Analysis Cost</p>
                  <p className="text-2xl font-bold text-white">{totalBounty.toFixed(2)} ETH</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            
            <div className="github-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Est. Fix Time</p>
                  <p className="text-2xl font-bold text-white">{totalHours}h</p>
                </div>
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="github-card-elevated p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Security & Quality Issues</h2>
              <button 
                onClick={() => setShowAddForm(true)}
                className="btn-secondary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Check
              </button>
            </div>

            <div className="space-y-4">
              {issues.map((issue) => {
                const TypeIcon = getTypeIcon(issue.type);
                
                return (
                  <div 
                    key={issue.id} 
                    className={`border rounded-lg p-6 transition-all ${
                      issue.approved 
                        ? 'bg-green-600/10 border-green-500/30 glow-green' 
                        : 'bg-gray-800/50 border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          issue.type === 'bug' 
                            ? 'bg-red-600/20 text-red-400' 
                            : 'bg-blue-600/20 text-blue-400'
                        }`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs border ${getSeverityColor(issue.severity)}`}>
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              issue.type === 'bug' 
                                ? 'bg-red-600/20 text-red-400 border border-red-200' 
                                : 'bg-blue-600/20 text-blue-400 border border-blue-200'
                            }`}>
                              {issue.type.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-gray-200 mb-3">{issue.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-300">
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {issue.suggestedBounty} ETH
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              ~{issue.estimatedHours}h
                            </span>
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {issue.files.length} files
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="text-gray-300 cursor-pointer hover:text-white">
                                Affected files ({issue.files.length})
                              </summary>
                              <div className="mt-2 space-y-1">
                                {issue.files.map((file, index) => (
                                  <span key={index} className="inline-block bg-gray-100 text-gray-200 px-2 py-1 rounded text-xs mr-2">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleApproval(issue.id)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            issue.approved
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {issue.approved ? 'Approved' : 'Approve'}
                        </button>
                        
                        <button className="p-2 text-gray-300 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => deleteIssue(issue.id)}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Section */}
          <div className="github-card-elevated p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Generate Analysis Report?</h3>
              <p className="text-gray-200 mb-6">
                {approvedIssues.length === 0 
                  ? "Review the analysis results above and approve the items you want included in your final report."
                  : `You have ${approvedIssues.length} approved findings. Generate a comprehensive security and quality report for your codebase.`
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => router.back()}
                  className="btn-secondary"
                >
                  Back to Edit
                </button>
                <button 
                  onClick={handleConfirmListing}
                  disabled={approvedIssues.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Generate Report ({approvedIssues.length} findings)
                </button>
              </div>
            </div>
          </div>

          {/* Analysis Info */}
          <div className="github-card-elevated p-6 mt-8 border border-blue-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Report Features
            </h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• <strong>Security Analysis:</strong> Comprehensive vulnerability assessment and recommendations</p>
              <p>• <strong>Code Quality:</strong> Maintainability, complexity, and best practices review</p>
              <p>• <strong>Dependency Audit:</strong> Third-party library security and update recommendations</p>
              <p>• <strong>Performance Issues:</strong> Potential bottlenecks and optimization opportunities</p>
              <p>• <strong>Actionable Fixes:</strong> Step-by-step remediation instructions for each finding</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
