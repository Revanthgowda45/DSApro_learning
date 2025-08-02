// LocalStorage-based analytics service as fallback when Supabase is unavailable
export class LocalStorageAnalytics {
  private static readonly STORAGE_KEYS = {
    PROBLEM_STATUSES: 'dsa_problem_statuses',
    USER_SESSIONS: 'dsa_user_sessions',
    STREAK_DATA: 'dsa_streak_data',
    PROGRESS_DATA: 'dsa_progress_data'
  };

  // Get problem statuses from localStorage
  static getProblemStatuses(): Record<string, string> {
    try {
      const statuses = localStorage.getItem(this.STORAGE_KEYS.PROBLEM_STATUSES);
      return statuses ? JSON.parse(statuses) : {};
    } catch {
      return {};
    }
  }

  // Get solved problems count
  static getSolvedProblemsCount(): number {
    const statuses = this.getProblemStatuses();
    return Object.values(statuses).filter(status => 
      status === 'solved' || status === 'mastered'
    ).length;
  }

  // Get user sessions from localStorage
  static getUserSessions(): any[] {
    try {
      const sessions = localStorage.getItem(this.STORAGE_KEYS.USER_SESSIONS);
      return sessions ? JSON.parse(sessions) : [];
    } catch {
      return [];
    }
  }

  // Get today's session data
  static getTodaySession(): any {
    const today = new Date().toISOString().split('T')[0];
    const sessions = this.getUserSessions();
    return sessions.find(session => session.date === today) || null;
  }

  // Calculate current streak
  static getCurrentStreak(): number {
    try {
      const streakData = localStorage.getItem(this.STORAGE_KEYS.STREAK_DATA);
      if (streakData) {
        const data = JSON.parse(streakData);
        return data.currentStreak || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  // Get session analytics
  static getSessionAnalytics(days: number = 30) {
    const sessions = this.getUserSessions();
    const recentSessions = sessions.slice(-days);
    
    const totalProblems = recentSessions.reduce((sum, s) => sum + (s.problemsSolved || 0), 0);
    const totalTime = recentSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const activeDays = recentSessions.filter(s => (s.problemsSolved || 0) > 0).length;
    
    return {
      totalProblems,
      totalTime,
      currentStreak: this.getCurrentStreak(),
      longestStreak: this.getCurrentStreak(), // Simplified
      uniqueTopics: [],
      dailyAverages: {
        problemsPerDay: Math.round((totalProblems / days) * 10) / 10,
        timePerDay: Math.round((totalTime / days) * 10) / 10
      },
      weeklyTrends: [],
      consistencyScore: Math.round((activeDays / days) * 100)
    };
  }

  // Get progress metrics for dashboard
  static getProgressMetrics() {
    const solvedCount = this.getSolvedProblemsCount();
    const currentStreak = this.getCurrentStreak();
    const todaySession = this.getTodaySession();
    
    return {
      totalProblems: solvedCount,
      currentStreak,
      longestStreak: currentStreak,
      todayStats: {
        problemsSolved: todaySession?.problemsSolved || 0,
        timeSpent: todaySession?.timeSpent || 0,
        confidenceGained: Math.min(todaySession?.problemsSolved || 0, 3)
      },
      recentSessions: this.getUserSessions().slice(-7),
      sessionAnalytics: this.getSessionAnalytics(),
      monthlyData: {
        problemsSolved: solvedCount,
        timeSpent: this.getUserSessions().reduce((sum, s) => sum + (s.timeSpent || 0), 0),
        activeDays: this.getUserSessions().filter(s => (s.problemsSolved || 0) > 0).length,
        currentStreak
      }
    };
  }

  // Create empty session analytics structure
  static getEmptySessionAnalytics() {
    return {
      totalProblems: 0,
      totalTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      uniqueTopics: [],
      dailyAverages: { problemsPerDay: 0, timePerDay: 0 },
      weeklyTrends: [],
      consistencyScore: 0
    };
  }

  // Create empty progress metrics
  static getEmptyProgressMetrics() {
    return {
      totalProblems: 0,
      currentStreak: 0,
      longestStreak: 0,
      todayStats: {
        problemsSolved: 0,
        timeSpent: 0,
        confidenceGained: 0
      },
      recentSessions: [],
      sessionAnalytics: this.getEmptySessionAnalytics(),
      monthlyData: {
        problemsSolved: 0,
        timeSpent: 0,
        activeDays: 0,
        currentStreak: 0
      }
    };
  }

  // Update problem status
  static updateProblemStatus(problemId: string, status: string) {
    try {
      const statuses = this.getProblemStatuses();
      statuses[problemId] = status;
      localStorage.setItem(this.STORAGE_KEYS.PROBLEM_STATUSES, JSON.stringify(statuses));
      console.log('✅ Problem status updated in localStorage:', problemId, status);
    } catch (error) {
      console.error('❌ Failed to update problem status:', error);
    }
  }

  // Record today's session
  static recordTodaySession(problemsSolved: number, timeSpent: number) {
    try {
      const sessions = this.getUserSessions();
      const today = new Date().toISOString().split('T')[0];
      
      const existingIndex = sessions.findIndex(s => s.date === today);
      const sessionData = {
        date: today,
        problemsSolved,
        timeSpent,
        timestamp: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionData;
      } else {
        sessions.push(sessionData);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.USER_SESSIONS, JSON.stringify(sessions));
      console.log('✅ Session recorded in localStorage:', sessionData);
    } catch (error) {
      console.error('❌ Failed to record session:', error);
    }
  }
}
