import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseAuthService } from './SupabaseAuthService';

export interface UserSession {
  id?: string;
  user_id: string;
  date: string;
  problems_solved: number;
  time_spent: number;
  streak_count: number;
  created_at?: string;
  updated_at?: string;
}

class UserSessionServiceClass {
  private supabase = SupabaseAuthService.getClient();

  async getTodaySession(userId: string): Promise<UserSession | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try Supabase first
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (!error && data) {
        return data;
      }

      // Fallback to local storage
      return await this.getLocalSession(userId, today);
    } catch (error) {
      console.error('Error getting today session:', error);
      const today = new Date().toISOString().split('T')[0];
      return await this.getLocalSession(userId, today);
    }
  }

  async updateTodaySession(
    userId: string, 
    updates: Partial<UserSession>
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current session
      const currentSession = await this.getTodaySession(userId) || {
        user_id: userId,
        date: today,
        problems_solved: 0,
        time_spent: 0,
        streak_count: 0,
      };

      // Merge updates
      const updatedSession = {
        ...currentSession,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Update in Supabase
      const { error } = await this.supabase
        .from('user_sessions')
        .upsert(updatedSession);

      if (error) {
        console.error('Supabase session update error:', error);
      }

      // Always update local storage as backup
      await this.updateLocalSession(userId, today, updatedSession);

    } catch (error) {
      console.error('Error updating today session:', error);
      // Fallback to local storage only
      const today = new Date().toISOString().split('T')[0];
      const currentSession = await this.getLocalSession(userId, today) || {
        user_id: userId,
        date: today,
        problems_solved: 0,
        time_spent: 0,
        streak_count: 0,
      };

      const updatedSession = { ...currentSession, ...updates };
      await this.updateLocalSession(userId, today, updatedSession);
    }
  }

  async getUserSessions(
    userId: string, 
    limit: number = 30
  ): Promise<UserSession[]> {
    try {
      // Try Supabase first
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }

      // Fallback to local storage
      return await this.getLocalSessions(userId, limit);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return await this.getLocalSessions(userId, limit);
    }
  }

  async getWeeklyStats(userId: string): Promise<{
    totalProblems: number;
    totalTime: number;
    averageDaily: number;
    daysActive: number;
  }> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

      // Try Supabase first
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', weekAgoStr)
        .order('date', { ascending: false });

      let sessions: UserSession[] = [];

      if (!error && data) {
        sessions = data;
      } else {
        // Fallback to local storage
        sessions = await this.getLocalSessions(userId, 7);
        sessions = sessions.filter(session => session.date >= weekAgoStr);
      }

      const totalProblems = sessions.reduce((sum, session) => sum + session.problems_solved, 0);
      const totalTime = sessions.reduce((sum, session) => sum + session.time_spent, 0);
      const daysActive = sessions.filter(session => session.problems_solved > 0).length;
      const averageDaily = daysActive > 0 ? totalProblems / daysActive : 0;

      return {
        totalProblems,
        totalTime,
        averageDaily,
        daysActive,
      };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return {
        totalProblems: 0,
        totalTime: 0,
        averageDaily: 0,
        daysActive: 0,
      };
    }
  }

  async calculateStreak(userId: string): Promise<number> {
    try {
      // Get recent sessions
      const sessions = await this.getUserSessions(userId, 30);
      
      if (sessions.length === 0) return 0;

      // Sort by date descending
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date();

      // Check if user has activity today or yesterday
      const hasActivityToday = sessions.some(s => s.date === today && s.problems_solved > 0);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const hasActivityYesterday = sessions.some(s => s.date === yesterdayStr && s.problems_solved > 0);

      // Start counting from today if there's activity, otherwise from yesterday
      if (hasActivityToday) {
        currentDate = new Date();
      } else if (hasActivityYesterday) {
        currentDate = yesterday;
      } else {
        return 0; // No recent activity
      }

      // Count consecutive days with activity
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const session = sessions.find(s => s.date === dateStr);
        
        if (session && session.problems_solved > 0) {
          streak++;
        } else {
          break;
        }

        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Update streak in local storage
      await AsyncStorage.setItem(`streak_${userId}`, JSON.stringify({
        streak,
        lastUpdate: new Date().toISOString(),
      }));

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  async incrementProblemsSolved(userId: string): Promise<void> {
    try {
      const currentSession = await this.getTodaySession(userId);
      const newCount = (currentSession?.problems_solved || 0) + 1;
      
      await this.updateTodaySession(userId, {
        problems_solved: newCount,
      });

      // Update streak
      const newStreak = await this.calculateStreak(userId);
      await this.updateTodaySession(userId, {
        streak_count: newStreak,
      });
    } catch (error) {
      console.error('Error incrementing problems solved:', error);
    }
  }

  async addTimeSpent(userId: string, minutes: number): Promise<void> {
    try {
      const currentSession = await this.getTodaySession(userId);
      const newTime = (currentSession?.time_spent || 0) + minutes;
      
      await this.updateTodaySession(userId, {
        time_spent: newTime,
      });
    } catch (error) {
      console.error('Error adding time spent:', error);
    }
  }

  private async getLocalSession(userId: string, date: string): Promise<UserSession | null> {
    try {
      const key = `session_${userId}_${date}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const session = JSON.parse(data);
        return {
          user_id: userId,
          date,
          ...session,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting local session:', error);
      return null;
    }
  }

  private async updateLocalSession(
    userId: string, 
    date: string, 
    session: Partial<UserSession>
  ): Promise<void> {
    try {
      const key = `session_${userId}_${date}`;
      await AsyncStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      console.error('Error updating local session:', error);
    }
  }

  private async getLocalSessions(userId: string, limit: number): Promise<UserSession[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys
        .filter(key => key.startsWith(`session_${userId}_`))
        .sort()
        .reverse()
        .slice(0, limit);

      const sessions: UserSession[] = [];
      
      for (const key of sessionKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const date = key.split('_')[2];
          const session = JSON.parse(data);
          sessions.push({
            user_id: userId,
            date,
            ...session,
          });
        }
      }

      return sessions;
    } catch (error) {
      console.error('Error getting local sessions:', error);
      return [];
    }
  }
}

export const UserSessionService = new UserSessionServiceClass();
