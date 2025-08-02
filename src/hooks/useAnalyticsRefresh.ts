import { useEffect, useState } from 'react';

/**
 * Hook to listen for analytics updates and trigger component refreshes
 */
export function useAnalyticsRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleAnalyticsUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    const handleProgressUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    const handleStreakUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Listen for analytics update events
    window.addEventListener('analyticsUpdated', handleAnalyticsUpdate);
    window.addEventListener('progressUpdated', handleProgressUpdate);
    window.addEventListener('streakUpdated', handleStreakUpdate);

    return () => {
      window.removeEventListener('analyticsUpdated', handleAnalyticsUpdate);
      window.removeEventListener('progressUpdated', handleProgressUpdate);
      window.removeEventListener('streakUpdated', handleStreakUpdate);
    };
  }, []);

  return refreshTrigger;
}

/**
 * Hook specifically for components that need to refresh when problems are solved
 */
export function useProblemSolvedRefresh(callback?: () => void) {
  const refreshTrigger = useAnalyticsRefresh();

  useEffect(() => {
    if (refreshTrigger > 0 && callback) {
      callback();
    }
  }, [refreshTrigger, callback]);

  return refreshTrigger;
}
