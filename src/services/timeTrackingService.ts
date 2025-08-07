import { supabase } from '../lib/supabase';

export interface ProblemTimeEntry {
  id?: string;
  user_id: string;
  problem_id: string;
  session_start: string;
  session_end?: string;
  duration_seconds: number;
  status_at_start: string;
  status_at_end?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProblemTimeStats {
  total_time: number;
  session_count: number;
  average_session: number;
  best_session: number;
  last_session?: string;
}

class TimeTrackingService {
  private activeTimers: Map<string, { startTime: Date; initialStatus: string }> = new Map();

  // Start tracking time for a problem
  async startTimer(problemId: string, userId: string, currentStatus: string): Promise<void> {
    const startTime = new Date();
    this.activeTimers.set(problemId, {
      startTime,
      initialStatus: currentStatus
    });

    // Store in localStorage as backup
    localStorage.setItem(`timer_${problemId}`, JSON.stringify({
      startTime: startTime.toISOString(),
      initialStatus: currentStatus,
      userId
    }));
  }

  // Stop tracking time and save to database
  async stopTimer(problemId: string, userId: string, finalStatus: string): Promise<number> {
    const timerData = this.activeTimers.get(problemId);
    if (!timerData) {
      // Try to recover from localStorage
      const stored = localStorage.getItem(`timer_${problemId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const startTime = new Date(parsed.startTime);
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
        
        await this.saveTimeEntry({
          user_id: userId,
          problem_id: problemId,
          session_start: parsed.startTime,
          session_end: new Date().toISOString(),
          duration_seconds: duration,
          status_at_start: parsed.initialStatus,
          status_at_end: finalStatus
        });

        localStorage.removeItem(`timer_${problemId}`);
        return duration;
      }
      return 0;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timerData.startTime.getTime()) / 1000);

    await this.saveTimeEntry({
      user_id: userId,
      problem_id: problemId,
      session_start: timerData.startTime.toISOString(),
      session_end: endTime.toISOString(),
      duration_seconds: duration,
      status_at_start: timerData.initialStatus,
      status_at_end: finalStatus
    });

    this.activeTimers.delete(problemId);
    localStorage.removeItem(`timer_${problemId}`);
    
    return duration;
  }

  // Get current timer duration for a problem
  getCurrentTimerDuration(problemId: string): number {
    const timerData = this.activeTimers.get(problemId);
    if (!timerData) {
      // Check localStorage for recovery
      const stored = localStorage.getItem(`timer_${problemId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const startTime = new Date(parsed.startTime);
        return Math.floor((Date.now() - startTime.getTime()) / 1000);
      }
      return 0;
    }

    return Math.floor((Date.now() - timerData.startTime.getTime()) / 1000);
  }

  // Check if timer is running for a problem
  isTimerRunning(problemId: string): boolean {
    return this.activeTimers.has(problemId) || localStorage.getItem(`timer_${problemId}`) !== null;
  }

  // Save time entry to database
  private async saveTimeEntry(entry: Omit<ProblemTimeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available, using localStorage');
        this.saveToLocalStorage(entry);
        return;
      }

      const { error } = await supabase
        .from('problem_time_tracking')
        .insert([entry]);

      if (error) {
        // Handle specific database errors gracefully
        if (error.code === 'PGRST301' || error.message?.includes('406') || error.message?.includes('relation "problem_time_tracking" does not exist')) {
          console.warn('Time tracking table not set up, using localStorage fallback');
        } else {
          console.error('Error saving time entry:', error);
        }
        // Fallback to localStorage
        this.saveToLocalStorage(entry);
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
      this.saveToLocalStorage(entry);
    }
  }

  // Fallback to localStorage when database is unavailable
  private saveToLocalStorage(entry: Omit<ProblemTimeEntry, 'id' | 'created_at' | 'updated_at'>): void {
    const key = `time_entries_${entry.user_id}`;
    const existing = localStorage.getItem(key);
    const entries = existing ? JSON.parse(existing) : [];
    
    entries.push({
      ...entry,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(entries));
  }

  // Get time statistics for a problem
  async getProblemTimeStats(problemId: string, userId: string): Promise<ProblemTimeStats> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available, using localStorage');
        return this.getStatsFromLocalStorage(problemId, userId);
      }

      const { data, error } = await supabase
        .from('problem_time_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle specific database errors gracefully
        if (error.code === 'PGRST301' || error.message?.includes('406') || error.message?.includes('relation "problem_time_tracking" does not exist')) {
          console.warn('Time tracking table not set up, using localStorage fallback');
        } else {
          console.error('Error fetching time stats:', error);
        }
        return this.getStatsFromLocalStorage(problemId, userId);
      }

      if (!data || data.length === 0) {
        return {
          total_time: 0,
          session_count: 0,
          average_session: 0,
          best_session: 0
        };
      }

      const totalTime = data.reduce((sum, entry) => sum + entry.duration_seconds, 0);
      const sessionCount = data.length;
      const averageSession = Math.floor(totalTime / sessionCount);
      const bestSession = Math.min(...data.map(entry => entry.duration_seconds));

      return {
        total_time: totalTime,
        session_count: sessionCount,
        average_session: averageSession,
        best_session: bestSession,
        last_session: data[0].created_at
      };
    } catch (error) {
      console.error('Error connecting to database:', error);
      return this.getStatsFromLocalStorage(problemId, userId);
    }
  }

  // Fallback stats from localStorage
  private getStatsFromLocalStorage(problemId: string, userId: string): ProblemTimeStats {
    const key = `time_entries_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return {
        total_time: 0,
        session_count: 0,
        average_session: 0,
        best_session: 0
      };
    }

    const entries = JSON.parse(stored).filter((entry: any) => entry.problem_id === problemId);
    
    if (entries.length === 0) {
      return {
        total_time: 0,
        session_count: 0,
        average_session: 0,
        best_session: 0
      };
    }

    const totalTime = entries.reduce((sum: number, entry: any) => sum + entry.duration_seconds, 0);
    const sessionCount = entries.length;
    const averageSession = Math.floor(totalTime / sessionCount);
    const bestSession = Math.min(...entries.map((entry: any) => entry.duration_seconds));

    return {
      total_time: totalTime,
      session_count: sessionCount,
      average_session: averageSession,
      best_session: bestSession,
      last_session: entries[0].created_at
    };
  }

  // Get all time entries for a user
  async getUserTimeEntries(userId: string, limit: number = 50): Promise<ProblemTimeEntry[]> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available, using localStorage');
        return this.getAllFromLocalStorage(userId);
      }

      const { data, error } = await supabase
        .from('problem_time_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user time entries:', error);
        return this.getAllFromLocalStorage(userId);
      }

      return data || [];
    } catch (error) {
      console.error('Error connecting to database:', error);
      return this.getAllFromLocalStorage(userId);
    }
  }

  // Get all entries from localStorage
  private getAllFromLocalStorage(userId: string): ProblemTimeEntry[] {
    const key = `time_entries_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  // Clean up any orphaned timers on app start
  cleanupOrphanedTimers(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('timer_'));
    keys.forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const startTime = new Date(parsed.startTime);
          const hoursSinceStart = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
          
          // Remove timers older than 24 hours
          if (hoursSinceStart > 24) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

export const timeTrackingService = new TimeTrackingService();
