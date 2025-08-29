import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Target, Award, BarChart3, CheckCircle, XCircle, RotateCcw, LogOut } from 'lucide-react';
import { testService, TestResult } from '../services/testService';
import { authService } from '../services/authService';
import type { UserProfile } from '../lib/firebase';

interface TestResultsProps {
  user: any;
  userProfile: UserProfile;
  currentResult: TestResult;
  onBackToPortal: () => void;
  onLogout: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ user, userProfile, currentResult, onBackToPortal, onLogout }) => {
  const [allResults, setAllResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  useEffect(() => {
    loadUserResults();
  }, []);

  const loadUserResults = async () => {
    try {
      const results = await testService.getUserTestResults(user.uid);
      setAllResults(results);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const gradeInfo = testService.getGradeFromPercentage(currentResult.percentage);
  const questions = testService.getTestQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black bg-opacity-40 backdrop-blur-xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Test Results</h1>
                <p className="text-xs sm:text-sm text-gray-300">ISTE Recruitment Examination</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:border-gray-500 transition-all duration-300 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Congratulations Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6 sm:mb-8 animate-pulse">
            <CheckCircle className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-6">
            {/* 🎉 Test Submitted Successfully! 🎉 */}
          </h2>
          <p className="text-xl sm:text-2xl text-white mb-4 px-4 font-semibold">
            Congratulations, {userProfile.name}!
          </p>
          <p className="text-lg sm:text-xl text-gray-300 mb-6 px-4">
            Your test has been submitted and recorded successfully.
          </p>
          <div className="bg-green-500 bg-opacity-20 border border-green-500/30 rounded-xl p-4 sm:p-6 max-w-2xl mx-auto mb-8">
            <p className="text-green-300 text-base sm:text-lg font-medium">
              ✅ Your responses have been saved securely
            </p>
            <p className="text-green-400 text-sm sm:text-base mt-2">
              Results will be processed and communicated to you soon
            </p>
          </div>
          
          {/* Continue Button */}
          <div className="mb-8">
            <a
              href="https://istetiet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white font-bold text-lg sm:text-xl rounded-2xl hover:from-blue-700 hover:via-cyan-700 hover:to-sky-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 animate-bounce"
            >
              <span>Continue to ISTE Website</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
          
          <p className="text-sm sm:text-base text-gray-400 px-4 max-w-xl mx-auto">
            Thank you for participating in the ISTE recruitment process. We appreciate your time and effort!
          </p>
        </div>

      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

export default TestResults;
