import React, { useState, useEffect } from 'react';
import { Clock, FileText, Users, Award, LogOut, Play, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { testService } from '../services/testService';
import TestInterface from './TestInterface';
import TestResults from './TestResults';
import type { UserProfile } from '../lib/firebase';

interface ExamPortalProps {
  user: any;
  userProfile: UserProfile;
  onLogout: () => void;
}

const ExamPortal: React.FC<ExamPortalProps> = ({ user, userProfile, onLogout }) => {
  const [timeUntilStart, setTimeUntilStart] = useState(0);
  const [timeUntilEnd, setTimeUntilEnd] = useState(0);
  const [isTestAvailable, setIsTestAvailable] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [userTestStatus, setUserTestStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testSettings] = useState(testService.getTestSettings());

  useEffect(() => {
    checkUserTestStatus();
  }, []);

  useEffect(() => {
  const timer = setInterval(() => {
    const now = new Date().getTime();
    const startTime = testSettings.testStartTime.getTime();
    const windowEndTime = startTime + 30 * 60 * 1000; // 30 minutes after start
    const testDurationEndTime = testService.getTestEndTime().getTime();

    // Time until test start window opens
    const timeToStartWindow = startTime - now;

    if (now < startTime) {
      // Before window start
      setTimeUntilStart(Math.floor(timeToStartWindow / 1000));
      setIsTestAvailable(false);
    } else if (now >= startTime && now <= windowEndTime) {
      // Within the 30 min start window
      setTimeUntilStart(0);
      setIsTestAvailable(true);

      // Also set time until the test duration ends (15 mins after test start)
      const timeToTestDurationEnd = testDurationEndTime - now;
      setTimeUntilEnd(timeToTestDurationEnd > 0 ? Math.floor(timeToTestDurationEnd / 1000) : 0);
    } else {
      // After 30 min start window
      setTimeUntilStart(0);
      setIsTestAvailable(false); // test can no longer be started
      setTimeUntilEnd(0);
    }
  }, 1000);

  return () => clearInterval(timer);
}, [testSettings.testStartTime]);


  const checkUserTestStatus = async () => {
    try {
      const status = await testService.getUserTestStatus(user.uid);
      setUserTestStatus(status);
      
      // If user has already submitted, load their results
      if (status?.hasSubmitted) {
        const results = await testService.getUserTestResults(user.uid);
        if (results.length > 0) {
          setTestResult(results[0]); // Get the latest result
          setIsTestCompleted(true);
        }
      }
    } catch (error) {
      console.error('Failed to check user test status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else {
      return `${mins}m ${secs}s`;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleStartTest = () => {
    if (!isTestAvailable) {
      alert('Test is not yet available. Please wait for the start time.');
      return;
    }
    
    if (timeUntilEnd <= 0) {
      alert('Test time has expired. You cannot start the test.');
      return;
    }
    
    if (userTestStatus?.hasSubmitted) {
      alert('You have already submitted the test. You cannot reattempt.');
      return;
    }
    
    if (userTestStatus?.isTestCancelled) {
      alert('Your test has been cancelled due to policy and continuos switching of tabs violations.');
      return;
    }
    
    setIsTestStarted(true);
    setShowInstructions(false);
  };

  const handleTestComplete = (result: any) => {
    setIsTestCompleted(true);
    setTestResult(result);
    // Refresh user test status to reflect submission
    checkUserTestStatus();
  };

  const handleBackToPortal = () => {
    // If user has submitted, don't allow going back to portal
    if (userTestStatus?.hasSubmitted) {
      // Stay on results page, user can only logout
      return;
    }
    
    // Only allow going back if test hasn't been submitted
    if (!userTestStatus?.hasSubmitted) {
      setIsTestStarted(false);
      setIsTestCompleted(false);
      setTestResult(null);
      setShowInstructions(true);
    }
  };

  // Show loading screen while checking status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 animate-pulse">
            <Award className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg">Loading test status...</p>
        </div>
      </div>
    );
  }

  // Show test results if completed
  if (isTestCompleted && testResult) {
    return (
      <TestResults
        user={user}
        userProfile={userProfile}
        currentResult={testResult}
        onBackToPortal={handleBackToPortal}
        onLogout={handleLogout}
      />
    );
  }

  // Show test interface if started
  if (isTestStarted) {
    return (
      <TestInterface
        user={user}
        userProfile={userProfile}
        onTestComplete={handleTestComplete}
      />
    );
  }

  // Show exam portal (default view)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-sky-600 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse delay-3000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black bg-opacity-40 backdrop-blur-xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">ISTE</h1>
                <p className="text-xs sm:text-sm text-gray-300">Recruitment Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-gray-300">Welcome back,</p>
                <p className="text-sm sm:text-base text-white font-semibold truncate max-w-32 sm:max-w-none">{userProfile.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-red-600 bg-opacity-20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-600 hover:bg-opacity-30 transition-all duration-300 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Welcome to the
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mt-2">
                Recruitment Test
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              {/* You're about to begin the official recruitment examination. Please read the instructions carefully before proceeding. */}
            </p>
          </div>

          {/* Timer Section */}
          <div className="flex justify-center">
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 sm:p-8 text-center w-full max-w-md">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Clock className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400" />
                <h3 className="text-lg sm:text-2xl font-bold text-white">
                  {!isTestAvailable ? 'Test Starts In' : timeUntilEnd > 0 ? 'Test Ends In' : 'Test Ended'}
                </h3>
              </div>
              <div className={`text-4xl sm:text-5xl md:text-6xl font-mono font-bold text-transparent bg-clip-text mb-4 ${
                (!isTestAvailable || timeUntilEnd > 0)
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-400' 
                  : 'bg-gradient-to-r from-red-400 to-red-600'
              }`}>
                {!isTestAvailable ? formatTime(timeUntilStart) : formatTime(timeUntilEnd)}
              </div>
              <p className="text-sm sm:text-base text-gray-300">
                {!isTestAvailable 
                  ? 'Time until test becomes available' 
                  : timeUntilEnd > 0
                  ? 'Time remaining to complete the test'
                  : 'Test submission deadline has passed'
                }
              </p>
              
              {/* Show status messages */}
              {userTestStatus?.hasSubmitted && (
                <div className="mt-4 p-3 bg-green-500 bg-opacity-20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">
                    ✓ Test already submitted on {new Date(userTestStatus.submissionDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {userTestStatus?.isTestCancelled && (
                <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">
                    ✗ Test cancelled due to policy violations of continuos switching of tabs
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Section */}
          {showInstructions && (
            <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 sm:p-8 animate-slide-up">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl sm:text-2xl font-bold text-white">Test Instructions</h3>
              </div>
              
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-blue-300">General Guidelines</h4>
                  <ul className="space-y-3 text-sm sm:text-base text-gray-300">
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>The test duration is 15 minutes with 20 multiple-choice questions</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Each question carries equal marks with no negative marking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>You can navigate between questions and change answers</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Auto-submit will occur when time expires</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Submit Button is always available at top of portal</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-blue-300">Technical Requirements</h4>
                  <ul className="space-y-3 text-sm sm:text-base text-gray-300">
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Ensure stable internet connection throughout the test</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Do not refresh the page or use browser back button</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Close all other applications and browser tabs</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Use a desktop or laptop for the best experience</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Do not switch tabs between test as this may lead to cancellation of test</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-yellow-300 mb-1">Important Notice</h5>
                    <p className="text-yellow-200 text-xs sm:text-sm">
                      Once you start the test, you cannot pause or restart it. Make sure you're ready and have sufficient time to complete the entire examination.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Start Test Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStartTest}
              disabled={!isTestAvailable || timeUntilEnd <= 0 || userTestStatus?.hasSubmitted || userTestStatus?.isTestCancelled}
              className={`flex items-center space-x-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 w-full max-w-xs sm:max-w-none sm:w-auto ${
                !isTestAvailable || timeUntilEnd <= 0 || userTestStatus?.hasSubmitted || userTestStatus?.isTestCancelled
                  ? 'bg-gray-600 bg-opacity-50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-105 shadow-lg hover:shadow-blue-500/25'
              }`}
            >
              <Play className="w-5 sm:w-6 h-5 sm:h-6" />
              <span>
                {userTestStatus?.hasSubmitted 
                  ? 'Test Submitted' 
                  : userTestStatus?.isTestCancelled 
                  ? 'Test Cancelled' 
                  : !isTestAvailable
                  ? 'Test Not Available'
                  : timeUntilEnd <= 0 
                  ? 'Test Ended' 
                  : 'Start Test (All Users Start Together)'
                }
              </span>
            </button>
          </div>
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

export default ExamPortal;