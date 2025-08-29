import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Flag } from 'lucide-react';
import { testService, TestQuestion, TestAnswer } from '../services/testService';
import type { UserProfile } from '../lib/firebase';

interface TestInterfaceProps {
  user: any;
  userProfile: UserProfile;
  onTestComplete: (result: any) => void;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ user, userProfile, onTestComplete }) => {
  const [questions] = useState<TestQuestion[]>(testService.getRandomizedTestQuestions(user.uid));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());
  const [testSettings] = useState(testService.getTestSettings());
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isTestCancelled, setIsTestCancelled] = useState(false);

  useEffect(() => {
    // Update countdown timer based on test end time (1 hour from start)
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = testService.getTestEndTime().getTime();
      const difference = endTime - now;
      
      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
        handleSubmitTest(); // Auto-submit when test time is up
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [testSettings.testStartTime]);

  useEffect(() => {
    // Tab/window switching detection
    const handleVisibilityChange = async () => {
      if (document.hidden && !isSubmitting && !isTestCancelled) {
        try {
          const newCount = await testService.incrementTabSwitchCount(user.uid);
          setTabSwitchCount(newCount);
          
          if (newCount === 1) {
            setShowTabWarning(true);
            setTimeout(() => setShowTabWarning(false), 10000); // Hide warning after 10 seconds
          } else if (newCount > testSettings.maxTabSwitches) {
            // Cancel test
            await testService.cancelTest(user.uid);
            setIsTestCancelled(true);
            alert('Test cancelled due to excessive tab switching. Your test has been terminated.');
            onTestComplete({
              userId: user.uid,
              userName: userProfile.name,
              userEmail: userProfile.email,
              admissionNumber: userProfile.admissionNumber,
              branch: userProfile.branch,
              score: 0,
              totalQuestions: questions.length,
              percentage: 0,
              timeSpent: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
              answers: [],
              completedAt: new Date(),
              status: 'abandoned' as const
            });
          }
        } catch (error) {
          console.error('Failed to handle tab switch:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user.uid, testSettings.maxTabSwitches, isSubmitting, isTestCancelled, questions.length, userProfile, startTime, onTestComplete]);

  useEffect(() => {
    // Prevent page refresh/navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitting && !isTestCancelled) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubmitting, isTestCancelled]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && timeLeft !== 0 && !isSubmitting && !isTestCancelled) {
      handleSubmitTest();
    }
  }, [timeLeft, isSubmitting, isTestCancelled]);

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

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmitTest = async () => {
    if (isSubmitting || isTestCancelled) return;
    
    setIsSubmitting(true);
    
    try {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const testAnswers: TestAnswer[] = questions.map(question => ({
        questionId: question.id,
        selectedAnswer: answers[question.id] ?? -1,
        isCorrect: answers[question.id] === question.correctAnswer
      }));

      const { score, percentage } = testService.calculateScore(testAnswers);

      const testResult = {
        userId: user.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        admissionNumber: userProfile.admissionNumber,
        branch: userProfile.branch,
        score,
        totalQuestions: questions.length,
        percentage,
        timeSpent,
        answers: testAnswers,
        completedAt: new Date(),
        status: 'completed' as const
      };

      const resultId = await testService.submitTestResult(testResult);
      
      onTestComplete({
        ...testResult,
        id: resultId
      });
    } catch (error) {
      console.error('Failed to submit test:', error);
      alert('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Show test cancelled message
  if (isTestCancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Test Cancelled</h2>
          <p className="text-gray-300 mb-6">
            Your test has been cancelled due to excessive tab switching. This is a security measure to ensure test integrity.
          </p>
          <p className="text-red-400 text-sm">
            You switched tabs/windows {tabSwitchCount} times. Maximum allowed: {testSettings.maxTabSwitches}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black relative overflow-hidden">
      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 bg-opacity-90 backdrop-blur-xl border border-yellow-400 rounded-lg p-4 max-w-md mx-auto animate-bounce">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-900" />
            <div>
              <p className="text-yellow-900 font-semibold text-sm">Warning!</p>
              <p className="text-yellow-800 text-xs">
                You have switched the window. Doing this more times may cancel your test.
                ({tabSwitchCount}/{testSettings.maxTabSwitches} switches used)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black bg-opacity-40 backdrop-blur-xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <h1 className="text-lg sm:text-xl font-bold text-white">Recruitment Test</h1>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>•</span>
                <span>{getAnsweredCount()} answered</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6 w-full sm:w-auto">
              <div className="flex items-center space-x-2 text-white">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className={`font-mono text-base sm:text-lg ${timeLeft < 300 ? 'text-red-400' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting || isTestCancelled}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap flex items-center space-x-2"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit Test'}</span>
                {timeLeft < 300 && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 bg-black bg-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-300 ${
                timeLeft < 300 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
            {/* Tab switch indicator */}
            {tabSwitchCount > 0 && (
              <div className="absolute top-0 right-0 h-full w-2 bg-yellow-500"></div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-4 sm:p-6 lg:p-8">
          {/* Question */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
              <span className="px-3 py-1 bg-blue-600 bg-opacity-30 border border-blue-500/30 rounded-full text-blue-300 text-xs sm:text-sm w-fit">
                {currentQuestion.category}
              </span>
              <span className="text-gray-400 text-xs sm:text-sm">
                Question {currentQuestionIndex + 1}
              </span>
            </div>
            
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-4 sm:mb-6 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                className={`w-full p-3 sm:p-4 text-left rounded-lg border transition-all duration-300 ${
                  answers[currentQuestion.id] === index
                    ? 'bg-blue-600 bg-opacity-30 border-blue-500 text-white'
                    : 'bg-gray-800 bg-opacity-50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion.id] === index
                      ? 'border-blue-400 bg-blue-600'
                      : 'border-gray-500'
                  }`}>
                    {answers[currentQuestion.id] === index && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm sm:text-base lg:text-lg">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-600 hover:border-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2 order-first sm:order-none">
              {answers[currentQuestion.id] !== undefined ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">Answered</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">Not answered</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 sm:mt-8 bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Flag className="w-5 h-5 text-blue-400" />
            <span>Question Navigator</span>
          </h3>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : answers[questions[index].id] !== undefined
                    ? 'bg-green-600 bg-opacity-30 border-green-500 text-green-300'
                    : 'bg-gray-700 bg-opacity-50 border-gray-600 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestInterface;