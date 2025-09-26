'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Coins, Users, Github } from 'lucide-react';

export default function Hero() {
  const router = useRouter();

  const handleStartContributing = () => {
    router.push('/submit');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800/60 border border-gray-600/40 mb-8 backdrop-blur-sm">
          <Shield className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-sm font-medium text-white">Secure Code Analysis Platform</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
          Secure Code Analysis
          <br />
          <span className="text-gray-200">for Development Teams</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          Submit your code for comprehensive security analysis. Get detailed reports on vulnerabilities, 
          code quality, and best practices to improve your development workflow.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button onClick={handleStartContributing} className="btn-primary group">
            Submit Repo
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="btn-secondary group">
            <Github className="mr-2 w-4 h-4" />
            View Dashboard
          </button>
        </div>

        {/* Feature cards */}
        {/* <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="github-card-elevated p-6 glow-blue">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto border border-blue-500/30">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Analysis</h3>
            <p className="text-gray-200">Comprehensive vulnerability detection and security best practices analysis</p>
          </div>

          <div className="github-card-elevated p-6 glow-green">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto border border-green-500/30">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Team Collaboration</h3>
            <p className="text-gray-200">Share analysis results with your team and track improvements over time</p>
          </div>

          <div className="github-card-elevated p-6 glow-purple">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto border border-purple-500/30">
              <Coins className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quality Reports</h3>
            <p className="text-gray-200">Detailed reports with actionable insights to improve code quality and maintainability</p>
          </div>
        </div> */}
      </div>
    </section>
  );
}
