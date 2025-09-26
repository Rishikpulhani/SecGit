'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Zap, Brain, Search, CheckCircle, Loader, Bot } from 'lucide-react';
import Header from '../../components/Header';

// Mock data for analysis stages
const analysisStages = [
  {
    id: 1,
    name: 'Repository Analysis',
    description: 'Scanning code structure and dependencies',
    duration: 3000,
    icon: Search
  },
  {
    id: 2,
    name: 'Agent Discovery',
    description: 'Finding qualified on-chain review agents',
    duration: 4000,
    icon: Bot
  },
  {
    id: 3,
    name: 'Metta Scoring',
    description: 'Evaluating agent capabilities and reputation',
    duration: 2000,
    icon: Brain
  },
  {
    id: 4,
    name: 'Issue Identification',
    description: 'Identifying potential features and bugs',
    duration: 3000,
    icon: Zap
  }
];

// Mock discovered agents - this would come from external APIs
const mockAgents = [
  {
    id: 'gemini-agent-1',
    name: 'Gemini Pro Analyzer',
    type: 'Gemini',
    mettaScore: 94,
    specialties: ['Code Review', 'Security Analysis'],
    reputation: 'Excellent',
    cost: '0.002 ETH'
  },
  {
    id: 'openai-agent-2',
    name: 'GPT-4 Code Expert',
    type: 'OpenAI',
    mettaScore: 91,
    specialties: ['Bug Detection', 'Performance'],
    reputation: 'Very Good',
    cost: '0.0025 ETH'
  },
  {
    id: 'claude-agent-3',
    name: 'Claude Sonnet Dev',
    type: 'Claude',
    mettaScore: 88,
    specialties: ['Documentation', 'Testing'],
    reputation: 'Good',
    cost: '0.0018 ETH'
  }
];

export default function AIAnalysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const githubUrl = searchParams.get('repo') || 'https://github.com/example/repo';
  
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [discoveredAgents, setDiscoveredAgents] = useState<typeof mockAgents>([]);

  useEffect(() => {
    // Simulate analysis progress
    const runAnalysis = async () => {
      for (let i = 0; i < analysisStages.length; i++) {
        setCurrentStage(i);
        
        // Simulate stage progress
        const stage = analysisStages[i];
        const stepDuration = stage.duration / 100;
        
        for (let p = 0; p <= 100; p += 2) {
          setProgress((i * 100 + p) / analysisStages.length);
          await new Promise(resolve => setTimeout(resolve, stepDuration));
        }

        // Simulate agent discovery during stage 2
        if (i === 1) {
          setTimeout(() => setDiscoveredAgents(mockAgents), stage.duration / 2);
        }
      }
      
      setIsComplete(true);
      
      // Auto-redirect to results after 2 seconds
      setTimeout(() => {
        router.push(`/review?repo=${encodeURIComponent(githubUrl)}`);
      }, 2000);
    };

    runAnalysis();
  }, [githubUrl, router]);

  const getCurrentStageIcon = () => {
    if (isComplete) return CheckCircle;
    if (currentStage < analysisStages.length) {
      return analysisStages[currentStage].icon;
    }
    return Loader;
  };

  const CurrentIcon = getCurrentStageIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
      <Header />
      
      <main className="pt-20 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-400 hover:text-blue-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submission
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 mb-6 backdrop-blur-sm">
              <Brain className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">AI Analysis in Progress</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Analyzing Your Repository</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
              Our ASI-1 LLM is analyzing your project and discovering the best on-chain review agents.
            </p>
            
            <p className="text-sm text-gray-400 break-all max-w-2xl mx-auto">
              Repository: {githubUrl}
            </p>
          </div>

          {/* Main Analysis Section */}
          <div className="glass-morphism rounded-2xl p-8 mb-8">
            {/* Current Status */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
                {isComplete ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <CurrentIcon className="w-10 h-10 text-white animate-pulse" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                {isComplete ? 'Analysis Complete!' : analysisStages[currentStage]?.name}
              </h2>
              
              <p className="text-gray-400">
                {isComplete ? 'Redirecting to results...' : analysisStages[currentStage]?.description}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Analysis Stages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {analysisStages.map((stage, index) => {
                const StageIcon = stage.icon;
                const isActive = index === currentStage && !isComplete;
                const isCompleted = index < currentStage || isComplete;
                
                return (
                  <div 
                    key={stage.id}
                    className={`flex items-center p-4 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                        : isCompleted 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : 'bg-gray-800/30 border-gray-600/30 text-gray-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      isActive 
                        ? 'bg-blue-500' 
                        : isCompleted 
                          ? 'bg-green-500'
                          : 'bg-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <StageIcon className={`w-4 h-4 text-white ${isActive ? 'animate-pulse' : ''}`} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{stage.name}</div>
                      <div className="text-xs opacity-75">{stage.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discovered Agents Section */}
            {discoveredAgents.length > 0 && (
              <div className="border-t border-gray-600/30 pt-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-blue-400" />
                  Discovered On-Chain Agents ({discoveredAgents.length})
                </h3>
                
                <div className="grid gap-3">
                  {discoveredAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-600/30">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-100">{agent.name}</div>
                          <div className="text-sm text-gray-400">{agent.specialties.join(', ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-400">Metta Score: {agent.mettaScore}</div>
                        <div className="text-xs text-gray-400">{agent.cost}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* External API Integration Notes */}
          <div className="glass-morphism rounded-xl p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Integration Points (Development Notes)
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>GitHub API:</strong> Repository analysis, file scanning, issue detection</p>
              <p>• <strong>On-chain Agent Registry:</strong> Discovery of available AI agents on blockchain</p>
              <p>• <strong>Metta Protocol API:</strong> Agent scoring and reputation system</p>
              <p>• <strong>ASI-1 LLM API:</strong> Code analysis and issue identification</p>
              <p>• <strong>Smart Contract:</strong> Agent selection and payment escrow</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
