'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Clock, DollarSign, Github, ExternalLink, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

interface Assignment {
  id: number;
  issueId: number;
  issue: {
    title: string;
    description: string;
    repository: string;
    repoUrl: string;
    type: string;
    severity: string;
    bounty: number;
    issueNumber: number;
  };
  stakeAmount: string;
  transactionHash: string;
  assignedTo: string;
  assignedAt: string;
  status: 'assigned' | 'active' | 'closed';
  submissionStatus: 'not_submitted' | 'submitted' | 'accepted' | 'rejected';
  submissionUrl?: string;
  submittedAt?: string;
}

export default function SolverDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load assignments from localStorage
    const loadAssignments = () => {
      try {
        const userAssignments = JSON.parse(localStorage.getItem('userAssignments') || '[]');
        setAssignments(userAssignments);
      } catch (error) {
        console.error('Error loading assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-300 bg-blue-600/20 border-blue-500/30';
      case 'active': return 'text-green-300 bg-green-600/20 border-green-500/30';
      case 'closed': return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'not_submitted': return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
      case 'submitted': return 'text-yellow-300 bg-yellow-600/20 border-yellow-500/30';
      case 'accepted': return 'text-green-300 bg-green-600/20 border-green-500/30';
      case 'rejected': return 'text-red-300 bg-red-600/20 border-red-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'high': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'medium': return 'text-yellow-300 bg-yellow-600/20 border-yellow-500/30';
      case 'low': return 'text-green-300 bg-green-600/20 border-green-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitSolution = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setPrUrl('');
    setShowSubmitModal(true);
  };

  const handleSubmitPR = async () => {
    if (!prUrl.trim() || !selectedAssignment) {
      alert('Please enter a valid PR URL');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate submission processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update assignment status
      const updatedAssignments = assignments.map(assignment => 
        assignment.id === selectedAssignment.id 
          ? { 
              ...assignment, 
              submissionStatus: 'submitted' as const,
              submissionUrl: prUrl,
              submittedAt: new Date().toISOString()
            }
          : assignment
      );

      setAssignments(updatedAssignments);
      localStorage.setItem('userAssignments', JSON.stringify(updatedAssignments));
      
      // Also store in shared submissions pool for cross-browser access
      const allSubmissions = JSON.parse(localStorage.getItem('allSubmissions') || '[]');
      const submissionData = updatedAssignments.find(a => a.id === selectedAssignment.id);
      if (submissionData) {
        // Remove any existing submission with same ID and add the updated one
        const filteredSubmissions = allSubmissions.filter((s: any) => s.id !== submissionData.id);
        filteredSubmissions.push(submissionData);
        localStorage.setItem('allSubmissions', JSON.stringify(filteredSubmissions));
      }

      setShowSubmitModal(false);
      alert('Solution submitted successfully!');

    } catch (error) {
      console.error('Error submitting solution:', error);
      alert('Failed to submit solution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter(a => a.status === 'assigned' || a.status === 'active').length;
  const completedAssignments = assignments.filter(a => a.submissionStatus === 'accepted').length;
  const totalEarnings = assignments
    .filter(a => a.submissionStatus === 'accepted')
    .reduce((sum, a) => sum + a.issue.bounty, 0);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900">
          <Header />
          <main className="pt-20 px-4 py-12">
            <div className="max-w-6xl mx-auto text-center">
              <div className="text-white">Loading your assignments...</div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
        <Header />
        
        <main className="pt-20 px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Solver Dashboard</h1>
              <p className="text-gray-300">Track your assigned issues and submissions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalAssignments}</div>
                    <div className="text-gray-300 text-sm">Total Assigned</div>
                  </div>
                </div>
              </div>

              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{activeAssignments}</div>
                    <div className="text-gray-300 text-sm">Active</div>
                  </div>
                </div>
              </div>

              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mr-4">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{completedAssignments}</div>
                    <div className="text-gray-300 text-sm">Completed</div>
                  </div>
                </div>
              </div>

              <div className="github-card-elevated p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalEarnings.toFixed(2)} ETH</div>
                    <div className="text-gray-300 text-sm">Total Earned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments List */}
            {assignments.length === 0 ? (
              <div className="github-card-elevated p-12 text-center">
                <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Assignments Yet</h3>
                <p className="text-gray-300 mb-6">
                  Browse the marketplace to find and assign issues to work on.
                </p>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="btn-primary"
                >
                  Browse Issues
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="github-card-elevated p-6">
                    {/* Assignment Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-white mb-2">{assignment.issue.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                          <span className="flex items-center">
                            <Github className="w-4 h-4 mr-1" />
                            {assignment.issue.repository}
                          </span>
                          <span>#{assignment.issue.issueNumber}</span>
                          <span>Assigned: {formatDate(assignment.assignedAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(assignment.issue.severity)}`}>
                          {assignment.issue.severity}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSubmissionStatusColor(assignment.submissionStatus)}`}>
                          {assignment.submissionStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Issue Description */}
                    <p className="text-gray-300 mb-4 line-clamp-2">{assignment.issue.description}</p>

                    {/* Issue Stats */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Bounty: {assignment.issue.bounty} ETH
                        </span>
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          Stake: {assignment.stakeAmount} ETH
                        </span>
                      </div>
                      
                      <a
                        href={assignment.issue.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title="View Repository"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Submission Section */}
                    <div className="border-t border-gray-700 pt-4">
                      {assignment.submissionStatus === 'not_submitted' ? (
                        <button
                          onClick={() => handleSubmitSolution(assignment)}
                          className="btn-primary"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit Solution
                        </button>
                      ) : assignment.submissionStatus === 'submitted' ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-yellow-300">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span>Solution submitted, waiting for review</span>
                          </div>
                          {assignment.submissionUrl && (
                            <a
                              href={assignment.submissionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              View PR
                            </a>
                          )}
                        </div>
                      ) : assignment.submissionStatus === 'accepted' ? (
                        <div className="flex items-center text-green-300">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span>Solution accepted! Bounty earned: {assignment.issue.bounty} ETH</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-300">
                          <XCircle className="w-4 h-4 mr-2" />
                          <span>Solution rejected. You can resubmit with improvements.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Submit Solution Modal */}
        {showSubmitModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="github-card-elevated max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Submit Solution</h3>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Issue Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">{selectedAssignment.issue.title}</h4>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Github className="w-4 h-4 mr-2" />
                    <span>{selectedAssignment.issue.repository}</span>
                    <span className="mx-2">•</span>
                    <span>Bounty: {selectedAssignment.issue.bounty} ETH</span>
                  </div>
                </div>

                {/* PR URL Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Pull Request URL *
                  </label>
                  <input
                    type="url"
                    value={prUrl}
                    onChange={(e) => setPrUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Submit a pull request with your solution to the repository
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPR}
                    disabled={!prUrl.trim() || isSubmitting}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </div>
                    ) : (
                      'Submit Solution'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
