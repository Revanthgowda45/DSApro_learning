import RealisticProgressTracker from '../data/realisticProgressTracker';

// Reset progress to zero (for new users who want to start fresh)
export const resetProgressToZero = () => {
  RealisticProgressTracker.resetToZeroProgress();
  console.log('✅ Progress reset to zero. Refresh the page to see changes.');
  return true;
};

// Generate sample data (for demo purposes)
export const generateSampleData = () => {
  RealisticProgressTracker.resetAndGenerateRealisticData();
  console.log('✅ Sample data generated. Refresh the page to see changes.');
  return true;
};

// Check current progress
export const checkCurrentProgress = () => {
  const sessions = RealisticProgressTracker.getUserSessions();
  const metrics = RealisticProgressTracker.getProgressMetrics();
  
  console.log('📊 Current Progress:');
  console.log(`- Total sessions: ${sessions.length}`);
  console.log(`- Problems solved: ${metrics.solvedProblems}`);
  console.log(`- Current streak: ${metrics.currentStreak} days`);
  console.log(`- Total time: ${Math.round(metrics.totalTimeSpent / 60)}h ${metrics.totalTimeSpent % 60}m`);
  
  return {
    sessions: sessions.length,
    problemsSolved: metrics.solvedProblems,
    currentStreak: metrics.currentStreak,
    totalTime: metrics.totalTimeSpent
  };
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).resetProgressToZero = resetProgressToZero;
  (window as any).generateSampleData = generateSampleData;
  (window as any).checkCurrentProgress = checkCurrentProgress;
}
