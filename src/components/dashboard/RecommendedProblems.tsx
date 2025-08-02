import { useState, useEffect } from 'react';
import { Star, Clock, Brain, Target, Cpu, ExternalLink, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { 
  getProgressiveDailyRecommendations, 
  getProgressiveMotivationalMessage,
  defaultProgressiveProgress,
  loadProgressiveProgress
} from '../../data/progressiveAIRecommender';
import type { DailyRecommendation, ProgressiveUserProgress } from '../../data/progressiveAIRecommender';
import { useAnalyticsRefresh } from '../../hooks/useAnalyticsRefresh';
import { updateAllAnalytics } from '../../utils/analyticsUpdater';

export default function RecommendedProblems() {
  const [userProgress, setUserProgress] = useState<ProgressiveUserProgress>(defaultProgressiveProgress);
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyRecommendation | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<string>('');
  // Removed unused progressSummary state
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(true);
  
  // Listen for analytics updates to refresh the recommendations
  const refreshTrigger = useAnalyticsRefresh();

  useEffect(() => {
    loadProgressiveData();
  }, []);
  
  // Refresh when analytics are updated
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadProgressiveData();
    }
  }, [refreshTrigger]);
  
  // Listen for learning preferences updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      console.log('Learning preferences updated:', event.detail);
      // Refresh recommendations when preferences change
      loadProgressiveData();
    };
    
    window.addEventListener('learningPreferencesUpdated', handlePreferencesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('learningPreferencesUpdated', handlePreferencesUpdate as EventListener);
    };
  }, []);

  const loadProgressiveData = () => {
    setIsLoading(true);
    
    // Use utility function to load progress with proper Set handling
    const progress = loadProgressiveProgress();
    setUserProgress(progress);
    
    setTimeout(() => {
      // Get today's recommendations (includes carry-over problems)
      const dailyRec = getProgressiveDailyRecommendations(progress);
      setDailyRecommendation(dailyRec);
      
      // Get motivational message
      const message = getProgressiveMotivationalMessage(progress);
      setMotivationalMessage(message);
      
      // Progress summary removed as it's not used in mobile layout
      
      setIsLoading(false);
    }, 1000);
  };

  const handleProblemSolved = (problemId: string) => {
    // Find the problem to get its details
    const problem = dailyRecommendation?.problems.find(p => p.id === problemId);
    
    // Use centralized analytics updater that updates ALL systems
    updateAllAnalytics({
      problemId,
      newStatus: 'solved',
      difficulty: problem?.difficulty || 'Medium',
      category: problem?.category || 'General'
    });
    
    // Reload recommendations to reflect changes
    loadProgressiveData();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-orange-600 bg-orange-100';
      case 'Very Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Removed unused getPriorityColor function

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-blue-600">
            <Brain className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">AI is analyzing your progress...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dailyRecommendation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">No recommendations available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-2 xs:space-y-0 mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <span>📚</span>
          <span>Learning Path</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvancedInsights(!showAdvancedInsights)}
            className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1 ${
              showAdvancedInsights 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>AI</span>
          </button>
        </div>
      </div>

      {/* Mobile-Optimized Motivational Message */}
      {motivationalMessage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 leading-relaxed">{motivationalMessage}</span>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Learning Goal */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 sm:p-4">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-800 dark:text-green-200 text-sm sm:text-base">
            Goal
          </span>
        </div>
        <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-3 leading-relaxed">
          Complete {dailyRecommendation.problems.length} problems to maintain your learning momentum
        </p>
        {userProgress.currentLevel && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-green-600 dark:text-green-400">Level:</span>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">{userProgress.currentLevel?.name || 'Beginner'}</span>
          </div>
        )}
      </div>

      {/* Mobile-Optimized Carry-over Problems Alert */}
      {dailyRecommendation.carryOverProblems.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            <span className="font-medium text-orange-800 dark:text-orange-200 text-sm sm:text-base">
              Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
            You have {dailyRecommendation.carryOverProblems.length} unsolved problem(s) from previous days. 
            <span className="hidden xs:inline">Complete these first to maintain consistency!</span>
          </p>
        </div>
      )}

      {/* Problems List - Mobile Optimized */}
      {dailyRecommendation.problems.map((problem) => {
        const isCarryOver = dailyRecommendation.carryOverProblems.some(p => typeof p === 'string' ? p === problem.id : p.id === problem.id);
        return (
        <div
          key={problem.id}
          className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${
            isCarryOver ? 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }`}
        >
          {/* Mobile: Stack layout, Desktop: Side by side */}
          <div className="space-y-3">
            {/* Problem Title and Icons */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-start space-x-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight pr-2">{problem.title}</h3>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {/* Mock strategic value based on problem difficulty */}
                    {(problem.difficulty === 'Hard' || problem.difficulty === 'Very Hard') && (
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                    )}
                    {/* Mock trending based on company count */}
                    {problem.companies.length > 5 && (
                      <div title="Trending Problem">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 dark:text-orange-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Problem metadata - Mobile: Stack, Desktop: Row */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 space-y-1 xs:space-y-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                  <span className="text-xs sm:text-sm">{problem.category}</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{problem.timeEstimate} min</span>
                  </div>
                </div>
                
                {/* AI Recommendation Badge */}
                <div className="mt-2">
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md inline-block">
                    <Brain className="h-3 w-3 inline mr-1" />
                    {isCarryOver ? 'Carry-over from previous day' : `Recommended for ${problem.category} practice`}
                  </div>
                </div>
              </div>
              
              {/* Action Button - Mobile: Top right, Desktop: Same */}
              {(problem.link || problem.leetcodeLink) && (
                <div className="flex-shrink-0 ml-2">
                  <a
                    href={problem.link || problem.leetcodeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs sm:text-sm"
                  >
                    <span className="hidden xs:inline">Solve</span>
                    <span className="xs:hidden">Go</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            
            {/* Advanced AI Insights - Mobile Optimized */}
            {showAdvancedInsights && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">🧠 Advanced AI Analysis:</div>
                
                {/* Mobile: Single column, Desktop: Two columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Success: {problem.difficulty === 'Easy' ? '88' : problem.difficulty === 'Medium' ? '72' : problem.difficulty === 'Hard' ? '58' : '42'}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Cpu className="h-3 w-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 truncate">Pattern: {problem.category.includes('Array') ? 'Two Pointers' : problem.category.includes('Tree') ? 'DFS/BFS' : 'Dynamic Programming'}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Time: {problem.difficulty === 'Easy' ? 'O(n)' : problem.difficulty === 'Medium' ? 'O(n log n)' : 'O(n²)'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Curve: {problem.difficulty === 'Easy' ? 'Gentle' : problem.difficulty === 'Medium' ? 'Moderate' : 'Steep'}
                  </div>
                </div>
                
                {/* Tips and Hints */}
                <div className="space-y-1">
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    💡 {isCarryOver ? 'Focus on completing this problem from yesterday' : `Perfect for strengthening your ${problem.category} skills`}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    🎯 Hint: {problem.difficulty === 'Easy' ? 'Start with brute force, then optimize' : problem.difficulty === 'Medium' ? 'Consider edge cases and time complexity' : 'Break down into smaller subproblems'}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Analytics and Actions - Mobile Responsive */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
            {/* Mobile: Stack layout, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              
              {/* AI Metrics - Mobile: Full width, Desktop: Left side */}
              <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-4 text-xs sm:text-sm">
                
                {/* AI Confidence */}
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">AI Confidence:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      // Generate AI confidence based on problem characteristics
                      const aiConfidence = Math.min(5, Math.max(1, 
                        Math.floor(
                          (problem.companies.length * 0.3) + 
                          (problem.title.length * 0.05) + 
                          (problem.difficulty === 'Easy' ? 4 : 
                           problem.difficulty === 'Medium' ? 3.5 : 
                           problem.difficulty === 'Hard' ? 3 : 2.5) +
                          (Math.sin(parseInt(problem.id) * 0.1) * 0.5)
                        )
                      ));
                      return (
                        <Star
                          key={star}
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${
                            star <= aiConfidence
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* Success Rate - Hide on very small screens */}
                <div className="hidden xs:flex items-center text-gray-600 dark:text-gray-400 text-xs">
                  Success: {Math.round(
                    // Generate success rate based on difficulty and problem characteristics
                    problem.difficulty === 'Easy' ? 85 + (Math.sin(parseInt(problem.id) * 0.2) * 8) :
                    problem.difficulty === 'Medium' ? 68 + (Math.sin(parseInt(problem.id) * 0.3) * 12) :
                    problem.difficulty === 'Hard' ? 52 + (Math.sin(parseInt(problem.id) * 0.4) * 15) :
                    38 + (Math.sin(parseInt(problem.id) * 0.5) * 18)
                  )}%
                </div>
                
                {/* Strategic Value - Hide on small screens */}
                <div className="hidden sm:flex items-center text-purple-600 dark:text-purple-400 text-xs">
                  Strategic: {Math.round(
                    // Generate strategic value based on companies and topic relevance
                    (problem.companies.length * 8 + 
                     (problem.title.includes('Array') || problem.title.includes('String') ? 15 : 0) +
                     (problem.difficulty === 'Medium' ? 20 : problem.difficulty === 'Hard' ? 25 : 15) +
                     (Math.cos(parseInt(problem.id) * 0.15) * 10 + 50))
                  )}%
                </div>
              </div>
              
              {/* Mark Solved Button - Mobile: Full width, Desktop: Right side */}
              <button 
                onClick={() => handleProblemSolved(problem.id)}
                className="w-full xs:w-auto px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-md transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <span>Mark Solved</span>
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-4">
        <button 
          onClick={() => window.location.href = '/problems'}
          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm"
        >
          View All 375 Problems →
        </button>
      </div>
    </div>
  );
}