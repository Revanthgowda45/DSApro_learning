import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

import { 
  Target,
  Clock, 
  Flame,
  Star
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import SupabaseProgressiveRecommendations from '../components/dashboard/SupabaseProgressiveRecommendations';

import DailyChallenge from '../components/dashboard/DailyChallenge';
import { UserSessionService } from '../services/userSessionService';
import { useAnalyticsRefresh } from '../hooks/useAnalyticsRefresh';
import { useOptimizedAnalytics, useQuickStats } from '../hooks/useOptimizedAnalytics';
import { useNotifications } from '../hooks/useNotifications';

export default function Dashboard() {
  const { user } = useAuth();

  const [todayStats, setTodayStats] = useState({
    problemsSolved: 0,
    timeSpent: 0,
    confidenceGained: 0
  });
  const { metrics: progressMetrics, loading, error, refresh } = useOptimizedAnalytics();
  const { stats: quickStats } = useQuickStats();
  const { checkDailyNotifications } = useNotifications();
  
  // Debug logging to understand what's happening
  console.log('🔍 Dashboard Debug:', {
    user: user?.id,
    loading,
    error,
    progressMetrics: progressMetrics ? 'available' : 'null',
    quickStats: quickStats ? 'available' : 'null',
    todayStats
  });

  // Listen for analytics updates
  const refreshTrigger = useAnalyticsRefresh();

  // Load real analytics data from Supabase
  const loadRealAnalytics = async () => {
    if (!user?.id) {
      return;
    }

    try {
      console.log('📊 Loading Dashboard analytics from Supabase for user:', user.id);
      
      // Get today's session data from Supabase
      const todaySession = await UserSessionService.getTodaySession(user.id);
      
      const todayProblems = todaySession?.problems_solved || 0;
      const todayTime = todaySession?.time_spent || 0;
      
      // Calculate confidence gained today (simplified)
      const confidenceGained = todayProblems > 0 ? Math.min(todayProblems * 2, 5) : 0;
      
      setTodayStats({
        problemsSolved: todayProblems,
        timeSpent: todayTime,
        confidenceGained
      });
      
      console.log('✅ Dashboard analytics loaded:', { todayStats: { todayProblems, todayTime, confidenceGained } });
      
    } catch (error) {
      console.error('❌ Error loading dashboard analytics:', error);
    }
  };

  // Load analytics on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 User detected, loading analytics for:', user.id);
      loadRealAnalytics();
      
      // Check for daily notifications after a delay
      const notificationTimer = setTimeout(() => {
        checkDailyNotifications();
      }, 2000);
      
      return () => clearTimeout(notificationTimer);
    }
  }, [user?.id, checkDailyNotifications]);

  // Additional effect to handle page reload scenarios
  useEffect(() => {
    // Small delay to ensure user is fully restored from localStorage
    const timer = setTimeout(() => {
      if (user?.id && todayStats.problemsSolved === 0) {
        console.log('🔄 Page reload detected, re-fetching data for:', user.id);
        loadRealAnalytics();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);
  
  // Refresh when analytics are updated
  useEffect(() => {
    if (refreshTrigger > 0 && user?.id) {
      console.log('🔄 Dashboard refresh triggered, updating all analytics...');
      loadRealAnalytics();
      refresh(); // Also refresh optimized analytics
    }
  }, [refreshTrigger, user?.id, refresh]);

  // Listen for learning preferences updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      console.log('📊 Learning preferences updated, refreshing dashboard...');
      // Force a re-render to show updated time limit
      if (user?.id) {
        loadRealAnalytics();
      }
    };

    window.addEventListener('learningPreferencesUpdated', handlePreferencesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('learningPreferencesUpdated', handlePreferencesUpdate as EventListener);
    };
  }, [user?.id]);

  // Show loading only if we have no data at all and are still loading
  const shouldShowLoading = loading && !progressMetrics && !quickStats;
  
  if (shouldShowLoading) {
    console.log('🔄 Dashboard: Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={refresh}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use fallback data if main data is not available
  const displayMetrics = progressMetrics || {
    currentStreak: 0,
    solvedProblems: 0,
    confidenceLevel: 0
  };
  
  console.log('📊 Dashboard: Rendering with data:', {
    displayMetrics,
    todayStats,
    hasProgressMetrics: !!progressMetrics,
    hasQuickStats: !!quickStats
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome back, {user?.full_name || 'Student'}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ready to continue your DSA journey? You're doing great!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Current Streak"
          value={`${displayMetrics.currentStreak} days`}
          icon={Flame}
          color="text-orange-600"
          bgColor="bg-orange-100"
          trend={displayMetrics.currentStreak > 0 ? `${displayMetrics.currentStreak > 1 ? '+1 from yesterday' : 'Started today!'}` : 'Start your streak today!'}
        />
        <StatsCard
          title="Problems Solved"
          value={displayMetrics.solvedProblems.toString()}
          icon={Target}
          color="text-green-600"
          bgColor="bg-green-100"
          trend={`${todayStats.problemsSolved} today`}
        />
        <StatsCard
          title="Time Today"
          value={`${todayStats.timeSpent}/${user?.daily_time_limit || 120}min`}
          icon={Clock}
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={`${Math.round((todayStats.timeSpent / (user?.daily_time_limit || 120)) * 100)}% of goal`}
        />
        <StatsCard
          title="Confidence Level"
          value={`${Math.round(displayMetrics.confidenceLevel)}/10`}
          icon={Star}
          color="text-purple-600"
          bgColor="bg-purple-100"
          trend={todayStats.confidenceGained > 0 ? `+${todayStats.confidenceGained} today` : 'Solve problems to gain confidence'}
        />
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Recommendations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <span>🤖 Smart Recommendations</span>
            </h2>
            <SupabaseProgressiveRecommendations />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">


          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">📊 Quick Stats</h2>
              <Star className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Problems Solved</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{progressMetrics?.solvedProblems || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Current Level</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {progressMetrics?.solvedProblems ? 
                    progressMetrics.solvedProblems < 10 ? 'Beginner' :
                    progressMetrics.solvedProblems < 30 ? 'Intermediate' :
                    progressMetrics.solvedProblems < 60 ? 'Advanced' : 'Expert'
                    : 'Beginner'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Learning Velocity</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{Math.round(progressMetrics?.learningVelocity || 0)} problems/week</span>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-xl shadow-sm p-6 text-white">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                "Consistency is the key to mastery! 🚀"
              </p>
              <p className="text-purple-100 dark:text-purple-200 text-sm">
                Keep solving, keep growing! 💪
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenge - Moved to Bottom */}
      <div className="mt-8">
        <DailyChallenge disabled={true} />
      </div>
    </div>
  );
}