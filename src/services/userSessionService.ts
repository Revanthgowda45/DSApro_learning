import { supabase } from '../lib/supabase'
import type { Tables, Inserts } from '../lib/supabase'
import { LocalStorageAnalytics } from './localStorageAnalytics'

// Check if Supabase is properly configured and available
const isSupabaseAvailable = () => {
  try {
    // Check if disabled via localStorage flag
    if (localStorage.getItem('disable_supabase') === 'true') {
      return false;
    }
    
    // Check if environment variables are set
    const hasUrl = import.meta.env.VITE_SUPABASE_URL;
    const hasKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return !!(hasUrl && hasKey);
  } catch {
    return false;
  }
};

// Enhanced Connection health check utility
class ConnectionManager {
  private static isHealthy = true;
  private static lastHealthCheck = 0;
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private static readonly RECOVERY_INTERVAL = 60000; // 1 minute recovery time
  private static supabaseDisabled = false;
  private static lastFailureTime = 0;
  private static consecutiveFailures = 0;
  private static readonly MAX_CONSECUTIVE_FAILURES = 3;
  
  static async checkConnection(): Promise<boolean> {
    // Quick check if Supabase is available
    if (!isSupabaseAvailable()) {
      console.log('📱 Supabase not configured, using localStorage fallback');
      return false;
    }

    // Check if Supabase client is available
    if (!supabase) {
      console.warn('⚠️ Supabase client not configured - cannot check connection');
      return false;
    }

    const now = Date.now();
    
    // Recovery mechanism: Re-enable Supabase after recovery interval
    if (this.supabaseDisabled && (now - this.lastFailureTime) > this.RECOVERY_INTERVAL) {
      console.log('🔄 Attempting to recover Supabase connection...');
      this.supabaseDisabled = false;
      this.consecutiveFailures = 0;
      this.isHealthy = false; // Force a fresh health check
    }
    
    // If disabled and not ready for recovery, return false
    if (this.supabaseDisabled) {
      return false;
    }
    
    // Skip if recently checked and healthy
    if (this.isHealthy && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
      return true;
    }
    
    try {
      console.log('🔍 Checking Supabase connection health...');
      
      // Enhanced health check with longer timeout for better reliability
      const healthPromise = supabase.from('profiles').select('id').limit(1);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 8000) // Increased to 8 seconds
      );
      
      await Promise.race([healthPromise, timeoutPromise]);
      
      this.isHealthy = true;
      this.lastHealthCheck = now;
      this.consecutiveFailures = 0; // Reset failure count on success
      console.log('✅ Supabase connection healthy');
      return true;
    } catch (error) {
      console.warn('⚠️ Supabase connection check failed:', error);
      this.isHealthy = false;
      this.lastHealthCheck = now;
      this.consecutiveFailures++;
      
      // Only disable after multiple consecutive failures
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        console.warn(`❌ ${this.MAX_CONSECUTIVE_FAILURES} consecutive failures, temporarily disabling Supabase`);
        this.supabaseDisabled = true;
        this.lastFailureTime = now;
      }
      
      return false;
    }
  }
  
  static async withRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T | null> {
    // If Supabase is not available, return null immediately
    if (!isSupabaseAvailable()) {
      console.log('📱 Supabase not configured, skipping operation');
      return null;
    }
    
    for (let i = 0; i <= retries; i++) {
      try {
        // Check connection health before operation (with recovery mechanism)
        const isConnected = await this.checkConnection();
        if (!isConnected) {
          console.log('📱 Connection unavailable, using fallback');
          return null;
        }
        
        // Add operation timeout to prevent hanging
        const operationPromise = operation();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), 10000) // 10 second timeout
        );
        
        const result = await Promise.race([operationPromise, timeoutPromise]);
        
        // Reset failure count on successful operation
        this.consecutiveFailures = Math.max(0, this.consecutiveFailures - 1);
        return result;
      } catch (error) {
        console.warn(`⚠️ Operation attempt ${i + 1}/${retries + 1} failed:`, error);
        
        // Don't immediately disable on single failures
        if (i === retries) {
          console.log('❌ All retry attempts failed, using fallback');
          return null;
        }
        
        // Progressive backoff: 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    return null;
  }

  // Manual recovery method for debugging
  static forceRecovery(): void {
    console.log('🔄 Forcing Supabase connection recovery...');
    this.supabaseDisabled = false;
    this.consecutiveFailures = 0;
    this.isHealthy = false;
    this.lastHealthCheck = 0;
  }

  // Get connection status for debugging
  static getStatus() {
    return {
      isHealthy: this.isHealthy,
      isDisabled: this.supabaseDisabled,
      consecutiveFailures: this.consecutiveFailures,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      supabaseConfigured: isSupabaseAvailable()
    };
  }
}

