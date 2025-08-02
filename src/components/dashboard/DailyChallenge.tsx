import { useState, useEffect } from 'react';
import { 
  Target, 
  Star, 
  Flame, 
  Trophy, 
  Clock, 
  CheckCircle, 
  Zap,
  Award,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { 
  getDailyChallenge, 
  markProblemCompleted, 
  getMotivationalStatus,
  defaultGamifiedProgress,
  loadGamifiedProgress
} from '../../data/gamifiedAICoach';
import type { DailyChallenge as DailyChallengeType, GamifiedUserProgress } from '../../data/gamifiedAICoach';
import { useAnalyticsRefresh } from '../../hooks/useAnalyticsRefresh';

interface DailyChallengeProps {
  disabled?: boolean;
}

export default function DailyChallenge({ disabled = false }: DailyChallengeProps) {
  const [userProgress, setUserProgress] = useState<GamifiedUserProgress>(defaultGamifiedProgress);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeType | null>(null);
  const [motivationalStatus, setMotivationalStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Listen for analytics updates to refresh the component
  const refreshTrigger = useAnalyticsRefresh();

  useEffect(() => {
    loadUserProgress();
  }, []);
  
  // Refresh when analytics are updated
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadUserProgress();
    }
  }, [refreshTrigger]);

  const loadUserProgress = () => {
    setIsLoading(true);
    
    // Use utility function to load progress with proper Set handling
    const progress = loadGamifiedProgress();
    setUserProgress(progress);
    
    // Generate daily challenge
    const challenge = getDailyChallenge(progress);
    setDailyChallenge(challenge);
    
    // Get motivational status
    const status = getMotivationalStatus(progress);
    setMotivationalStatus(status);
    
    setIsLoading(false);
  };

  const handleProblemCompleted = (problemId: string) => {
    // Use utility function that handles everything
    const updatedProgress = markProblemCompleted(problemId, userProgress);
    
    setUserProgress(updatedProgress);
    
    // Update challenge and motivational status
    const updatedChallenge = getDailyChallenge(updatedProgress);
    setDailyChallenge(updatedChallenge);
    
    const updatedStatus = getMotivationalStatus(updatedProgress);
    setMotivationalStatus(updatedStatus);
    
    // Show celebration if challenge completed
    if (updatedChallenge.status === 'completed') {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
      case 'Hard': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700';
      case 'Very Hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusIcon = (problemId: string) => {
    if (userProgress.solvedProblems.has(problemId)) {
      return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
    }
    if (userProgress.attemptedProblems.has(problemId)) {
      return <Clock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
    }
    return <Target className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Zap className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">Generating your daily challenge...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dailyChallenge || !motivationalStatus) {
    return <div>Error loading daily challenge</div>;
  }

  return (
    <div className="space-y-6">
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Challenge Completed!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">You've earned {dailyChallenge.bonusXP} bonus XP!</p>
            <button
              onClick={() => setShowCelebration(false)}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Awesome! 🚀
            </button>
          </div>
        </div>
      )}

      {/* User Stats Header */}
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white relative ${
        disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
      }`}>
        {disabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-30 rounded-lg flex items-center justify-center">
            <div className="bg-gray-800 bg-opacity-90 rounded-lg px-4 py-2">
              <span className="text-gray-300 text-sm font-medium">Component Disabled</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {userProgress.level} Coder</h2>
            <p className="text-blue-100">
              {userProgress.experience} / {userProgress.experienceToNextLevel} XP
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center space-x-1 text-orange-300">
                <Flame className="h-5 w-5" />
                <span className="font-bold text-lg">{userProgress.currentStreak}</span>
              </div>
              <p className="text-xs text-blue-100">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-1 text-yellow-300">
                <Trophy className="h-5 w-5" />
                <span className="font-bold text-lg">{userProgress.badges.length}</span>
              </div>
              <p className="text-xs text-blue-100">Badges</p>
            </div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="w-full bg-blue-500 rounded-full h-3">
          <div 
            className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
            style={{ 
              width: `${(userProgress.experience / userProgress.experienceToNextLevel) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Motivational Status */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative ${
        disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
      }`}>
        {disabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-30 rounded-lg flex items-center justify-center">
            <div className="bg-gray-800 bg-opacity-90 rounded-lg px-4 py-2">
              <span className="text-gray-300 text-sm font-medium">Component Disabled</span>
            </div>
          </div>
        )}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {motivationalStatus.message}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{motivationalStatus.encouragement}</p>
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <Target className="h-4 w-4" />
              <span>Next Goal: {motivationalStatus.nextGoal}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round(motivationalStatus.progressPercentage)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Today's Progress</p>
          </div>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative ${
        disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''
      }`}>
        {disabled && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-30 rounded-lg flex items-center justify-center z-10">
            <div className="bg-gray-800 bg-opacity-90 rounded-lg px-4 py-2">
              <span className="text-gray-300 text-sm font-medium">Component Disabled</span>
            </div>
          </div>
        )}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{dailyChallenge.theme}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{new Date(dailyChallenge.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 ${
                dailyChallenge.status === 'completed' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                <span className="hidden xs:inline">{dailyChallenge.status === 'completed' ? '✅ Completed' : '🎯 Pending'}</span>
                <span className="xs:hidden">{dailyChallenge.status === 'completed' ? '✅' : '🎯'}</span>
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-purple-600 dark:text-purple-400 font-medium mb-2 text-sm sm:text-base">{dailyChallenge.motivationalMessage}</p>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Target: {dailyChallenge.targetCount} problems</span>
                <span className="xs:hidden">{dailyChallenge.targetCount} problems</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Done: {dailyChallenge.completedCount}</span>
                <span className="xs:hidden">{dailyChallenge.completedCount} done</span>
              </span>
              <span className="flex items-center space-x-1">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Bonus: +{dailyChallenge.bonusXP} XP</span>
                <span className="xs:hidden">+{dailyChallenge.bonusXP} XP</span>
              </span>
              <span className="flex items-center space-x-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Level: {userProgress.level}</span>
                <span className="xs:hidden">L{userProgress.level}</span>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span className="font-medium">{dailyChallenge.completedCount} / {dailyChallenge.targetCount}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-2.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 sm:h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(dailyChallenge.completedCount / dailyChallenge.targetCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Mobile-Optimized Hints */}
          {dailyChallenge.hints.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center space-x-1">
                <span>💡</span>
                <span className="hidden xs:inline">Today's Hints:</span>
                <span className="xs:hidden">Hints:</span>
              </h4>
              <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {dailyChallenge.hints.map((hint, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed">{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Mobile-Optimized Problems List */}
        <div className="p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center space-x-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            <span className="hidden xs:inline">Challenge Problems</span>
            <span className="xs:hidden">Problems</span>
          </h4>
          <div className="space-y-3 sm:space-y-4">
            {dailyChallenge.problems.map((problem, index) => {
              const isCompleted = userProgress.solvedProblems.has(problem.id);
              const isAttempted = userProgress.attemptedProblems.has(problem.id);
              
              return (
                <div
                  key={problem.id}
                  className={`border rounded-lg p-3 sm:p-4 transition-all ${
                    isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                    isAttempted ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' :
                    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-base sm:text-lg font-bold text-gray-400 dark:text-gray-500">
                          {index + 1}
                        </span>
                        {getStatusIcon(problem.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base leading-tight">
                          {problem.title}
                        </h5>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 hidden xs:inline">{problem.category}</span>
                          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span className="hidden xs:inline">{problem.timeEstimate} min</span>
                            <span className="xs:hidden">{problem.timeEstimate}m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 sm:flex-shrink-0">
                      {!isCompleted && (
                        <button
                          onClick={() => handleProblemCompleted(problem.id)}
                          className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs sm:text-sm font-medium min-h-[36px] flex items-center"
                        >
                          ✓ Solved
                        </button>
                      )}
                      
                      {(problem.link || problem.leetcodeLink) && (
                        <a
                          href={problem.link || problem.leetcodeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs sm:text-sm min-h-[36px]"
                        >
                          Go
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {userProgress.achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            <span>Recent Achievements</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProgress.achievements.slice(-4).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
              >
                <Trophy className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.description}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">+{achievement.reward} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Badges */}
      {userProgress.badges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
            <Star className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            <span>Badge Collection</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {userProgress.badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  badge.rarity === 'Legendary' ? 'bg-purple-100 border-purple-300 text-purple-800' :
                  badge.rarity === 'Epic' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                  badge.rarity === 'Rare' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                  'bg-gray-100 border-gray-300 text-gray-800'
                }`}
                title={badge.description}
              >
                <span className="text-lg">{badge.icon}</span>
                <span className="text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
