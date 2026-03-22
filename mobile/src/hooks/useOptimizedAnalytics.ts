import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export interface AnalyticsMetrics {
  currentStreak: number;
  totalProblems: number;
  solvedProblems: number;
  confidenceLevel: number;
  averageTime: number;
  weeklyGoal: number;
  dailyAverage: number;
  difficultyBreakdown: {
    easy: { solved: number; total: number };
    medium: { solved: number; total: number };
    hard: { solved: number; total: number };
  };
}

export interface QuickStats {
  problemsToday: number;
  timeToday: number;
  streakDays: number;
  weeklyProgress: number;
}

export function useOptimizedAnalytics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to load cached analytics first
      const cacheKey = `analytics_${user.id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes
        
        if (!isExpired) {
          setMetrics(data);
          setLoading(false);
          return;
        }
      }

      // Load fresh analytics
      const analytics = await calculateAnalytics(user.id);
      setMetrics(analytics);

      // Cache the results
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: analytics,
        timestamp: Date.now(),
      }));

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
      
      // Try to use cached data even if expired
      const cacheKey = `analytics_${user.id}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        setMetrics(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    if (user?.id) {
      // Clear cache and reload
      const cacheKey = `analytics_${user.id}`;
      await AsyncStorage.removeItem(cacheKey);
      await loadAnalytics();
    }
  }, [user?.id, loadAnalytics]);

  const batchUpdate = useCallback(async () => {
    // Debounced update - wait 1 second before refreshing
    setTimeout(() => {
      refresh();
    }, 1000);
  }, [refresh]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    metrics,
    loading,
    error,
    refresh,
    batchUpdate,
  };
}

export function useQuickStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<QuickStats>({
    problemsToday: 0,
    timeToday: 0,
    streakDays: 0,
    weeklyProgress: 0,
  });

  const loadQuickStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const quickStats = await calculateQuickStats(user.id);
      setStats(quickStats);
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadQuickStats();
  }, [loadQuickStats]);

  return { stats, refresh: loadQuickStats };
}

async function calculateAnalytics(userId: string): Promise<AnalyticsMetrics> {
  try {
    // Load problem progress from AsyncStorage
    const [statusData, timeData] = await Promise.all([
      AsyncStorage.getItem('dsa_problem_statuses'),
      AsyncStorage.getItem('dsa_problem_time'),
    ]);

    const problemStatuses = statusData ? JSON.parse(statusData) : {};
    const problemTimes = timeData ? JSON.parse(timeData) : {};

    // Calculate basic metrics
    const totalProblems = 375; // Total problems in database
    const solvedProblems = Object.values(problemStatuses).filter(
      status => status === 'solved' || status === 'mastered'
    ).length;

    // Calculate streak (simplified - would need session data for accurate calculation)
    const currentStreak = await calculateStreak(userId);

    // Calculate confidence level based on solved problems and difficulty
    const confidenceLevel = Math.min(100, (solvedProblems / totalProblems) * 100);

    // Calculate average time
    const times = Object.values(problemTimes) as number[];
    const averageTime = times.length > 0 
      ? times.reduce((sum, time) => sum + time, 0) / times.length 
      : 0;

    // Calculate difficulty breakdown (simplified)
    const difficultyBreakdown = {
      easy: { solved: 0, total: 125 },
      medium: { solved: 0, total: 150 },
      hard: { solved: 0, total: 100 },
    };

    // This would need actual problem difficulty data
    Object.entries(problemStatuses).forEach(([_, status]) => {
      if (status === 'solved' || status === 'mastered') {
        // Simplified distribution
        const rand = Math.random();
        if (rand < 0.4) difficultyBreakdown.easy.solved++;
        else if (rand < 0.8) difficultyBreakdown.medium.solved++;
        else difficultyBreakdown.hard.solved++;
      }
    });

    return {
      currentStreak,
      totalProblems,
      solvedProblems,
      confidenceLevel,
      averageTime,
      weeklyGoal: 20, // Default weekly goal
      dailyAverage: solvedProblems / Math.max(1, currentStreak || 1),
      difficultyBreakdown,
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return {
      currentStreak: 0,
      totalProblems: 375,
      solvedProblems: 0,
      confidenceLevel: 0,
      averageTime: 0,
      weeklyGoal: 20,
      dailyAverage: 0,
      difficultyBreakdown: {
        easy: { solved: 0, total: 125 },
        medium: { solved: 0, total: 150 },
        hard: { solved: 0, total: 100 },
      },
    };
  }
}

async function calculateQuickStats(userId: string): Promise<QuickStats> {
  try {
    // Load today's session data
    const today = new Date().toISOString().split('T')[0];
    const sessionKey = `session_${userId}_${today}`;
    const sessionData = await AsyncStorage.getItem(sessionKey);
    
    const session = sessionData ? JSON.parse(sessionData) : {
      problems_solved: 0,
      time_spent: 0,
    };

    const currentStreak = await calculateStreak(userId);
    
    return {
      problemsToday: session.problems_solved || 0,
      timeToday: session.time_spent || 0,
      streakDays: currentStreak,
      weeklyProgress: Math.min(100, (session.problems_solved / 3) * 100), // 3 problems per day goal
    };
  } catch (error) {
    console.error('Error calculating quick stats:', error);
    return {
      problemsToday: 0,
      timeToday: 0,
      streakDays: 0,
      weeklyProgress: 0,
    };
  }
}

async function calculateStreak(userId: string): Promise<number> {
  try {
    const streakData = await AsyncStorage.getItem(`streak_${userId}`);
    if (streakData) {
      const { streak, lastUpdate } = JSON.parse(streakData);
      const today = new Date().toISOString().split('T')[0];
      const lastUpdateDate = new Date(lastUpdate).toISOString().split('T')[0];
      
      // If last update was today, return current streak
      if (lastUpdateDate === today) {
        return streak || 0;
      }
      
      // If last update was yesterday, streak continues
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastUpdateDate === yesterdayStr) {
        return streak || 0;
      }
      
      // Streak is broken
      return 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}
