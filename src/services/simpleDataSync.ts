import { supabase } from '../lib/supabase';
import { ProblemProgressService } from './problemProgressService';
import { UserSessionService } from './userSessionService';

/**
 * Simple Data Synchronization Service
 * Handles syncing data between Supabase and localStorage on login
 */
export class SimpleDataSync {
  
  /**
   * Main sync function - called when user logs in
   */
  static async syncOnLogin(userId: string): Promise<void> {
    console.log('🔄 Starting data sync for user:', userId);
    
    try {
      // 1. Sync Problem Progress from Supabase to localStorage
      await this.syncProblemProgress(userId);
      
      // 2. Sync User Sessions from Supabase to localStorage  
      await this.syncUserSessions(userId);
      
      // 3. Trigger UI refresh
      this.triggerRefresh();
      
      console.log('✅ Data sync completed successfully');
      
    } catch (error) {
      console.error('❌ Data sync failed:', error);
      // Don't throw - let user continue with local data
    }
  }

  /**
   * Sync problem progress from Supabase to localStorage
   */
  private static async syncProblemProgress(userId: string): Promise<void> {
    try {
      console.log('📊 Syncing problem progress...');
      
      const supabaseProgress = await ProblemProgressService.getUserProgress(userId);
      
      if (supabaseProgress.length === 0) {
        console.log('No problem progress found in Supabase');
        return;
      }
      
      // Convert to localStorage format
      const problemStatuses: Record<string, string> = {};
      const solvedProblems: string[] = [];
      const attemptedProblems: string[] = [];
      
      supabaseProgress.forEach(progress => {
        problemStatuses[progress.problem_id] = progress.status;
        
        if (progress.status === 'solved' || progress.status === 'mastered') {
          solvedProblems.push(progress.problem_id);
        } else if (progress.status === 'attempted') {
          attemptedProblems.push(progress.problem_id);
        }
      });
      
      // Update localStorage
      localStorage.setItem('dsa_problem_statuses', JSON.stringify(problemStatuses));
      localStorage.setItem('dsa_solved_problems', JSON.stringify(solvedProblems));
      localStorage.setItem('dsa_attempted_problems', JSON.stringify(attemptedProblems));
      
      console.log(`✅ Synced ${supabaseProgress.length} problems (${solvedProblems.length} solved)`);
      
    } catch (error) {
      console.error('Error syncing problem progress:', error);
    }
  }

  /**
   * Sync user sessions from Supabase to localStorage
   */
  private static async syncUserSessions(userId: string): Promise<void> {
    try {
      console.log('📅 Syncing user sessions...');
      
      // Get last 30 days of sessions
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const supabaseSessions = await UserSessionService.getUserSessions(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      if (supabaseSessions.length === 0) {
        console.log('No user sessions found in Supabase');
        return;
      }
      
      // Convert to localStorage format
      const localSessions = supabaseSessions.map(session => ({
        date: session.session_date,
        problemsSolved: session.problems_solved,
        timeSpent: session.time_spent,
        topicsCovered: session.topics_covered || [],
        streakDay: session.streak_day || 0
      }));
      
      // Update localStorage
      localStorage.setItem('userSessions', JSON.stringify(localSessions));
      
      console.log(`✅ Synced ${supabaseSessions.length} user sessions`);
      
    } catch (error) {
      console.error('Error syncing user sessions:', error);
    }
  }

  /**
   * Trigger UI refresh events
   */
  private static triggerRefresh(): void {
    // Dispatch events to refresh all components
    window.dispatchEvent(new CustomEvent('dataSyncCompleted'));
    window.dispatchEvent(new CustomEvent('analyticsUpdated'));
    window.dispatchEvent(new CustomEvent('progressUpdated'));
    window.dispatchEvent(new CustomEvent('streakUpdated'));
  }

  /**
   * Check if user has local data
   */
  static hasLocalData(): boolean {
    const problemStatuses = localStorage.getItem('dsa_problem_statuses');
    const userSessions = localStorage.getItem('userSessions');
    return !!(problemStatuses || userSessions);
  }

  /**
   * Migrate local data to Supabase (for new users with existing local data)
   */
  static async migrateLocalToSupabase(userId: string): Promise<void> {
    console.log('🔄 Migrating local data to Supabase...');
    
    // Check if Supabase is available
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - cannot migrate local data');
      return;
    }
    
    try {
      // Migrate problem statuses
      const problemStatuses = localStorage.getItem('dsa_problem_statuses');
      if (problemStatuses) {
        const statuses = JSON.parse(problemStatuses);
        const progressData = Object.entries(statuses).map(([problemId, status]) => ({
          user_id: userId,
          problem_id: problemId,
          status: status as string,
          solved_at: (status === 'solved' || status === 'mastered') ? new Date().toISOString() : null
        }));

        const { error } = await supabase
          .from('problem_progress')
          .upsert(progressData, { onConflict: 'user_id,problem_id' });

        if (error) throw error;
        console.log(`📊 Migrated ${progressData.length} problem statuses`);
      }

      // Migrate user sessions
      const userSessions = localStorage.getItem('userSessions');
      if (userSessions) {
        const sessions = JSON.parse(userSessions);
        const sessionData = sessions.map((session: any) => ({
          user_id: userId,
          session_date: session.date,
          problems_solved: session.problemsSolved,
          time_spent: session.timeSpent,
          topics_covered: session.topicsCovered || [],
          streak_day: session.streakDay || 0
        }));

        const { error } = await supabase
          .from('user_sessions')
          .upsert(sessionData, { onConflict: 'user_id,session_date' });

        if (error) throw error;
        console.log(`📅 Migrated ${sessionData.length} user sessions`);
      }

      console.log('✅ Local data migration completed');
      
    } catch (error) {
      console.error('❌ Local data migration failed:', error);
      throw error;
    }
  }
}
