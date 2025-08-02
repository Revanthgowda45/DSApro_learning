import RealisticProgressTracker from '../data/realisticProgressTracker';
import { markProblemCompleted } from '../data/gamifiedAICoach';
import { 
  loadProgressiveProgress, 
  saveProgressiveProgress, 
  markProgressiveProblemSolved 
} from '../data/progressiveAIRecommender';
import { ProblemProgressService } from '../services/problemProgressService';
import { supabase } from '../lib/supabase';

/**
 * Centralized analytics updater that synchronizes all analytics systems
 * when a problem status changes
 */
export interface ProblemStatusUpdate {
  problemId: string;
  newStatus: 'not-started' | 'attempted' | 'solved' | 'mastered';
  userId?: string; // Will be automatically retrieved from auth context
  timeSpent?: number; // in minutes
  difficulty?: string;
  category?: string;
}

/**
 * Get current user ID from Supabase auth context
 * Get current user ID from Supabase auth
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Updates all analytics systems when a problem status changes
 */
export async function updateAllAnalytics(update: ProblemStatusUpdate): Promise<void> {
  const { problemId, newStatus, timeSpent = 0, difficulty = 'Medium', category = 'General' } = update;
  
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    
    if (newStatus === 'not-started') {
      // Handle status reset - delete from Supabase and clean up local storage
      console.log(`Resetting problem ${problemId} to not-started status`);
      
      // 1. Delete from Supabase Database (if user is authenticated)
      if (userId) {
        try {
          await ProblemProgressService.deleteProblemProgress(userId, problemId);
          console.log(`Successfully deleted Supabase entry for problem ${problemId}`);
        } catch (supabaseError) {
          console.error('Error deleting from Supabase:', supabaseError);
        }
      }
      
      // 2. Clean up local storage
      cleanupLocalProblemData(problemId);
      
      // 3. Update problem status tracking
      updateLocalProblemTracking(problemId, newStatus);
      
      // 4. Trigger UI refresh events
      triggerAnalyticsRefresh();
      
      console.log(`Successfully reset problem ${problemId} to not-started`);
      
    } else if (newStatus === 'solved' || newStatus === 'mastered') {
      console.log(`Updating all analytics for problem ${problemId} with status: ${newStatus}`);
      
      // 1. Update Supabase Database (if user is authenticated)
      if (userId) {
        try {
          await ProblemProgressService.updateProblemStatus(userId, problemId, {
            status: newStatus,
            time_spent: timeSpent * 60, // Convert minutes to seconds for Supabase
            solved_at: new Date().toISOString(),
            attempts: 1
          });
          console.log(`Successfully updated Supabase for problem ${problemId}`);
        } catch (supabaseError) {
          console.error('Error updating Supabase:', supabaseError);
          // Continue with other updates even if Supabase fails
        }
      } else {
        console.log('No authenticated user - skipping Supabase update');
      }
      
      // 2. Update Gamified AI Coach System
      markProblemCompleted(problemId);
      
      // 3. Update Progressive AI Recommender System
      const currentProgress = loadProgressiveProgress();
      const updatedProgress = markProgressiveProblemSolved(problemId, currentProgress);
      saveProgressiveProgress(updatedProgress);
      
      // 4. Update Realistic Progress Tracker
      RealisticProgressTracker.recordSession(
        1, // problems solved
        timeSpent, // time spent in minutes
        [category], // topics array
        difficulty as 'Easy' | 'Medium' | 'Hard' | 'Very Hard'
      );
      
      // 5. Update local problem tracking
      updateLocalProblemTracking(problemId, newStatus);
      
      // 6. Trigger UI refresh events
      triggerAnalyticsRefresh();
      
      console.log(`Successfully updated all analytics for problem ${problemId}`);
      
    } else if (newStatus === 'attempted') {
      // For attempted problems, update Supabase and attempt tracking
      if (userId) {
        try {
          await ProblemProgressService.updateProblemStatus(userId, problemId, {
            status: newStatus,
            attempts: 1
          });
          console.log(`Successfully updated Supabase attempt for problem ${problemId}`);
        } catch (supabaseError) {
          console.error('Error updating Supabase attempt:', supabaseError);
        }
      }
      updateAttemptedProblems(problemId);
      updateLocalProblemTracking(problemId, newStatus);
      triggerAnalyticsRefresh();
    }
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

/**
 * Cleans up local problem data when resetting to not-started
 */
function cleanupLocalProblemData(problemId: string): void {
  try {
    // Remove from solved problems list
    const solvedKey = 'dsa_solved_problems';
    const existingSolved = localStorage.getItem(solvedKey);
    if (existingSolved) {
      let solvedProblems: string[] = JSON.parse(existingSolved);
      solvedProblems = solvedProblems.filter(id => id !== problemId);
      localStorage.setItem(solvedKey, JSON.stringify(solvedProblems));
    }
    
    // Remove from attempted problems list
    const attemptedKey = 'dsa_attempted_problems';
    const existingAttempted = localStorage.getItem(attemptedKey);
    if (existingAttempted) {
      let attemptedProblems: string[] = JSON.parse(existingAttempted);
      attemptedProblems = attemptedProblems.filter(id => id !== problemId);
      localStorage.setItem(attemptedKey, JSON.stringify(attemptedProblems));
    }
    
    console.log(`Cleaned up local data for problem ${problemId}`);
  } catch (error) {
    console.error('Error cleaning up local problem data:', error);
  }
}

/**
 * Updates local problem tracking in localStorage
 */
function updateLocalProblemTracking(problemId: string, status: string): void {
  try {
    const key = 'dsa_solved_problems';
    const existing = localStorage.getItem(key);
    let solvedProblems: string[] = existing ? JSON.parse(existing) : [];
    
    if (status === 'solved' || status === 'mastered') {
      if (!solvedProblems.includes(problemId)) {
        solvedProblems.push(problemId);
        localStorage.setItem(key, JSON.stringify(solvedProblems));
      }
    }
    
    // Update problem status tracking
    const statusKey = 'dsa_problem_statuses';
    const existingStatuses = localStorage.getItem(statusKey);
    let problemStatuses: Record<string, string> = existingStatuses ? JSON.parse(existingStatuses) : {};
    
    problemStatuses[problemId] = status;
    localStorage.setItem(statusKey, JSON.stringify(problemStatuses));
    
  } catch (error) {
    console.error('Error updating local problem tracking:', error);
  }
}

/**
 * Updates attempted problems tracking
 */
function updateAttemptedProblems(problemId: string): void {
  try {
    const key = 'dsa_attempted_problems';
    const existing = localStorage.getItem(key);
    let attemptedProblems: string[] = existing ? JSON.parse(existing) : [];
    
    if (!attemptedProblems.includes(problemId)) {
      attemptedProblems.push(problemId);
      localStorage.setItem(key, JSON.stringify(attemptedProblems));
    }
  } catch (error) {
    console.error('Error updating attempted problems:', error);
  }
}

/**
 * Triggers analytics refresh events for components to update
 */
function triggerAnalyticsRefresh(): void {
  // Dispatch custom events to notify components to refresh
  window.dispatchEvent(new CustomEvent('analyticsUpdated'));
  window.dispatchEvent(new CustomEvent('progressUpdated'));

}

/**
 * Gets current problem status from localStorage
 */
export function getProblemStatus(problemId: string): string {
  try {
    const statusKey = 'dsa_problem_statuses';
    const existingStatuses = localStorage.getItem(statusKey);
    const problemStatuses: Record<string, string> = existingStatuses ? JSON.parse(existingStatuses) : {};
    
    return problemStatuses[problemId] || 'not-started';
  } catch (error) {
    console.error('Error getting problem status:', error);
    return 'not-started';
  }
}

/**
 * Gets all solved problems from localStorage
 */
export function getAllSolvedProblems(): string[] {
  try {
    const key = 'dsa_solved_problems';
    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Error getting solved problems:', error);
    return [];
  }
}

/**
 * Gets analytics summary across all systems
 */
// Test function to verify analytics updater
export async function testAnalyticsUpdate(problemId: string = '1', userId: string = 'test-user') {
  console.log(`[Test] Testing analytics update for problem ${problemId}`);
  await updateAllAnalytics({
    problemId,
    newStatus: 'solved',
    userId,
    difficulty: 'Easy',
    category: 'Arrays'
  });
  console.log(`[Test] Analytics update completed for problem ${problemId}`);
}

export function getAnalyticsSummary() {
  try {
    const solvedProblems = getAllSolvedProblems();
    const totalSolved = solvedProblems.length;
    
    // Get streak from gamified system
    const gamifiedProgress = localStorage.getItem('gamified_progress');
    let currentStreak = 0;
    if (gamifiedProgress) {
      const progress = JSON.parse(gamifiedProgress);
      currentStreak = progress.currentStreak || 0;
    }
    
    // Get today's progress
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `daily_progress_${today}`;
    const todayProgress = localStorage.getItem(todayKey);
    let todaySolved = 0;
    if (todayProgress) {
      const progress = JSON.parse(todayProgress);
      todaySolved = progress.problemsSolved || 0;
    }
    
    return {
      totalSolved,
      currentStreak,
      todaySolved,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    return {
      totalSolved: 0,
      currentStreak: 0,
      todaySolved: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}
