import { useState, useEffect, useCallback, useRef } from 'react';
import { OptimizedAnalyticsService } from '../services/optimizedAnalyticsService';

import { useAuth } from '../context/AuthContext';
import type { ProgressMetrics } from '../services/supabaseAnalyticsService';

/**
 * Optimized analytics hook with intelligent caching and performance optimizations
 */
export function useOptimizedAnalytics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const loadingRef = useRef(false);

  // Optimized load function with deduplication
  const loadMetrics = useCallback(async (force = false) => {
    if (!user?.id || (loadingRef.current && !force)) return;
    
    try {
      loadingRef.current = true;
      setError(null);
      
      console.log('🚀 Loading optimized analytics...');
      const startTime = performance.now();
      
      const data = await OptimizedAnalyticsService.getProgressMetrics(user.id);
      
      const endTime = performance.now();
      console.log(`⚡ Analytics loaded in ${Math.round(endTime - startTime)}ms`);
      
      setMetrics(data);
    } catch (err) {
      console.error('❌ Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  // Batch update function for efficient updates
  const batchUpdate = useCallback(async (updates: {
    problemSolved?: boolean;
    timeSpent?: number;
    topic?: string;
  }) => {
    if (!user?.id) return;
    
    try {
      await OptimizedAnalyticsService.batchUpdateMetrics(user.id, updates);
      // Metrics will be updated via subscription
    } catch (err) {
      console.error('❌ Error in batch update:', err);
      setError(err instanceof Error ? err.message : 'Failed to update metrics');
    }
  }, [user?.id]);

  // Force refresh function
  const refresh = useCallback(() => {
    if (user?.id) {
      OptimizedAnalyticsService.clearCache(user.id);
      loadMetrics(true);
    }
  }, [user?.id, loadMetrics]);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (user?.id) {
      OptimizedAnalyticsService.clearCache(user.id);
    }
  }, [user?.id]);

  // Initial load and subscription setup
  useEffect(() => {
    if (!user?.id) {
      // Don't set loading to false immediately - user might be loading from auth
      // Only set loading to false if we're sure there's no user
      const timer = setTimeout(() => {
        if (!user?.id) {
          console.log('📱 No user found for analytics, stopping loading');
          setLoading(false);
        }
      }, 100); // Small delay to allow auth to complete
      
      return () => clearTimeout(timer);
    }

    console.log('🔄 Setting up analytics for user:', user.id);
    // Load initial data
    loadMetrics();

    // Set up real-time subscription with debouncing
    subscriptionRef.current = OptimizedAnalyticsService.subscribeToOptimizedAnalytics(
      user.id,
      (updatedMetrics) => {
        console.log('📡 Real-time analytics update received');
        setMetrics(updatedMetrics);
        setLoading(false);
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, loadMetrics]);

  // Additional effect to handle page reload scenarios
  useEffect(() => {
    if (user?.id && !metrics && !loading) {
      console.log('🔄 Page reload detected in analytics, re-loading data');
      const timer = setTimeout(() => {
        loadMetrics(true); // Force reload
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user, metrics, loading, loadMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    metrics,
    loading,
    error,
    refresh,
    batchUpdate,
    clearCache,
    isOptimized: true
  };
}

/**
 * Lightweight hook for specific metric subsets
 */
export function useQuickStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    solvedProblems: number;
    currentStreak: number;
    weeklyProgress: number;
    totalTimeSpent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      // Don't set loading to false immediately - user might be loading from auth
      const timer = setTimeout(() => {
        if (!user?.id) {
          console.log('📱 No user found for quick stats, stopping loading');
          setLoading(false);
        }
      }, 100); // Small delay to allow auth to complete
      
      return () => clearTimeout(timer);
    }

    const loadQuickStats = async () => {
      try {
        // Use cached data if available, otherwise fetch minimal required data
        const metrics = await OptimizedAnalyticsService.getProgressMetrics(user.id);
        
        setStats({
          solvedProblems: metrics.solvedProblems,
          currentStreak: metrics.currentStreak,
          weeklyProgress: metrics.weeklyProgress,
          totalTimeSpent: metrics.totalTimeSpent
        });
      } catch (err) {
        console.error('❌ Error loading quick stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuickStats();
  }, [user?.id]);

  return { stats, loading };
}


