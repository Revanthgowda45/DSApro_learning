import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AIGamingService, { GameChallenge, GameSession } from '../services/aiGamingService';
import { 
  CheckCircle, 
  XCircle, 
  Award, 
  Play, 
  Lightbulb, 
  Clock, 
  Trophy, 
  Target, 
  TrendingUp, 
  Zap, 
  Star, 
  Brain,
  GamepadIcon,
  Timer,
  BookOpen
} from 'lucide-react';

interface GamingStats {
  totalGames: number;
  completedGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  favoriteCategory: string;
  totalTimeSpent: number;
}

const Gaming: React.FC = () => {
  const { user } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState<GameChallenge | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [userCode, setUserCode] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedCategory, setSelectedCategory] = useState('Array Manipulation');
  const [stats, setStats] = useState<GamingStats | null>(null);
  const [explanation, setExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    suggestions?: string[];
  } | null>(null);

  // Load gaming statistics
  useEffect(() => {
    if (user) {
      const userStats = AIGamingService.getGamingStats(user.id);
      setStats(userStats);
    }
  }, [user]);

  const handleTimeUp = useCallback(() => {
    if (!gameSession || !user || gameCompleted) return;

    console.log('⏰ Time up! Ending game session');
    setIsPlaying(false);
    setGameCompleted(true);
    setScore(0);

    const timeSpent = currentChallenge?.timeLimit || 0;
    const completedSession: GameSession = {
      ...gameSession,
      endTime: new Date(),
      score: 0,
      completed: false,
      timeSpent
    };
    
    try {
      AIGamingService.saveGameSession(completedSession);
      // Update stats
      const updatedStats = AIGamingService.getGamingStats(user.id);
      setStats(updatedStats);
      console.log('✅ Game session saved successfully');
    } catch (error) {
      console.error('❌ Error saving game session:', error);
    }
  }, [gameSession, user, currentChallenge, gameCompleted]);

  // Timer effect with proper cleanup
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0 && !gameCompleted) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, timeLeft, gameCompleted, handleTimeUp]);

  const startNewGame = useCallback(async () => {
    if (!user) {
      console.warn('⚠️ No user found, cannot start game');
      return;
    }

    console.log('🎮 Starting new game:', { difficulty: selectedDifficulty, category: selectedCategory });
    setLoading(true);
    
    try {
      const userLevel = Math.floor((stats?.completedGames || 0) / 5) + 1;
      console.log('📊 User level calculated:', userLevel);
      
      const challenge = await AIGamingService.generateChallenge(
        selectedDifficulty,
        selectedCategory,
        userLevel
      );

      if (challenge) {
        console.log('✅ Challenge generated:', challenge.title);
        
        // Reset all game states
        setCurrentChallenge(challenge);
        setTimeLeft(challenge.timeLimit);
        setUserCode('');
        setHints([]);
        setShowHint(false);
        setGameCompleted(false);
        setScore(0);
        setExplanation('');
        setShowExplanation(false);
        setValidationResult(null);
        setIsPlaying(true);

        // Create new game session
        const session: GameSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          challengeId: challenge.id,
          startTime: new Date(),
          score: 0,
          hintsUsed: 0,
          completed: false,
          timeSpent: 0
        };
        setGameSession(session);
        console.log('🎯 Game session created:', session.id);
      } else {
        console.error('❌ Failed to generate challenge');
        alert('Failed to generate challenge. Please try again or check your internet connection.');
      }
    } catch (error) {
      console.error('❌ Error starting game:', error);
      alert('Error starting game: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [user, selectedDifficulty, selectedCategory, stats]);

  const getHint = useCallback(async () => {
    if (!currentChallenge || !gameSession || !isPlaying) {
      console.warn('⚠️ Cannot get hint: missing requirements');
      return;
    }

    console.log('💡 Getting hint for challenge:', currentChallenge.title);
    setLoading(true);
    
    try {
      const hint = await AIGamingService.getHint(currentChallenge, userCode);
      if (hint) {
        setHints(prev => [...prev, hint]);
        setShowHint(true);
        
        // Update session with hint usage
        setGameSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
        console.log('✅ Hint added successfully');
      } else {
        console.warn('⚠️ No hint received from AI service');
        // Use fallback hint from challenge
        const fallbackHint = currentChallenge.hints[gameSession.hintsUsed % currentChallenge.hints.length];
        setHints(prev => [...prev, fallbackHint]);
        setShowHint(true);
        setGameSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
      }
    } catch (error) {
      console.error('❌ Error getting hint:', error);
      // Use fallback hint from challenge
      const fallbackHint = currentChallenge.hints[gameSession.hintsUsed % currentChallenge.hints.length];
      setHints(prev => [...prev, fallbackHint]);
      setShowHint(true);
      setGameSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
    } finally {
      setLoading(false);
    }
  }, [currentChallenge, userCode, gameSession, isPlaying]);

  const submitSolution = useCallback(async () => {
    if (!currentChallenge || !gameSession || !user || !isPlaying) {
      console.warn('⚠️ Cannot submit: missing requirements or game not active');
      return;
    }

    if (!userCode.trim()) {
      alert('Please write your solution before submitting!');
      return;
    }

    console.log('🚀 Submitting solution for:', currentChallenge.title);
    setLoading(true);
    
    try {
      // Validate the solution first
      console.log('🔍 Validating solution...');
      const validation = await AIGamingService.validateSolution(currentChallenge, userCode);
      setValidationResult(validation);
      
      const timeSpent = currentChallenge.timeLimit - timeLeft;
      const finalScore = AIGamingService.calculateScore(
        currentChallenge.points,
        timeSpent,
        currentChallenge.timeLimit,
        gameSession.hintsUsed,
        true,
        validation.isCorrect,
        validation.score || 100,
        currentChallenge.perfectTime
      );

      console.log('📊 Validation result:', validation);
      console.log('📊 Final score calculated:', finalScore);
      setScore(finalScore);
      setIsPlaying(false);
      setGameCompleted(true);

      // Update and save session
      const completedSession: GameSession = {
        ...gameSession,
        endTime: new Date(),
        score: finalScore,
        completed: true,
        timeSpent
      };
      
      try {
        AIGamingService.saveGameSession(completedSession);
        console.log('✅ Game session saved');
      } catch (saveError) {
        console.error('❌ Error saving session:', saveError);
      }

      // Get AI explanation (non-blocking)
      try {
        const aiExplanation = await AIGamingService.getExplanation(currentChallenge, userCode);
        if (aiExplanation) {
          setExplanation(aiExplanation);
          setShowExplanation(true);
          console.log('✅ AI explanation received');
        } else {
          setExplanation(currentChallenge.explanation);
          setShowExplanation(true);
          console.log('📝 Using fallback explanation');
        }
      } catch (explanationError) {
        console.error('❌ Error getting explanation:', explanationError);
        setExplanation(currentChallenge.explanation);
        setShowExplanation(true);
      }

      // Update stats
      try {
        const updatedStats = AIGamingService.getGamingStats(user.id);
        setStats(updatedStats);
        console.log('📈 Stats updated');
      } catch (statsError) {
        console.error('❌ Error updating stats:', statsError);
      }

    } catch (error) {
      console.error('❌ Error submitting solution:', error);
      alert('Error submitting solution: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [currentChallenge, gameSession, user, timeLeft, userCode, isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <GamepadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please log in to access DSA Gaming</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <GamepadIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DSA Gaming Arena</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Master Data Structures & Algorithms through interactive gaming challenges powered by AI
          </p>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bestScore}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Games Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedGames}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time Played</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(stats.totalTimeSpent / 60)}m
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Setup Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                Game Setup
              </h2>

              {/* Difficulty Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => setSelectedDifficulty(difficulty)}
                      disabled={isPlaying}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDifficulty === difficulty
                          ? getDifficultyColor(difficulty)
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isPlaying}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {AIGamingService.getGameCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Game Button */}
              <button
                onClick={startNewGame}
                disabled={loading || isPlaying}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    {isPlaying ? 'Game in Progress' : 'Start New Challenge'}
                  </>
                )}
              </button>

              {/* Game Timer */}
              {isPlaying && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Time Remaining
                    </span>
                    <div className="flex items-center text-blue-700 dark:text-blue-300">
                      <Timer className="h-4 w-4 mr-1" />
                      <span className="font-mono text-lg font-bold">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${currentChallenge ? (timeLeft / currentChallenge.timeLimit) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Area */}
          <div className="lg:col-span-2">
            {currentChallenge ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {/* Challenge Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentChallenge.title}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentChallenge.difficulty)}`}>
                        {currentChallenge.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  {/* Challenge Stats */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <Target className="h-5 w-5 mr-2" />
                      <span className="font-medium">{currentChallenge.points} points</span>
                    </div>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="font-medium">{Math.floor(currentChallenge.timeLimit / 60)}m limit</span>
                    </div>
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Perfect: {Math.floor(currentChallenge.perfectTime / 60)}m</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {currentChallenge.description}
                  </p>
                </div>

                {/* Code Editor */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Your Solution
                  </label>
                  <textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    disabled={!isPlaying}
                    placeholder="Write your solution here..."
                    className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={getHint}
                    disabled={!isPlaying || loading}
                    className="flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Get Hint ({gameSession?.hintsUsed || 0} used)
                  </button>

                  <button
                    onClick={submitSolution}
                    disabled={!isPlaying || !userCode.trim() || loading}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Solution
                  </button>
                </div>

                {/* Hints */}
                {hints.length > 0 && showHint && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Hints
                    </h3>
                    {hints.map((hint, index) => (
                      <p key={index} className="text-yellow-700 dark:text-yellow-300 mb-2 last:mb-0">
                        {index + 1}. {hint}
                      </p>
                    ))}
                  </div>
                )}

                {/* Game Completion */}
                {gameCompleted && (
                  <div className={`p-6 rounded-lg border ${
                    validationResult?.isCorrect 
                      ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800'
                      : score === 0 
                        ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
                        : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="text-center mb-4">
                      {validationResult?.isCorrect ? (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                            Excellent Solution! 🎉
                            {currentChallenge && (currentChallenge.timeLimit - timeLeft) <= currentChallenge.perfectTime && (
                              <span className="block text-lg text-yellow-600 dark:text-yellow-400 mt-1">
                                ⚡ Perfect Time Bonus! ⚡
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                              <Award className="h-5 w-5 mr-1" />
                              <span className="font-bold text-xl">{score} points</span>
                            </div>
                            {currentChallenge && (currentChallenge.timeLimit - timeLeft) <= currentChallenge.perfectTime && (
                              <div className="flex items-center text-yellow-500">
                                <Trophy className="h-5 w-5 mr-1" />
                                <span className="font-bold text-sm">Perfect Time!</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : score > 0 ? (
                        <>
                          <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900 rounded-full">
                            <span className="text-2xl">⚠️</span>
                          </div>
                          <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                            Needs Improvement
                          </h3>
                          <div className="flex items-center justify-center space-x-4 mb-3">
                            <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                              <Award className="h-5 w-5 mr-1" />
                              <span className="font-bold text-xl">{score} points (partial credit)</span>
                            </div>
                          </div>
                          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                            {validationResult?.feedback || "Your solution shows effort but may not be fully correct."}
                          </p>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                          <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
                            {timeLeft === 0 ? "Time's Up! ⏰" : "Solution Incorrect ❌"}
                          </h3>
                          <p className="text-red-600 dark:text-red-400 mb-4">
                            {timeLeft === 0 
                              ? "Don't worry, keep practicing and you'll get it next time!"
                              : validationResult?.feedback || "Your solution doesn't solve the problem correctly."
                            }
                          </p>
                        </>
                      )}
                    </div>

                    {/* Validation Feedback */}
                    {validationResult && !validationResult.isCorrect && validationResult.suggestions && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Suggestions for Improvement
                        </h4>
                        <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                          {validationResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Explanation */}
                    {showExplanation && explanation && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          AI Explanation
                        </h4>
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {explanation}
                        </div>
                      </div>
                    )}

                    <div className="text-center mt-4">
                      <button
                        onClick={startNewGame}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      >
                        Play Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <GamepadIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Ready to Start Gaming?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose your difficulty and category, then start your first DSA gaming challenge!
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    AI-Powered
                  </div>
                  <div className="flex items-center">
                    <Brain className="h-4 w-4 mr-1" />
                    Adaptive Learning
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    Gamified Progress
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gaming;
