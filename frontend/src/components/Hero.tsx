'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Coins, Users, Github } from 'lucide-react';

export default function Hero() {
  const router = useRouter();

  const handleStartContributing = () => {
    router.push('/submit');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full opacity-30 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full opacity-30 animate-bounce-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/10 rounded-full opacity-40 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-indigo-500/10 rounded-full opacity-30 animate-bounce-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 mb-8 animate-fade-in backdrop-blur-sm">
          <Shield className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Secure & Decentralized Platform</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
          <span className="gradient-text">Secure Bounty Rewards</span>
          <br />
          <span className="text-gray-100">for Open Source</span>
          <br />
          <span className="gradient-text">Contributors</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Connect passionate developers with meaningful projects. Earn fair rewards for your contributions 
          in a transparent, blockchain-powered ecosystem that values your skills and dedication.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <button onClick={handleStartContributing} className="btn-primary group">
            Start Contributing
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="btn-secondary group">
            <Github className="mr-2 w-4 h-4" />
            Explore Projects
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="glass-morphism rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:bg-gray-800/40">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto shadow-lg shadow-blue-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Secure Payments</h3>
            <p className="text-gray-400">Smart contract-based escrow ensures contributors get paid fairly and on time</p>
          </div>

          <div className="glass-morphism rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:bg-gray-800/40">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto shadow-lg shadow-purple-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Community Driven</h3>
            <p className="text-gray-400">Join a vibrant community of developers making real impact on open source</p>
          </div>

          <div className="glass-morphism rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:bg-gray-800/40">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto shadow-lg shadow-indigo-500/25">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Fair Rewards</h3>
            <p className="text-gray-400">Transparent reward system based on contribution quality and project impact</p>
          </div>
        </div>
      </div>
    </section>
  );
}
