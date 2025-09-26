'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, DollarSign, Users, Code, Shield, Zap, CheckCircle, AlertCircle, Upload, FileText, Github, ExternalLink } from 'lucide-react';
import Header from '../../../components/Header';

// Mock issue data (in real app, this would come from API)
const getIssueById = (id: string) => {
  const issues = {
    '1': {
      id: 1,
      title: 'Memory leak in WebSocket connection handler',
      description: 'Critical memory leak causing server crashes during high traffic. The WebSocket connection handler in src/websocket.js is not properly cleaning up event listeners, leading to memory leaks during frequent reconnections. This issue affects production environments with high connection turnover.',
      repository: 'facebook/react',
      owner: 'Facebook',
      type: 'bug',
      severity: 'high',
      bounty: 2.5,
      stakeRequired: 0.1,
      staked: 0.1,
      timeEstimate: '8-12 hours',
      skills: ['JavaScript', 'WebSocket', 'Memory Management'],
      assignedCount: 3,
      maxAssignees: 5,
      deadline: '3 days',
      difficulty: 'Expert',
      repositoryUrl: 'https://github.com/facebook/react',
      issueUrl: 'https://github.com/facebook/react/issues/12345',
      files: [
        'src/websocket.js',
        'src/utils/connection.js',
        'tests/websocket.test.js'
      ],
      requirements: [
        'Fix memory leak in WebSocket event listeners',
        'Ensure proper cleanup on connection close',
        'Add unit tests for memory management',
        'Update documentation for WebSocket handling'
      ],
      acceptanceCriteria: [
        'Memory usage remains stable during connection cycling',
        'All event listeners are properly removed',
        'Tests pass with 95% coverage',
        'No regression in existing functionality'
      ],
      assignedTo: 'you',
      status: 'in_progress',
      timeRemaining: '2 days, 14 hours'
    }
  };
  return issues[id as keyof typeof issues];
};

export default function SolveIssue() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.id as string;
  
  const [issue, setIssue] = useState<any>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    pullRequestUrl: '',
    description: '',
    testResults: '',
    additionalNotes: ''
  });

  useEffect(() => {
    const issueData = getIssueById(issueId);
    setIssue(issueData);
  }, [issueId]);

  const handleSubmitSolution = () => {
    // This would integrate with smart contracts and GitHub
    console.log('Submitting solution:', submissionData);
    setShowSubmissionModal(false);
    router.push(`/solve/${issueId}/submitted`);
  };

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

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
            Back to Marketplace
          </button>

          {/* Status Bar */}
          <div className="github-card-elevated p-4 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold">In Progress</span>
                </div>
                <div className="text-gray-300">•</div>
                <div className="text-gray-300">Assigned to you</div>
                <div className="text-gray-300">•</div>
                <div className="flex items-center text-orange-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {issue.timeRemaining} remaining
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Staked</div>
                  <div className="text-yellow-400 font-semibold">{issue.staked} ETH</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Reward</div>
                  <div className="text-green-400 font-semibold">{issue.bounty} ETH</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Issue Details */}
              <div className="github-card-elevated p-6">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-red-600/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-2">{issue.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                      <span className="flex items-center">
                        <Code className="w-4 h-4 mr-1" />
                        {issue.repository}
                      </span>
                      <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded text-xs">
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-red-600/20 text-red-300 rounded text-xs">
                        {issue.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-200 leading-relaxed">{issue.description}</p>
                </div>

                <div className="flex gap-4 mt-6">
                  <a 
                    href={issue.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View Repository
                  </a>
                  <a 
                    href={issue.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Issue
                  </a>
                </div>
              </div>

              {/* Requirements */}
              <div className="github-card-elevated p-6">
                <h2 className="text-xl font-bold text-white mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {issue.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Acceptance Criteria */}
              <div className="github-card-elevated p-6">
                <h2 className="text-xl font-bold text-white mb-4">Acceptance Criteria</h2>
                <ul className="space-y-2">
                  {issue.acceptanceCriteria.map((criteria: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-200">{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit Solution */}
              <div className="github-card-elevated p-6">
                <h2 className="text-xl font-bold text-white mb-4">Submit Your Solution</h2>
                <p className="text-gray-300 mb-6">
                  Ready to submit your solution? Make sure you've completed all requirements and your code meets the acceptance criteria.
                </p>
                
                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Solution
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="github-card-elevated p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Issue Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Estimated Time</div>
                    <div className="text-white">{issue.timeEstimate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Required Skills</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.skills.map((skill: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Affected Files</div>
                    <div className="space-y-1 mt-1">
                      {issue.files.map((file: string, index: number) => (
                        <div key={index} className="text-sm text-gray-300 bg-gray-700/30 px-2 py-1 rounded font-mono">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staking Info */}
              <div className="github-card-elevated p-6 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">Your Stake</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Staked</span>
                    <span className="text-yellow-400 font-semibold">{issue.staked} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potential Reward</span>
                    <span className="text-green-400 font-semibold">{issue.bounty} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Return</span>
                    <span className="text-blue-400 font-semibold">{(issue.bounty + issue.staked).toFixed(2)} ETH</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/30 rounded">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      Your stake will be returned along with the bounty reward upon successful completion.
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="github-card-elevated p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-200">Issue assigned</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-200">Stake deposited</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-400 rounded-full"></div>
                    <span className="text-gray-200">Solution in progress</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                    <span className="text-gray-400">Solution submitted</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                    <span className="text-gray-400">Review & approval</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                    <span className="text-gray-400">Reward distributed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="github-card-elevated max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Submit Your Solution</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Pull Request URL *
                </label>
                <input
                  type="url"
                  value={submissionData.pullRequestUrl}
                  onChange={(e) => setSubmissionData({...submissionData, pullRequestUrl: e.target.value})}
                  placeholder="https://github.com/repository/pull/123"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Solution Description *
                </label>
                <textarea
                  value={submissionData.description}
                  onChange={(e) => setSubmissionData({...submissionData, description: e.target.value})}
                  placeholder="Describe your solution and how it addresses the requirements..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Test Results
                </label>
                <textarea
                  value={submissionData.testResults}
                  onChange={(e) => setSubmissionData({...submissionData, testResults: e.target.value})}
                  placeholder="Share test results, coverage reports, or testing approach..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={submissionData.additionalNotes}
                  onChange={(e) => setSubmissionData({...submissionData, additionalNotes: e.target.value})}
                  placeholder="Any additional context, challenges faced, or future improvements..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSolution}
                disabled={!submissionData.pullRequestUrl || !submissionData.description}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Solution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
