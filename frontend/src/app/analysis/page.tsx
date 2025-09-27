'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle, Loader, Zap, AlertCircle, Users, Clock } from 'lucide-react';
import Header from '../../components/Header';

interface AnalysisResult {
  success: boolean;
  analysisId: string;
  agentsUsed: number;
  agentsDiscovered: number;
  selectedAgents: string[];
  analysisMethod: string;
  issue: {
    title: string;
    difficulty: string;
    priority: string;
    estimatedTime: string;
    labels: string[];
    acceptanceCriteria: string[];
    technicalRequirements: string[];
    description: string;
  };
  repositoryInfo: {
    owner: string;
    repo: string;
    url: string;
  };
}

export default function Analysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get('repo') || '';
  const transactionHash = searchParams.get('tx') || '';
  const userAddress = searchParams.get('address') || '';
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState('Starting analysis...');

  useEffect(() => {
    if (!repoUrl || !transactionHash || !userAddress) {
      setError('Missing required parameters');
      setIsAnalyzing(false);
      return;
    }

    startAnalysis();
  }, [repoUrl, transactionHash, userAddress]);

  const startAnalysis = async () => {
    try {
      setCurrentStage('Calling AI agents...');
      setProgress(10);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

      const response = await fetch('/api/analysis/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl: repoUrl,
          userAddress: userAddress,
          transactionHash: transactionHash
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setCurrentStage('AI agents analyzing repository...');
      setProgress(50);

      const result: AnalysisResult = await response.json();
      
      if (!result.success) {
        throw new Error('Analysis failed');
      }

      setCurrentStage('Generating issues...');
      setProgress(80);

      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress(100);
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setCurrentStage('Complete!');

      // Save to localStorage for persistence
      const storageKey = `analysis_${repoUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem(storageKey, JSON.stringify(result));
      localStorage.setItem('lastAnalysisKey', storageKey);

    } catch (err: any) {
      console.error('Analysis error:', err);
      
      if (err.name === 'AbortError') {
        setError('AI analysis timed out. The analysis is taking longer than expected. Please try again or use a smaller repository.');
      } else if (err.message?.includes('timeout')) {
        setError('The operation was aborted due to timeout. Please try again with a smaller repository.');
      } else {
        setError(err.message || 'Analysis failed. Please try again.');
      }
      
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (analysisResult) {
      // Pass analysis result to review page
      const params = new URLSearchParams({
        repo: repoUrl,
        analysisId: analysisResult.analysisId,
        data: encodeURIComponent(JSON.stringify(analysisResult))
      });
      router.push(`/review?${params.toString()}`);
    }
  };

  // Error State
  if (error) {
    return (
      <div className="github-layout">
        <Header />
        
        <main className="pt-16">
          <section className="relative min-h-screen flex items-center justify-center px-4 py-20" style={{ paddingTop: '6rem' }}>
            <div className="w-full flex justify-center">
              <div className="relative max-w-2xl w-full text-center">
                
                {/* Error Icon */}
                <div className="mb-8">
                  <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white text-center w-full">
                  Analysis Failed
                </h1>

                {/* Error Message */}
                <p className="text-lg text-gray-300 mb-8">
                  {error}
                </p>

                {/* Retry Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="btn-github-primary px-8 py-4 text-lg font-medium"
                >
                  Try Again
                </button>

              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Analyzing State
  if (isAnalyzing) {
    return (
      <div className="github-layout">
        <Header />
        
        <main className="pt-16">
          <section className="relative min-h-screen flex items-center justify-center px-4 py-20" style={{ paddingTop: '6rem' }}>
            <div className="w-full flex justify-center">
              <div className="relative max-w-2xl w-full text-center">
                
                {/* Progress Circle */}
                <div className="mb-8">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-700"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={339.292}
                        strokeDashoffset={339.292 - (339.292 * progress) / 100}
                        className="text-blue-500 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white text-center w-full">
                  AI Agents Analyzing Repository
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-gray-300 mb-8">
                  Multi-agent AI system analyzing {repoUrl.split('/').pop()}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center space-x-2 text-blue-400 mb-8">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{currentStage}</span>
                </div>

              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Success State - Show AI Results
  return (
    <div className="github-layout">
      <Header />
      
      <main className="pt-16">
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20" style={{ paddingTop: '6rem' }}>
          <div className="w-full flex justify-center">
            <div className="relative max-w-4xl w-full text-center">
              
              {/* Success Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white text-center w-full">
                AI Analysis Complete!
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-300 mb-12">
                {analysisResult?.agentsUsed} AI agents analyzed your repository and found actionable improvements.
              </p>

              {/* AI Agent Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="github-card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{analysisResult?.agentsDiscovered}</div>
                  <div className="text-sm text-gray-400">AI Agents Available</div>
                </div>
                <div className="github-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{analysisResult?.agentsUsed}</div>
                  <div className="text-sm text-gray-400">Agents Used</div>
                </div>
                <div className="github-card p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">1</div>
                  <div className="text-sm text-gray-400">Issues Found</div>
                </div>
              </div>

              {/* Issue Preview */}
              {analysisResult?.issue && (
                <div className="github-card p-6 text-left mb-8 max-w-2xl mx-auto">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {analysisResult.issue.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {analysisResult.issue.difficulty}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {analysisResult.issue.estimatedTime}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {analysisResult.issue.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {analysisResult.issue.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {analysisResult.issue.labels.map((label, index) => (
                      <span key={index} className="github-label" style={{ backgroundColor: '#6366f1', color: 'white' }}>
                        {label}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Selected AI Agents: {analysisResult.selectedAgents.join(', ')}
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="btn-github-primary px-8 py-4 text-lg font-medium"
              >
                <span className="flex items-center">
                  Review Detailed Results
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              </button>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}