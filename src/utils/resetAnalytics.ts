/**
 * Utility to completely reset all analytics data to zero
 * Use this when you want to start fresh with no solved problems
 */

import RealisticProgressTracker from '../data/realisticProgressTracker';

export function resetAllAnalyticsToZero(): void {
  console.log('🔄 Resetting all analytics data to zero...');
  
  // 1. Clear all localStorage keys related to DSA tracker
  const keysToRemove = [
    // Problem tracking
    'dsa_solved_problems',
    'dsa_problem_statuses',
    'dsa_attempted_problems',
    
    // Progress tracking
    'dsa_user_sessions',
    'dsa_progress_metrics',
    
    // Gamified system
    'gamified_progress',
    'daily_challenges',
    
    // Progressive AI system
    'progressive_ai_progress',
    'progressive_learning_path',
    'progressive_recommendations',
    
    // Daily progress tracking
    ...Object.keys(localStorage).filter(key => key.startsWith('daily_progress_')),
    
    // Any other DSA-related keys
    ...Object.keys(localStorage).filter(key => 
      key.includes('dsa') || 
      key.includes('gamified') || 
      key.includes('progressive') ||
      key.includes('realistic')
    )
  ];
  
  // Remove all identified keys
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Removed: ${key}`);
    }
  });
  
  // 2. Initialize RealisticProgressTracker with zero progress
  RealisticProgressTracker.resetToZeroProgress();
  
  // 3. Trigger refresh events to update all components
  window.dispatchEvent(new CustomEvent('analyticsUpdated'));
  window.dispatchEvent(new CustomEvent('progressUpdated'));

  
  console.log('✨ All analytics data reset to zero!');
  console.log('🔄 Refresh the page to see the clean state.');
}

// Function to check current analytics state
export function checkAnalyticsState(): void {
  console.log('📊 Current Analytics State:');
  
  // Check solved problems
  const solvedProblems = localStorage.getItem('dsa_solved_problems');
  const solvedCount = solvedProblems ? JSON.parse(solvedProblems).length : 0;
  console.log(`Problems Solved: ${solvedCount}`);
  
  // Check sessions
  const sessions = localStorage.getItem('dsa_user_sessions');
  const sessionCount = sessions ? JSON.parse(sessions).length : 0;
  console.log(`User Sessions: ${sessionCount}`);
  
  // Check gamified progress
  const gamified = localStorage.getItem('gamified_progress');
  if (gamified) {
    const progress = JSON.parse(gamified);
    console.log(`Current Streak: ${progress.currentStreak || 0}`);
    console.log(`XP: ${progress.xp || 0}`);
    console.log(`Level: ${progress.level || 1}`);
  } else {
    console.log('No gamified progress found');
  }
  
  // Check progress metrics
  const metrics = RealisticProgressTracker.getProgressMetrics();
  console.log(`Calculated Solved Problems: ${metrics.solvedProblems}`);
  console.log(`Calculated Current Streak: ${metrics.currentStreak}`);
}

// Make functions available globally for browser console
declare global {
  interface Window {
    resetAllAnalyticsToZero: () => void;
    checkAnalyticsState: () => void;
  }
}

window.resetAllAnalyticsToZero = resetAllAnalyticsToZero;
window.checkAnalyticsState = checkAnalyticsState;
