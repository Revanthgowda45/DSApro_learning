import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseAuthService } from './SupabaseAuthService';

export interface TimeSession {
  id?: string;
  user_id: string;
  problem_id?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: 'active' | 'paused' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface TimeStats {
  totalTime: number;
  sessionCount: number;
  averageSession: number;
  longestSession: number;
  todayTime: number;
}

class TimeTrackingServiceClass {
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private getSupabaseClient() {
    try {
      return SupabaseAuthService.getClient();
    } catch (error) {
      console.warn('⚠️ Supabase client not available:', error);
      return null;
    }
  }

  async startTimer(userId: string, problemId?: string): Promise<string> {
    try {
      const sessionId = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: TimeSession = {
        id: sessionId,
        user_id: userId,
        problem_id: problemId,
        start_time: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to Supabase if available
      const supabase = this.getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('time_sessions')
          .insert([session]);

        if (error) {
          console.error('Supabase timer start error:', error);
        }
      }

      // Always save to local storage as backup
      await this.saveLocalSession(sessionId, session);

      console.log('✅ Timer started:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }

  async stopTimer(sessionId: string): Promise<number> {
    try {
      const endTime = new Date().toISOString();
      
      // Get session from local storage first
      const session = await this.getLocalSession(sessionId);
      if (!session) {
        throw new Error('Timer session not found');
      }

      const startTime = new Date(session.start_time);
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60); // minutes

      const updatedSession: TimeSession = {
        ...session,
        end_time: endTime,
        duration,
        status: 'completed',
        updated_at: endTime,
      };

      // Update in Supabase if available
      const supabase = this.getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('time_sessions')
          .update({
            end_time: endTime,
            duration,
            status: 'completed',
            updated_at: endTime,
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Supabase timer stop error:', error);
        }
      }

      // Update local storage
      await this.saveLocalSession(sessionId, updatedSession);

      // Clear any active timer
      if (this.activeTimers.has(sessionId)) {
        clearInterval(this.activeTimers.get(sessionId)!);
        this.activeTimers.delete(sessionId);
      }

      console.log('✅ Timer stopped:', sessionId, 'Duration:', duration, 'minutes');
      return duration;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }

  async pauseTimer(sessionId: string): Promise<void> {
    try {
      const session = await this.getLocalSession(sessionId);
      if (!session) {
        throw new Error('Timer session not found');
      }

      const updatedSession: TimeSession = {
        ...session,
        status: 'paused',
        updated_at: new Date().toISOString(),
      };

      // Update in Supabase if available
      const supabase = this.getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('time_sessions')
          .update({
            status: 'paused',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Supabase timer pause error:', error);
        }
      }

      // Update local storage
      await this.saveLocalSession(sessionId, updatedSession);

      console.log('⏸️ Timer paused:', sessionId);
    } catch (error) {
      console.error('Error pausing timer:', error);
      throw error;
    }
  }

  async resumeTimer(sessionId: string): Promise<void> {
    try {
      const session = await this.getLocalSession(sessionId);
      if (!session) {
        throw new Error('Timer session not found');
      }

      const updatedSession: TimeSession = {
        ...session,
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      // Update in Supabase if available
      const supabase = this.getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('time_sessions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Supabase timer resume error:', error);
        }
      }

      // Update local storage
      await this.saveLocalSession(sessionId, updatedSession);

      console.log('▶️ Timer resumed:', sessionId);
    } catch (error) {
      console.error('Error resuming timer:', error);
      throw error;
    }
  }

  async getActiveTimers(userId: string): Promise<TimeSession[]> {
    try {
      // Try Supabase first if available
      const supabase = this.getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('time_sessions')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['active', 'paused'])
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      }


      // Fallback to local storage
      return await this.getLocalActiveTimers(userId);
    } catch (error) {
      console.error('Error getting active timers:', error);
      return await this.getLocalActiveTimers(userId);
    }
  }

