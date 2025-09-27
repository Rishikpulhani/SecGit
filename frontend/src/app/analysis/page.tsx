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
  const dataParam = searchParams.get('data');
  
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

    // If we have data from Hero component, use it directly
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setAnalysisResult(parsedData);
        setIsAnalyzing(false);
        setCurrentStage('Complete!');
        setProgress(100);
        return;
      } catch (e) {
        console.warn('Failed to parse data parameter, falling back to API call');
      }
    }

    startAnalysis();
  }, [repoUrl, transactionHash, userAddress, dataParam]);

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
        <div className="github-container">
          <div className="py-6">
            
            {/* Simple Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-white">
                  AI Analysis Complete
                </h1>
              </div>
              
              <div className="github-text-muted text-sm mb-6">
                {analysisResult?.agentsUsed} AI agents analyzed your repository and found actionable improvements.
              </div>
              
              <div className="text-xs github-text-muted">
                Repository: <code className="github-code">{analysisResult?.repositoryInfo?.url}</code>
              </div>
            </div>

            {/* Simple Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="github-card p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">{analysisResult?.agentsDiscovered}</div>
                <div className="text-sm github-text-muted">AI Agents Available</div>
              </div>
              
              <div className="github-card p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">{analysisResult?.agentsUsed}</div>
                <div className="text-sm github-text-muted">Agents Used</div>
              </div>
              
              <div className="github-card p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">1</div>
                <div className="text-sm github-text-muted">Issues Found</div>
              </div>
            </div>

            {/* Simple Issue Preview */}
            {analysisResult?.issue && (
              <div className="github-card p-6 mb-8">
                
                {/* Issue Header */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm github-text-muted">Enhancement</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {analysisResult.issue.title}
                  </h2>
                  
                  {/* Meta Information */}
                  <div className="flex items-center space-x-4 text-sm github-text-muted">
                    <span className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{analysisResult.issue.difficulty}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{analysisResult.issue.estimatedTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{analysisResult.issue.priority} Priority</span>
                    </span>
                  </div>
                </div>
                
                {/* Issue Description */}
                <div className="mb-4">
                  <p className="text-gray-300 leading-relaxed">
                    {analysisResult.issue.description}
                  </p>
                </div>
                
                {/* Labels */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {analysisResult.issue.labels.map((label, index) => {
                    // Smart label classification
                    const labelClass = 
                      label === 'enhancement' || label === 'feature' ? 'github-label-enhancement' :
                      label === 'ai-generated' ? 'github-label-ai-generated' :
                      label === 'api' ? 'github-label-feature' :
                      label === 'bug' ? 'github-label-bug' :
                      label === 'security' ? 'github-label-security' :
                      'github-label-default';
                    
                    return (
                      <span 
                        key={index} 
                        className={`github-label ${labelClass}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
                
                {/* AI Agents Used */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="text-xs github-text-muted mb-1">AI Agents Consulted</div>
                  <div className="text-sm github-text-muted">
                    {analysisResult.selectedAgents.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Simple Continue Button */}
            <div className="text-center">
              <button
                onClick={handleContinue}
                className="btn-github-primary px-6 py-3"
              >
                <span className="flex items-center">
                  Review Detailed Results
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}