type UserSession = Tables<'user_sessions'>
type UserSessionInsert = Inserts<'user_sessions'>

export class UserSessionService {
  // Get user sessions with optional date range
  static async getUserSessions(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<UserSession[]> {
    console.log('🔍 Starting getUserSessions for user:', userId, { startDate, endDate });
    
    const result = await ConnectionManager.withRetry(async () => {
      console.log('🔍 Fetching user sessions for user:', userId, { startDate, endDate })
      
      // Check if Supabase is available
      if (!supabase) {
        console.warn('⚠️ Supabase not configured - cannot fetch user sessions');
        return [];
      }
      
      let query = supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
      
      if (startDate) {
        query = query.gte('session_date', startDate)
      }
      
      if (endDate) {
        query = query.lte('session_date', endDate)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ Error fetching user sessions:', error)
        throw error
      }
      
      // Validate data integrity
      const validData = (data || []).filter(session => {
        if (!session.session_date) {
          console.warn('⚠️ Filtering out session with missing session_date:', session);
          return false;
        }
        return true;
      });
      
      console.log('✅ Successfully fetched', validData.length, 'valid user sessions (filtered from', data?.length || 0, 'total)');
      return validData;
    }, 3); // Increased retries for critical data fetching
    
    // If Supabase failed, use localStorage fallback
    if (result === null) {
      console.log('📱 Using localStorage fallback for user sessions')
      const fallbackData = LocalStorageAnalytics.getUserSessions();
      console.log('📱 Fallback returned', fallbackData.length, 'sessions');
      return fallbackData;
    }
    
    console.log('✅ Returning', result.length, 'user sessions');
    return result || []
  }

  // Get today's session
  static async getTodaySession(userId: string): Promise<UserSession | null> {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 Starting getTodaySession for user:', userId, 'date:', today);
    
    const result = await ConnectionManager.withRetry(async () => {
      console.log('🔍 Fetching today session for user:', userId, 'date:', today)
      
      // Check if Supabase is available
      if (!supabase) {
        console.warn('⚠️ Supabase not configured - cannot fetch today session');
        return null;
      }
      
      // First try without .single() to avoid 406 errors
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_date', today)
        .limit(1)
      
      if (error) {
        console.error('❌ Error fetching today session:', error)
        throw error
      }
      
      // Return first result or null if no data
      return data && data.length > 0 ? data[0] : null
    });
    
    // If Supabase failed, use localStorage fallback
    if (result === null) {
      console.log('📱 Using localStorage fallback for today session')
      return LocalStorageAnalytics.getTodaySession()
    }
    
    return result
  }

  // Create or update today's session
  static async updateTodaySession(
    userId: string,
    updates: {
      problemsSolved?: number
      timeSpent?: number
      topicsCovered?: string[]
      streakDay?: number
    }
  ): Promise<UserSession | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('📝 Updating today session for user:', userId, 'date:', today, 'updates:', updates)
      
      // Check if Supabase is available
      if (!supabase) {
        console.warn('⚠️ Supabase not configured - cannot update today session');
        return null;
      }
      
      const sessionData: UserSessionInsert = {
        user_id: userId,
        session_date: today,
        problems_solved: updates.problemsSolved || 0,
        time_spent: updates.timeSpent || 0,
        topics_covered: updates.topicsCovered || [],
        streak_day: updates.streakDay || 0
      }
      
      // Try upsert without .single() first to avoid 406 errors
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert(sessionData, {
          onConflict: 'user_id,session_date'
        })
        .select()
      
      if (error) {
        console.error('❌ Error updating today session:', error)
        return null
      }
      
      // Return first result or null
      const result = data && data.length > 0 ? data[0] : null
      console.log('✅ Successfully updated today session:', result)
      return result
    } catch (err) {
      console.error('❌ Exception in updateTodaySession:', err)
      return null
    }
  }

  // Record problem solved in today's session
  static async recordProblemSolved(
    userId: string,
    _problemId: string, // Prefixed with underscore to indicate intentionally unused
    topic: string,
    timeSpent: number = 0
  ): Promise<UserSession | null> {
    try {
      const todaySession = await this.getTodaySession(userId)
      
      const currentProblems = todaySession?.problems_solved || 0
      const currentTime = todaySession?.time_spent || 0
      const currentTopics = todaySession?.topics_covered || []
      
      // Add topic if not already included
      const updatedTopics = currentTopics.includes(topic) 
        ? currentTopics 
        : [...currentTopics, topic]
      
      const result = await this.updateTodaySession(userId, {
        problemsSolved: currentProblems + 1,
        timeSpent: currentTime + timeSpent,
        topicsCovered: updatedTopics
      })
      
      return result
    } catch (err) {
      console.error('❌ Exception in recordProblemSolved:', err)
      return null
    }
  }

  // Get session analytics
  static async getSessionAnalytics(userId: string, days: number = 30) {
    // Check if Supabase is available first
    if (!isSupabaseAvailable()) {
      console.log('📱 Using localStorage fallback for session analytics')
      return LocalStorageAnalytics.getSessionAnalytics(days)
    }
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    
    const sessions = await this.getUserSessions(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )
    
    const analytics = {
      totalSessions: sessions.length,
      totalProblems: sessions.reduce((sum, s) => sum + s.problems_solved, 0),
      totalTime: sessions.reduce((sum, s) => sum + s.time_spent, 0),
      averageProblemsPerSession: 0,
      averageTimePerSession: 0,
      averageTimePerProblem: 0,
      activeDays: sessions.filter(s => s.problems_solved > 0).length,
      currentStreak: await this.calculateCurrentStreak(userId),
      longestStreak: await this.calculateLongestStreak(userId),
      topicsExplored: this.getUniqueTopics(sessions),
      dailyAverages: this.calculateDailyAverages(sessions, days),
      weeklyTrends: this.calculateWeeklyTrends(sessions),
      consistencyScore: this.calculateConsistencyScore(sessions, days)
    }
    
    // Calculate averages
    if (analytics.totalSessions > 0) {
      analytics.averageProblemsPerSession = Math.round(
        (analytics.totalProblems / analytics.totalSessions) * 10
      ) / 10
      analytics.averageTimePerSession = Math.round(
        (analytics.totalTime / analytics.totalSessions) * 10
      ) / 10
    }
    
    if (analytics.totalProblems > 0) {
      analytics.averageTimePerProblem = Math.round(
        (analytics.totalTime / analytics.totalProblems) * 10
      ) / 10
    }
    
    return analytics
  }

  // Calculate current streak
  private static async calculateCurrentStreak(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId)
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < sessions.length; i++) {
      // Validate session_date before processing
      if (!sessions[i].session_date) {
        console.warn('⚠️ Skipping session with missing session_date in streak calculation:', sessions[i])
        continue
      }
      
      const sessionDate = new Date(sessions[i].session_date)
      
      // Check if the date is valid
      if (isNaN(sessionDate.getTime())) {
        console.warn('⚠️ Skipping session with invalid session_date in streak calculation:', sessions[i].session_date, sessions[i])
        continue
      }
      
      sessionDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (sessionDate.getTime() === expectedDate.getTime() && sessions[i].problems_solved > 0) {
        streak++
      } else if (i === 0 && sessionDate.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()) {
        // If today has no activity but yesterday does, continue checking
        continue
      } else {
        break
      }
    }
    
    return streak
  }

  // Calculate longest streak
  private static async calculateLongestStreak(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId)
    
    let longestStreak = 0
    let currentStreak = 0
    let previousDate: Date | null = null
    
    // Sort sessions by date ascending, filtering out invalid dates
    const sortedSessions = sessions
      .filter(s => s.problems_solved > 0 && s.session_date && !isNaN(new Date(s.session_date).getTime()))
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.session_date)
      
      // Additional safety check (should not be needed due to filter above)
      if (isNaN(sessionDate.getTime())) {
        console.warn('⚠️ Skipping session with invalid date in longest streak:', session.session_date, session)
        continue
      }
      
      if (previousDate) {
        const daysDiff = Math.floor(
          (sessionDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysDiff === 1) {
          currentStreak++
        } else {
          longestStreak = Math.max(longestStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      
      previousDate = sessionDate
    }
    
    return Math.max(longestStreak, currentStreak)
  }

  // Get unique topics from sessions
  private static getUniqueTopics(sessions: UserSession[]): string[] {
    const allTopics = sessions.flatMap(s => s.topics_covered)
    return Array.from(new Set(allTopics))
  }

  // Calculate daily averages
  private static calculateDailyAverages(sessions: UserSession[], days: number) {
    const totalProblems = sessions.reduce((sum, s) => sum + s.problems_solved, 0)
    const totalTime = sessions.reduce((sum, s) => sum + s.time_spent, 0)
    
    return {
      problemsPerDay: Math.round((totalProblems / days) * 10) / 10,
      timePerDay: Math.round((totalTime / days) * 10) / 10
    }
  }

  // Calculate weekly trends
  private static calculateWeeklyTrends(sessions: UserSession[]) {
    const weeks: Record<string, { problems: number; time: number; sessions: number }> = {}
    
    sessions.forEach(session => {
      // Validate session_date before processing
      if (!session.session_date) {
        console.warn('⚠️ Skipping session with missing session_date:', session)
        return
      }
      
      const date = new Date(session.session_date)
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Skipping session with invalid session_date:', session.session_date, session)
        return
      }
      
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      
      // Double-check weekStart is valid before calling toISOString
      if (isNaN(weekStart.getTime())) {
        console.warn('⚠️ Skipping session with invalid weekStart date:', weekStart, session)
        return
      }
      
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { problems: 0, time: 0, sessions: 0 }
      }
      
      weeks[weekKey].problems += session.problems_solved
      weeks[weekKey].time += session.time_spent
      weeks[weekKey].sessions++
    })
    
    return Object.entries(weeks)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }

  // Calculate consistency score (0-100)
  private static calculateConsistencyScore(sessions: UserSession[], days: number): number {
    const activeDays = sessions.filter(s => s.problems_solved > 0).length
    const consistencyScore = (activeDays / days) * 100
    
    return Math.round(consistencyScore * 10) / 10
  }

  // Get session heatmap data
  static async getSessionHeatmap(userId: string, year?: number): Promise<Record<string, number>> {
    const currentYear = year || new Date().getFullYear()
    const startDate = `${currentYear}-01-01`
    const endDate = `${currentYear}-12-31`    
    const sessions = await this.getUserSessions(userId, startDate, endDate)
    
    // If no sessions returned (Supabase failed), use localStorage fallback
    if (!sessions || sessions.length === 0) {
      console.log('📱 No Supabase sessions, using localStorage fallback for heatmap')
      return LocalStorageAnalytics.getSessionHeatmap(currentYear)
    }
    
    const heatmapData: Record<string, number> = {}
    
    sessions.forEach(session => {
      // Validate session_date before processing
      if (!session.session_date) {
        console.warn('⚠️ Skipping session with missing session_date in heatmap:', session)
        return
      }
      
      // Validate that the date string is properly formatted
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(session.session_date)) {
        console.warn('⚠️ Skipping session with invalid date format in heatmap:', session.session_date, session)
        return
      }
      
      heatmapData[session.session_date] = session.problems_solved
    })
    
    return heatmapData
  }

  // Real-time subscription for session updates
  static subscribeToSessions(userId: string, callback: (payload: any) => void) {
    // Check if Supabase is available
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - cannot subscribe to sessions');
      return null;
    }
    
    return supabase
      .channel(`user_sessions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  // Bulk create sessions (for data migration)
  static async bulkCreateSessions(sessions: UserSessionInsert[]): Promise<UserSession[]> {
    // Check if Supabase is available
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - cannot bulk create sessions');
      return [];
    }
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessions)
      .select()
    
    if (error) {
      console.error('Error bulk creating sessions:', error)
      throw error
    }
    
    return data || []
  }
}
