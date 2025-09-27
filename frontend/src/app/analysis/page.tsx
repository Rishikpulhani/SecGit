'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle, Loader, Zap } from 'lucide-react';
import Header from '../../components/Header';

export default function Analysis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get('repo') || '';
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsAnalyzing(false);
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    router.push(`/review?repo=${encodeURIComponent(repoUrl)}`);
  };

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
                  Analyzing Your Repository
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-gray-300 mb-8">
                  Running comprehensive security analysis on {repoUrl.split('/').pop()}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Scanning for vulnerabilities and issues...</span>
                </div>

              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="github-layout">
      <Header />
      
      <main className="pt-16">
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20" style={{ paddingTop: '6rem' }}>
          <div className="w-full flex justify-center">
            <div className="relative max-w-2xl w-full text-center">
              
              {/* Success Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white text-center w-full">
                Analysis Complete!
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-300 mb-12">
                We've found several security issues and improvement opportunities in your repository.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="github-card p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">5</div>
                  <div className="text-sm text-gray-400">Security Issues</div>
                </div>
                <div className="github-card p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">3</div>
                  <div className="text-sm text-gray-400">Performance Issues</div>
                </div>
                <div className="github-card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">2</div>
                  <div className="text-sm text-gray-400">Enhancements</div>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                className="btn-github-primary px-8 py-4 text-lg font-medium"
              >
                <span className="flex items-center">
                  Review Results
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