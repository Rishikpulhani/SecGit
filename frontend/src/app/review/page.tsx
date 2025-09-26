'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bug, Plus, Edit, Trash2, CheckCircle, AlertTriangle, DollarSign, Clock, User, Github, ExternalLink } from 'lucide-react';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { generateGitHubIssueBody, generateIssueTitle } from '../../utils/issueTemplates';

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
  const { user } = useAuth();
  const githubUrl = searchParams.get('repo') || 'https://github.com/example/repo';
  
  const [issues, setIssues] = useState(mockIssues);
  const [editingIssue, setEditingIssue] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creatingGitHubIssue, setCreatingGitHubIssue] = useState<number | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    type: 'bug',
    file: '',
    recommendation: ''
  });

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
    // Store approved issues for the success page
    localStorage.setItem('approvedIssuesForBounty', JSON.stringify(approvedIssues));
    
    // This would integrate with smart contracts to create bounties
    router.push(`/success?repo=${encodeURIComponent(githubUrl)}&bounties=${approvedIssues.length}&total=${totalBounty}`);
  };


  const createManualGitHubIssue = async () => {
    if (!user) {
      alert('You must be logged in to create GitHub issues');
      return;
    }

    if (!issueFormData.title.trim() || !issueFormData.description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    setCreatingGitHubIssue(-1); // Use -1 for manual creation
    
    try {
      const accessToken = localStorage.getItem('github_access_token');
      if (!accessToken) {
        alert('GitHub access token not found. Please log in again.');
        return;
      }

      const issueTitle = generateIssueTitle({
        title: issueFormData.title,
        description: issueFormData.description,
        severity: issueFormData.severity,
        type: issueFormData.type,
        file: issueFormData.file,
        recommendation: issueFormData.recommendation
      });

      const issueBody = generateGitHubIssueBody({
        title: issueFormData.title,
        description: issueFormData.description,
        severity: issueFormData.severity,
        type: issueFormData.type,
        file: issueFormData.file,
        recommendation: issueFormData.recommendation
      }, githubUrl);

      const response = await fetch('/api/github/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          repoUrl: githubUrl,
          title: issueTitle,
          body: issueBody,
          severity: issueFormData.severity,
          type: issueFormData.type
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`GitHub issue created successfully! Issue #${result.issue.number}`);
        
        // Add the new issue to the local list
        const newIssue = {
          id: Date.now(),
          type: issueFormData.type,
          title: issueFormData.title,
          description: issueFormData.description,
          severity: issueFormData.severity,
          estimatedHours: 0,
          suggestedBounty: 0,
          files: issueFormData.file ? [issueFormData.file] : [],
          approved: false,
          githubIssueUrl: result.issue.html_url,
          githubIssueNumber: result.issue.number
        };
        
        setIssues(prev => [...prev, newIssue]);
        
        // Reset form
        setIssueFormData({
          title: '',
          description: '',
          severity: 'medium',
          type: 'bug',
          file: '',
          recommendation: ''
        });
        setShowIssueForm(false);
      } else {
        alert(`Failed to create GitHub issue: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      alert('An error occurred while creating the GitHub issue');
    } finally {
      setCreatingGitHubIssue(null);
    }
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
                onClick={() => setShowIssueForm(true)}
                className="btn-secondary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create GitHub Issue
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
                              ? 'text-green-400'
                              : 'text-gray-200 hover:text-white'
                          }`}
                        >
                          {issue.approved ? 'Approved' : 'Approve'}
                        </button>
                        
                        <button className="p-2 text-gray-300 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Show link to GitHub issue if it exists */}
                        {(issue as any).githubIssueUrl && (
                          <a
                            href={(issue as any).githubIssueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-green-400 hover:text-green-300 transition-colors"
                            title={`View GitHub Issue #${(issue as any).githubIssueNumber}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        
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
        </div>
      </main>

      {/* GitHub Issue Creation Form Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="github-card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Github className="w-5 h-5 mr-2" />
                  Create GitHub Issue
                </h3>
                <button
                  onClick={() => setShowIssueForm(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createManualGitHubIssue(); }} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="issue-title" className="block text-sm font-semibold text-gray-200 mb-2">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    id="issue-title"
                    value={issueFormData.title}
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="issue-description" className="block text-sm font-semibold text-gray-200 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="issue-description"
                    value={issueFormData.description}
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior, etc."
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    required
                  />
                </div>

                {/* Type and Severity Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type */}
                  <div>
                    <label htmlFor="issue-type" className="block text-sm font-semibold text-gray-200 mb-2">
                      Issue Type
                    </label>
                    <select
                      id="issue-type"
                      value={issueFormData.type}
                      onChange={(e) => setIssueFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bug">Bug</option>
                      <option value="security">Security Vulnerability</option>
                      <option value="feature">Feature Request</option>
                      <option value="performance">Performance Issue</option>
                      <option value="documentation">Documentation</option>
                      <option value="enhancement">Enhancement</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label htmlFor="issue-severity" className="block text-sm font-semibold text-gray-200 mb-2">
                      Severity
                    </label>
                    <select
                      id="issue-severity"
                      value={issueFormData.severity}
                      onChange={(e) => setIssueFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* File Path (Optional) */}
                <div>
                  <label htmlFor="issue-file" className="block text-sm font-semibold text-gray-200 mb-2">
                    File Path (Optional)
                  </label>
                  <input
                    type="text"
                    id="issue-file"
                    value={issueFormData.file}
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, file: e.target.value }))}
                    placeholder="e.g., src/components/Login.tsx"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Recommendation (Optional) */}
                <div>
                  <label htmlFor="issue-recommendation" className="block text-sm font-semibold text-gray-200 mb-2">
                    Recommended Solution (Optional)
                  </label>
                  <textarea
                    id="issue-recommendation"
                    value={issueFormData.recommendation}
                    onChange={(e) => setIssueFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                    placeholder="Suggested fix or improvement approach"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-md p-4">
                  <div className="text-sm text-blue-300">
                    <strong>Repository:</strong> {githubUrl}
                    <br />
                    This issue will be created directly in your GitHub repository with proper formatting and labels.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowIssueForm(false)}
                    className="btn-secondary order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGitHubIssue === -1 || !issueFormData.title.trim() || !issueFormData.description.trim()}
                    className="btn-primary order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingGitHubIssue === -1 ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Issue...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Github className="w-4 h-4 mr-2" />
                        Create GitHub Issue
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
