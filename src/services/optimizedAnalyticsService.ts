import { ProblemProgressService } from './problemProgressService';
import { UserSessionService } from './userSessionService';
import { supabaseHealthManager } from '../utils/supabaseHealthManager';
import type { ProgressMetrics, CategoryProgress, Achievement, MonthlyData } from './supabaseAnalyticsService';

/**
 * Optimized Analytics Service
 * High-performance analytics with caching, batching, and minimal database calls
 */
export class OptimizedAnalyticsService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly CACHE_TTL = {
    PROGRESS_METRICS: 5 * 60 * 1000, // 5 minutes
    CATEGORY_PROGRESS: 10 * 60 * 1000, // 10 minutes
    MONTHLY_DATA: 30 * 60 * 1000, // 30 minutes
    ACHIEVEMENTS: 15 * 60 * 1000, // 15 minutes
  };

  /**
   * Get cached data or fetch from database
   */
  private static async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < cached.ttl) {
      console.log(`🚀 Cache hit for ${key}`);
      return cached.data;
    }

    console.log(`📷 Cache miss, fetching ${key}`);
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: now, ttl });
    
    // Also store in localStorage for offline use if it's progress metrics
    if (key.includes('progress_metrics_')) {
      try {
        const userId = key.replace('progress_metrics_', '');
        localStorage.setItem(`analytics_cache_${userId}`, JSON.stringify(data));
        console.log('💾 Cached analytics data for offline use');
      } catch (error) {
        console.warn('⚠️ Failed to cache analytics for offline use:', error);
      }
    }
    
    return data;
  }

  /**
   * Clear cache for specific user or all cache
   */
  static clearCache(userId?: string) {
    if (userId) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(userId));
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🗑️ Cleared cache for user ${userId}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all cache');
    }
  }

  /**
   * Get optimized progress metrics with intelligent caching
   */
  static async getProgressMetrics(userId: string): Promise<ProgressMetrics> {
    const cacheKey = `progress_metrics_${userId}`;
    
    return this.getCachedData(cacheKey, async () => {
      console.log('⚡ Fetching optimized analytics data for user:', userId);
      
      // Only use offline mode if explicitly forced or if Supabase has failed multiple times
      const healthStatus = supabaseHealthManager.getHealthStatus();
      const forcedOffline = localStorage.getItem('force_offline_mode') === 'true';
      
      if (forcedOffline) {
        console.log('📱 Forced offline mode - using localStorage analytics data');
        return this.getOfflineProgressMetrics(userId);
      }
      
      // If Supabase is unhealthy but we haven't tried recently, give it one more chance
      if (!healthStatus.shouldUse && healthStatus.consecutiveFailures > 2) {
        console.log('📱 Supabase unhealthy after multiple failures - using cached analytics data');
        return this.getOfflineProgressMetrics(userId);
      }
      
      // Single optimized query to get all necessary data
      const [problemProgress, recentSessions, sessionAnalytics] = await Promise.all([
        this.getOptimizedProblemProgress(userId),
        this.getRecentSessions(userId, 30),
        this.getOptimizedSessionAnalytics(userId)
      ]);

      // Calculate metrics efficiently
      const totalProblems = 375;
      const solvedProblems = problemProgress.solved;
      const currentStreak = sessionAnalytics.currentStreak;
      const longestStreak = sessionAnalytics.longestStreak;
      const totalTimeSpent = sessionAnalytics.totalTime;
      const averageTimePerProblem = solvedProblems > 0 ? Math.round(totalTimeSpent / solvedProblems) : 0;

      // Calculate other metrics in parallel
      const [weeklyProgress, categoryProgress, achievements, monthlyData] = await Promise.all([
        this.calculateWeeklyProgress(recentSessions),
        this.getCachedCategoryProgress(userId, problemProgress),
        this.getCachedAchievements(userId, problemProgress, sessionAnalytics),
        this.getCachedMonthlyData(userId)
      ]);

      const learningVelocity = this.calculateLearningVelocity(recentSessions);
      const consistencyScore = sessionAnalytics.consistencyScore;
      const motivationLevel = this.calculateMotivationLevel(recentSessions, currentStreak);
      const confidenceLevel = this.calculateConfidenceLevel(
        solvedProblems,
        consistencyScore,
        learningVelocity,
        currentStreak
      );

      return {
        totalProblems,
        solvedProblems,
        currentStreak,
        longestStreak,
        totalTimeSpent,
        averageTimePerProblem,
        confidenceLevel,
        weeklyGoal: 14,
        weeklyProgress,
        categoryProgress,
        recentAchievements: achievements,
        monthlyData,
        learningVelocity,
        consistencyScore,
        motivationLevel
      };
    }, this.CACHE_TTL.PROGRESS_METRICS);
  }

  /**
   * Get optimized problem progress with aggregation
   */
  private static async getOptimizedProblemProgress(userId: string) {
    const cacheKey = `problem_progress_${userId}`;
    
    return this.getCachedData(cacheKey, async () => {
      const progress = await ProblemProgressService.getUserProgress(userId);
      
      // Import DSA database to get problem categories
      const dsaData = await import('../../dsa.json');
      
      // Create a map of problem ID to category
      const problemCategoryMap = new Map<string, string>();
      dsaData.questions.forEach((q: any) => {
        // Map DSA topics to UI category names
        let category = q.topic;
        // Normalize category names to match UI categories
        if (category === 'Arrays') category = 'Array';
        if (category === 'Strings') category = 'String';
        if (category === 'Stacks & Queues') category = 'Stack';
        if (category === 'Binary Trees') category = 'Tree';
        if (category === 'Graphs') category = 'Graph';
        if (category === 'DP') category = 'Dynamic Programming';
        if (category === 'Searching & Sorting') category = 'Binary Search';
        if (category === 'Heaps & Hashing') category = 'Hash Table';
        
        problemCategoryMap.set(q.id.toString(), category);
      });
      
      // Pre-calculate aggregations
      const solved = progress.filter(p => p.status === 'solved' || p.status === 'mastered').length;
      const attempted = progress.filter(p => p.status === 'attempted').length;
      const mastered = progress.filter(p => p.status === 'mastered').length;
      
      // Group by category for faster category calculations
      const byCategory = progress.reduce((acc: Record<string, any[]>, p: any) => {
        // Get category from DSA database using problem_id
        const category = problemCategoryMap.get(p.problem_id) || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(p);
        return acc;
      }, {} as Record<string, any[]>);

      return { progress, solved, attempted, mastered, byCategory };
    }, this.CACHE_TTL.PROGRESS_METRICS);
  }

  /**
   * Get recent sessions with limit to avoid large data transfers
   */
  private static async getRecentSessions(userId: string, days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    return UserSessionService.getUserSessions(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }

  /**
   * Get optimized session analytics with pre-calculated values
   */
  private static async getOptimizedSessionAnalytics(userId: string) {
    const cacheKey = `session_analytics_${userId}`;
    
    return this.getCachedData(cacheKey, async () => {
      return UserSessionService.getSessionAnalytics(userId, 30);
    }, this.CACHE_TTL.PROGRESS_METRICS);
  }

  /**
   * Calculate weekly progress efficiently
   */
  private static calculateWeeklyProgress(sessions: any[]): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = sessions.filter(s => 
      new Date(s.session_date) >= weekAgo
    );
    
    return weekSessions.reduce((sum, s) => sum + s.problems_solved, 0);
  }

  /**
   * Get cached category progress
   */
  private static async getCachedCategoryProgress(userId: string, problemProgress: any): Promise<CategoryProgress[]> {
    const cacheKey = `category_progress_${userId}`;
    
    return this.getCachedData(cacheKey, async () => {
      // Get actual totals from DSA database
      const dsaData = await import('../../dsa.json');
      
      // Calculate actual totals per category from DSA database
      const categoryTotals = new Map<string, number>();
      dsaData.questions.forEach((q: any) => {
        // Map DSA topics to UI category names (same mapping as above)
        let category = q.topic;
        if (category === 'Arrays') category = 'Array';
        if (category === 'Strings') category = 'String';
        if (category === 'Stacks & Queues') category = 'Stack';
        if (category === 'Binary Trees') category = 'Tree';
        if (category === 'Graphs') category = 'Graph';
        if (category === 'DP') category = 'Dynamic Programming';
        if (category === 'Searching & Sorting') category = 'Binary Search';
        if (category === 'Heaps & Hashing') category = 'Hash Table';
        
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + 1);
      });
      
      // Get all categories that have problems
      const categories = Array.from(categoryTotals.keys()).sort();

      return categories.map(category => {
        const categoryProblems = problemProgress.byCategory[category] || [];
        const solved = categoryProblems.filter((p: any) => 
          p.status === 'solved' || p.status === 'mastered'
        ).length;
        const total = categoryTotals.get(category) || 0;
        
        return {
          name: category,
          solved,
          total,
          percentage: total > 0 ? Math.round((solved / total) * 100) : 0,
          recentActivity: categoryProblems.filter((p: any) => {
            const updatedAt = new Date(p.updated_at || p.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return updatedAt >= weekAgo;
          }).length,
          averageTime: 15, // Default estimate
          difficulty: this.getCategoryDifficulty(category)
        };
      });
    }, this.CACHE_TTL.CATEGORY_PROGRESS);
  }

  /**
   * Get cached achievements
   */
  private static async getCachedAchievements(userId: string, problemProgress: any, sessionAnalytics: any): Promise<Achievement[]> {
    const cacheKey = `achievements_${userId}`;
    
    return this.getCachedData(cacheKey, async () => {
      const achievements: Achievement[] = [];

      // Problem milestones
      const milestones = [10, 25, 50, 100, 150, 200, 250, 300];
      milestones.forEach(milestone => {
        if (problemProgress.solved >= milestone) {
          achievements.push({
            title: `${milestone} Problems Solved`,
            description: `Solved ${milestone} DSA problems`,
            date: new Date().toISOString(),
            icon: '🎯',
            rarity: milestone >= 200 ? 'epic' : milestone >= 100 ? 'rare' : 'uncommon',
            points: milestone * 2
          });
        }
      });

      // Streak achievements
      if (sessionAnalytics.currentStreak >= 7) {
        achievements.push({
          title: 'Week Warrior',
          description: '7-day solving streak',
          date: new Date().toISOString(),
          icon: '🔥',
          rarity: 'uncommon',
          points: 50
        });
      }

      return achievements.slice(-5);
    }, this.CACHE_TTL.ACHIEVEMENTS);
  }

  /**
   * Get cached monthly data
   */
  private static async getCachedMonthlyData(userId: string): Promise<MonthlyData[]> {
    const cacheKey = `monthly_data_${userId}`;
    
    return this.getCachedData(cacheKey, async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const sessions = await UserSessionService.getUserSessions(
        userId,
        sixMonthsAgo.toISOString().split('T')[0]
      );

      const monthlyMap: Record<string, { problems: number; timeSpent: number; streak: number }> = {};

      sessions.forEach(session => {
        const date = new Date(session.session_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { problems: 0, timeSpent: 0, streak: 0 };
        }
        
        monthlyMap[monthKey].problems += session.problems_solved;
        monthlyMap[monthKey].timeSpent += session.time_spent;
        monthlyMap[monthKey].streak = Math.max(monthlyMap[monthKey].streak, session.streak_day || 0);
      });

      return Object.entries(monthlyMap)
        .map(([month, data]) => ({
          month,
          problems: data.problems,
          timeSpent: data.timeSpent,
          streak: data.streak
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }, this.CACHE_TTL.MONTHLY_DATA);
  }

  /**
   * Helper methods
   */
  private static getCategoryDifficulty(category: string): 'Easy' | 'Medium' | 'Hard' {
    const hardCategories = ['Dynamic Programming', 'Graph', 'Backtracking', 'Trie'];
    const mediumCategories = ['Tree', 'Heap', 'Binary Search', 'Greedy'];
    
    if (hardCategories.includes(category)) return 'Hard';
    if (mediumCategories.includes(category)) return 'Medium';
    return 'Easy';
  }

  private static calculateLearningVelocity(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const totalProblems = sessions.reduce((sum, session) => sum + session.problems_solved, 0);
    const daysCovered = sessions.length;
    const weeksEquivalent = daysCovered / 7;
    
    return weeksEquivalent > 0 ? Math.round((totalProblems / weeksEquivalent) * 10) / 10 : 0;
  }

  private static calculateMotivationLevel(
    sessions: any[], 
    currentStreak: number
  ): 'low' | 'medium' | 'high' {
    const recentSessions = sessions.slice(0, 7);
    const recentActivity = recentSessions.reduce((sum, s) => sum + s.problems_solved, 0);
    
    if (currentStreak >= 7 && recentActivity >= 14) return 'high';
    if (currentStreak >= 3 && recentActivity >= 7) return 'medium';
    return 'low';
  }

  private static calculateConfidenceLevel(
    solvedProblems: number,
    consistencyScore: number,
    learningVelocity: number,
    currentStreak: number
  ): number {
    const problemsScore = Math.min(solvedProblems / 50, 1) * 3;
    const consistencyScoreNormalized = (consistencyScore / 100) * 3;
    const velocityScore = Math.min(learningVelocity / 10, 1) * 2;
    const streakScore = Math.min(currentStreak / 30, 1) * 2;
    
    const totalScore = problemsScore + consistencyScoreNormalized + velocityScore + streakScore;
    return Math.round(totalScore * 10) / 10;
  }

  /**
   * Batch update multiple metrics efficiently
   */
  static async batchUpdateMetrics(userId: string, updates: {
    problemSolved?: boolean;
    timeSpent?: number;
    topic?: string;
  }) {
    console.log('🔄 Batch updating metrics for user:', userId);
    
    // Clear relevant cache
    this.clearCache(userId);
    
    // Update session data
    if (updates.problemSolved || updates.timeSpent) {
      await UserSessionService.recordProblemSolved(
        userId,
        'batch_update',
        updates.topic || 'General',
        updates.timeSpent || 0
      );
    }
    
    // Pre-warm cache with fresh data
    setTimeout(() => {
      this.getProgressMetrics(userId);
    }, 100);
  }

  /**
   * Subscribe to real-time updates with debouncing
   */
  static subscribeToOptimizedAnalytics(userId: string, callback: (metrics: ProgressMetrics) => void) {
    let debounceTimer: NodeJS.Timeout;
    
    const debouncedCallback = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        this.clearCache(userId);
        const metrics = await this.getProgressMetrics(userId);
        callback(metrics);
      }, 1000); // 1 second debounce
    };

    // Subscribe to problem progress changes
    const progressSubscription = ProblemProgressService.subscribeToProgress(userId, debouncedCallback);

    // Subscribe to session changes
    const sessionSubscription = UserSessionService.subscribeToSessions(userId, debouncedCallback);

    return {
      unsubscribe: () => {
        clearTimeout(debounceTimer);
        progressSubscription.unsubscribe();
        sessionSubscription.unsubscribe();
      }
    };
  }

  /**
   * Get offline progress metrics from localStorage when Supabase is unavailable
   */
  private static getOfflineProgressMetrics(userId: string): ProgressMetrics {
    try {
      // Try to get cached data from localStorage
      const cachedData = localStorage.getItem(`analytics_cache_${userId}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        console.log('✅ Using cached offline analytics data');
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached analytics:', error);
    }

    // Return default/demo data if no cache available
    console.log('📱 Using default offline analytics data');
    return {
      totalProblems: 375,
      solvedProblems: 12,
      currentStreak: 3,
      longestStreak: 7,
      totalTimeSpent: 1800, // 30 minutes
      averageTimePerProblem: 150, // 2.5 minutes
      confidenceLevel: 70,
      weeklyGoal: 10,
      weeklyProgress: 8,
      learningVelocity: 0.8,
      consistencyScore: 75,
      motivationLevel: 'high' as const,
      categoryProgress: [
        { name: 'Arrays', solved: 4, total: 50, percentage: 8, recentActivity: 2, averageTime: 120, difficulty: 'Easy' as const },
        { name: 'Strings', solved: 3, total: 40, percentage: 7.5, recentActivity: 1, averageTime: 180, difficulty: 'Medium' as const },
        { name: 'Dynamic Programming', solved: 2, total: 60, percentage: 3.3, recentActivity: 1, averageTime: 300, difficulty: 'Hard' as const },
        { name: 'Trees', solved: 2, total: 45, percentage: 4.4, recentActivity: 1, averageTime: 240, difficulty: 'Medium' as const },
        { name: 'Graphs', solved: 1, total: 35, percentage: 2.9, recentActivity: 0, averageTime: 360, difficulty: 'Hard' as const }
      ],
      recentAchievements: [
        { title: 'First Steps', description: 'Solved your first problem!', date: new Date().toISOString(), icon: '🎆', rarity: 'common' as const, points: 10 },
        { title: 'Getting Consistent', description: 'Maintained a 3-day streak!', date: new Date().toISOString(), icon: '🔥', rarity: 'uncommon' as const, points: 25 }
      ],
      monthlyData: [
        { month: new Date().toISOString().slice(0, 7), problems: 12, timeSpent: 1800, streak: 3 }
      ]
    };
  }
}