  async getTimeStats(userId: string, problemId?: string): Promise<TimeStats> {
    try {
      let sessions: TimeSession[] = [];
      
      // Try Supabase first if available
      const supabase = this.getSupabaseClient();
      if (supabase) {
        let query = supabase
          .from('time_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed');

        if (problemId) {
          query = query.eq('problem_id', problemId);
        }

        const { data, error } = await query;

        if (!error && data) {
          sessions = data;
        } else {
          // Fallback to local storage
          sessions = await this.getLocalCompletedSessions(userId, problemId);
        }
      } else {
        // Use local storage if Supabase not available
        sessions = await this.getLocalCompletedSessions(userId, problemId);
      }

      const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const sessionCount = sessions.length;
      const averageSession = sessionCount > 0 ? totalTime / sessionCount : 0;
      const longestSession = sessions.reduce((max, session) => 
        Math.max(max, session.duration || 0), 0
      );

      // Calculate today's time
      const today = new Date().toISOString().split('T')[0];
      const todayTime = sessions
        .filter(session => session.created_at?.startsWith(today))
        .reduce((sum, session) => sum + (session.duration || 0), 0);

      return {
        totalTime,
        sessionCount,
        averageSession,
        longestSession,
        todayTime,
      };
    } catch (error) {
      console.error('Error getting time stats:', error);
      return {
        totalTime: 0,
        sessionCount: 0,
        averageSession: 0,
        longestSession: 0,
        todayTime: 0,
      };
    }
  }

  async cleanupOrphanedTimers(): Promise<void> {
    try {
      console.log('🧹 Cleaning up orphaned timers...');

      // Get all local timer keys
      const keys = await AsyncStorage.getAllKeys();
      const timerKeys = keys.filter(key => key.startsWith('timer_'));

      let cleanedCount = 0;

      for (const key of timerKeys) {
        try {
          const sessionData = await AsyncStorage.getItem(key);
          if (sessionData) {
            const session: TimeSession = JSON.parse(sessionData);
            
            // Check if timer is older than 24 hours and still active
            const startTime = new Date(session.start_time);
            const now = new Date();
            const hoursDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            if (hoursDiff > 24 && session.status === 'active') {
              // Auto-complete the session
              const duration = Math.floor(hoursDiff * 60); // Convert to minutes
              const completedSession: TimeSession = {
                ...session,
                end_time: now.toISOString(),
                duration,
                status: 'completed',
                updated_at: now.toISOString(),
              };

              await this.saveLocalSession(key, completedSession);
              cleanedCount++;
            }
          }
        } catch (error) {
          console.error('Error processing timer key:', key, error);
        }
      }

      if (cleanedCount > 0) {
        console.log(`✅ Cleaned up ${cleanedCount} orphaned timers`);
      } else {
        console.log('✅ No orphaned timers found');
      }
    } catch (error) {
      console.error('Error cleaning up orphaned timers:', error);
    }
  }

  private async saveLocalSession(sessionId: string, session: TimeSession): Promise<void> {
    try {
      await AsyncStorage.setItem(sessionId, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving local session:', error);
    }
  }

  private async getLocalSession(sessionId: string): Promise<TimeSession | null> {
    try {
      const data = await AsyncStorage.getItem(sessionId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting local session:', error);
      return null;
    }
  }

  private async getLocalActiveTimers(userId: string): Promise<TimeSession[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const timerKeys = keys.filter(key => key.startsWith('timer_'));
      const activeSessions: TimeSession[] = [];

      for (const key of timerKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const session: TimeSession = JSON.parse(data);
            if (session.user_id === userId && 
                (session.status === 'active' || session.status === 'paused')) {
              activeSessions.push(session);
            }
          }
        } catch (error) {
          console.error('Error processing timer key:', key, error);
        }
      }

      return activeSessions;
    } catch (error) {
      console.error('Error getting local active timers:', error);
      return [];
    }
  }

  private async getLocalCompletedSessions(
    userId: string, 
    problemId?: string
  ): Promise<TimeSession[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const timerKeys = keys.filter(key => key.startsWith('timer_'));
      const completedSessions: TimeSession[] = [];

      for (const key of timerKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const session: TimeSession = JSON.parse(data);
            if (session.user_id === userId && 
                session.status === 'completed' &&
                (!problemId || session.problem_id === problemId)) {
              completedSessions.push(session);
            }
          }
        } catch (error) {
          console.error('Error processing timer key:', key, error);
        }
      }

      return completedSessions;
    } catch (error) {
      console.error('Error getting local completed sessions:', error);
      return [];
    }
  }
}

export const TimeTrackingService = new TimeTrackingServiceClass();
