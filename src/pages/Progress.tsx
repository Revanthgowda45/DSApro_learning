import { useEffect } from 'react';
import { TrendingUp, Target, Clock, Star } from 'lucide-react';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { PerformanceMonitor } from '../utils/performanceMonitor';


export default function Progress() {
  // Use optimized analytics hook for better performance
  const { metrics: progressData, loading, error, refresh } = useOptimizedAnalytics();
  
  // Performance monitoring
  useEffect(() => {
    const monitor = PerformanceMonitor.monitorComponent('Progress');
    const endRender = monitor.onRenderStart();
    
    return () => {
      endRender();
    };
  }, []);
  
  // Monitor data loading performance
  useEffect(() => {
    if (progressData) {
      PerformanceMonitor.recordMetric('progress_data_ready', performance.now());
    }
  }, [progressData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-400">Loading optimized analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Analytics</h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No progress data available.</p>
        </div>
      </div>
    );
  }

  // Using progressData directly in the component

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Progress</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your DSA learning journey and celebrate your achievements
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Problems Solved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {progressData.solvedProblems}/{progressData.totalProblems}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Math.round((progressData.solvedProblems / progressData.totalProblems) * 100)}% complete
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{progressData.currentStreak} days</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Longest: {progressData.longestStreak} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Invested</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {Math.round(progressData.totalTimeSpent / 60)}h {progressData.totalTimeSpent % 60}m
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Avg: {progressData.averageTimePerProblem}min/problem
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Level</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{progressData.confidenceLevel}/10</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(progressData.confidenceLevel / 2)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Study Session Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Study Session Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(progressData.totalTimeSpent / 60)}h {progressData.totalTimeSpent % 60}m
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Total Study Time</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {progressData.averageTimePerProblem}min
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">Avg per Problem</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((progressData.totalTimeSpent / 60) / Math.max(1, progressData.currentStreak))}h
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">Daily Average</div>
              </div>
            </div>
            
            {/* Time Distribution */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Time Distribution Analysis</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Optimal session length (45-90 min)</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {progressData.averageTimePerProblem >= 45 && progressData.averageTimePerProblem <= 90 ? '✓ On track' : 
                     progressData.averageTimePerProblem < 45 ? '⚡ Too fast' : '🐌 Take breaks'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Consistency with 2-hour daily goal</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {Math.round((progressData.totalTimeSpent / 60) / Math.max(1, progressData.currentStreak)) >= 1.5 ? '✓ Meeting goal' : '📈 Room to grow'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Learning efficiency</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {progressData.learningVelocity >= 2 ? '🚀 Excellent' : progressData.learningVelocity >= 1 ? '📚 Good' : '🌱 Building'}
                  </span>
                </div>
              </div>
            </div>
          </div>



          {/* Category Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Progress by Category</h2>
            <div className="space-y-4">
              {progressData.categoryProgress.map((category: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      {category.solved}/{category.total} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">




          {/* Learning Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Learning Analytics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning Velocity</span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {progressData.learningVelocity} problems/week
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Consistency Score</span>
                </div>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {progressData.consistencyScore}%
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivation Level</span>
                </div>
                <span className={`text-sm font-bold capitalize ${
                  progressData.motivationLevel === 'high' ? 'text-green-600' :
                  progressData.motivationLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {progressData.motivationLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Performance Insights</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Learning Pattern</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You're maintaining a {progressData.consistencyScore >= 70 ? 'excellent' : progressData.consistencyScore >= 50 ? 'good' : 'developing'} consistency pattern.
                  {progressData.learningVelocity >= 3 ? ' Your learning velocity is above average!' : ' Focus on steady progress over speed.'}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎯 Strength Areas</h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {progressData.categoryProgress
                    .filter(cat => cat.percentage > 15)
                    .map(cat => cat.name)
                    .join(', ') || 'Building foundation across all topics'}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">🔥 Focus Areas</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {progressData.categoryProgress
                    .filter(cat => cat.percentage < 10)
                    .slice(0, 3)
                    .map(cat => cat.name)
                    .join(', ') || 'Continue building across all fundamentals'}
                </p>
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-sm p-6 text-white">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Keep Going! 🚀</h3>
              <p className="text-sm text-green-100 mb-4">
                You've solved {progressData.solvedProblems} problems so far. Every problem brings you closer to your goal!
              </p>
              <div className="text-xs text-green-100">
                "The expert in anything was once a beginner."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}