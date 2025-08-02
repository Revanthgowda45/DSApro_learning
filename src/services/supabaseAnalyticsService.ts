import { ProblemProgressService } from './problemProgressService';
import { UserSessionService } from './userSessionService';
import dsaData from '../../dsa.json';

// Interfaces for analytics data
export interface ProgressMetrics {
  totalProblems: number;
  solvedProblems: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpent: number;
  averageTimePerProblem: number;
  confidenceLevel: number;
  weeklyGoal: number;
  weeklyProgress: number;
  categoryProgress: CategoryProgress[];
  recentAchievements: Achievement[];
  monthlyData: MonthlyData[];
  learningVelocity: number;
  consistencyScore: number;
  motivationLevel: 'low' | 'medium' | 'high';
}

export interface CategoryProgress {
  name: string;
  solved: number;
  total: number;
  percentage: number;
  recentActivity: number;
  averageTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Achievement {
  title: string;
  description: string;
  date: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  points: number;
}

export interface MonthlyData {
  month: string;
  problems: number;
  timeSpent: number;
  streak: number;
}

/**
 * Supabase Analytics Service
 * Reads all analytics data directly from Supabase in real-time
 */
export class SupabaseAnalyticsService {
  
  /**
   * Get comprehensive progress metrics directly from Supabase
   */
  static async getProgressMetrics(userId: string): Promise<ProgressMetrics> {
    try {
      console.log('📊 Fetching analytics data directly from Supabase for user:', userId);
      
      // Fetch all data in parallel
      const [
        problemProgress,
        userSessions,
        sessionAnalytics
      ] = await Promise.all([
        ProblemProgressService.getUserProgress(userId),
        UserSessionService.getUserSessions(userId),
        UserSessionService.getSessionAnalytics(userId, 30)
      ]);

      console.log('✅ Fetched data:', {
        problemProgress: problemProgress.length,
        userSessions: userSessions.length,
        sessionAnalytics
      });

      // Calculate basic metrics
      const totalProblems = 375; // Total DSA problems
      const solvedProblems = problemProgress.filter(p => 
        p.status === 'solved' || p.status === 'mastered'
      ).length;

      // Calculate streaks from session analytics
      const currentStreak = sessionAnalytics.currentStreak;
      const longestStreak = sessionAnalytics.longestStreak;

      // Calculate time metrics
      const totalTimeSpent = sessionAnalytics.totalTime;
      const averageTimePerProblem = solvedProblems > 0 ? Math.round(totalTimeSpent / solvedProblems) : 0;

      // Calculate weekly progress
      const weeklyProgress = await this.calculateWeeklyProgress(userId);

      // Calculate category progress
      const categoryProgress = await this.calculateCategoryProgress(userId, problemProgress);

      // Calculate achievements
      const recentAchievements = await this.calculateAchievements(userId, problemProgress, sessionAnalytics);

      // Calculate monthly data
      const monthlyData = await this.calculateMonthlyData(userId);

      // Calculate advanced metrics
      const learningVelocity = this.calculateLearningVelocity(userSessions);
      const consistencyScore = sessionAnalytics.consistencyScore;
      const motivationLevel = this.calculateMotivationLevel(userSessions, currentStreak);
      const confidenceLevel = this.calculateConfidenceLevel(
        solvedProblems,
        consistencyScore,
        learningVelocity,
        currentStreak
      );

      const metrics: ProgressMetrics = {
        totalProblems,
        solvedProblems,
        currentStreak,
        longestStreak,
        totalTimeSpent,
        averageTimePerProblem,
        confidenceLevel,
        weeklyGoal: 14, // 2 problems/day * 7 days
        weeklyProgress,
        categoryProgress,
        recentAchievements,
        monthlyData,
        learningVelocity,
        consistencyScore,
        motivationLevel
      };

      console.log('📈 Calculated metrics:', metrics);
      return metrics;

    } catch (error) {
      console.error('❌ Error fetching analytics from Supabase:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly progress from Supabase sessions
   */
  private static async calculateWeeklyProgress(userId: string): Promise<number> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklySessions = await UserSessionService.getUserSessions(
      userId,
      weekAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    return weeklySessions.reduce((sum, session) => sum + session.problems_solved, 0);
  }

  /**
   * Calculate category progress from Supabase data
   */
  private static async calculateCategoryProgress(
    userId: string, 
    problemProgress: any[]
  ): Promise<CategoryProgress[]> {
    // Get all topics from DSA database
    const rawDsaQuestions = (dsaData as any).questions;
    const allTopics = [...new Set(rawDsaQuestions.map((q: any) => q.topic as string))].filter(Boolean).sort();
    
    // Get recent sessions for activity calculation
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = await UserSessionService.getUserSessions(
      userId,
      weekAgo.toISOString().split('T')[0]
    );

    return allTopics.map(topic => {
      // Get all problems for this topic
      const topicProblems = rawDsaQuestions.filter((p: any) => (p.topic as string) === topic);
      const total = topicProblems.length;
      
      // Count solved problems for this topic
      const solved = topicProblems.filter((p: any) => 
        problemProgress.some(progress => 
          progress.problem_id === p.id.toString() && 
          (progress.status === 'solved' || progress.status === 'mastered')
        )
      ).length;
      
      const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
      
      // Calculate recent activity
      const recentActivity = recentSessions
        .filter(session => session.topics_covered?.includes(topic as string))
        .reduce((sum, session) => sum + session.problems_solved, 0);
      
      // Calculate average time for this topic
      const topicSessions = recentSessions.filter(session => 
        session.topics_covered?.includes(topic as string)
      );
      const averageTime = topicSessions.length > 0 
        ? Math.round(topicSessions.reduce((sum, session) => sum + session.time_spent, 0) / topicSessions.length)
        : 60;
      
      // Determine difficulty based on topic complexity
      let difficulty: 'Easy' | 'Medium' | 'Hard';
      const topicStr = topic as string;
      if (['Arrays', 'Strings', 'Searching & Sorting'].includes(topicStr)) {
        difficulty = percentage > 40 ? 'Easy' : percentage > 20 ? 'Medium' : 'Hard';
      } else if (['Dynamic Programming', 'Graphs', 'Backtracking'].includes(topicStr)) {
        difficulty = percentage > 30 ? 'Medium' : 'Hard';
      } else {
        difficulty = percentage > 35 ? 'Easy' : percentage > 15 ? 'Medium' : 'Hard';
      }
      
      return {
        name: topic as string,
        solved,
        total,
        percentage,
        recentActivity,
        averageTime,
        difficulty
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Calculate achievements from Supabase data
   */
  private static async calculateAchievements(
    _userId: string,
    problemProgress: any[],
    sessionAnalytics: any
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];
    const solvedCount = problemProgress.filter(p => 
      p.status === 'solved' || p.status === 'mastered'
    ).length;

    // Problem milestones
    if (solvedCount >= 1) {
      achievements.push({
        title: 'First Problem',
        description: 'Solved your first DSA problem!',
        date: new Date().toISOString(),
        icon: '🎯',
        rarity: 'common',
        points: 10
      });
    }

    if (solvedCount >= 10) {
      achievements.push({
        title: 'Problem Solver',
        description: 'Solved 10 DSA problems',
        date: new Date().toISOString(),
        icon: '🧩',
        rarity: 'uncommon',
        points: 25
      });
    }

    if (solvedCount >= 50) {
      achievements.push({
        title: 'Algorithm Master',
        description: 'Solved 50 DSA problems',
        date: new Date().toISOString(),
        icon: '🏆',
        rarity: 'rare',
        points: 100
      });
    }

    // Streak achievements
    if (sessionAnalytics.currentStreak >= 7) {
      achievements.push({
        title: 'Week Warrior',
        description: '7-day solving streak',
        date: new Date().toISOString(),
        icon: '🔥',
        rarity: 'uncommon',
        points: 50
      });
    }

    return achievements.slice(-5); // Return last 5 achievements
  }

  /**
   * Calculate monthly data from Supabase sessions
   */
  private static async calculateMonthlyData(userId: string): Promise<MonthlyData[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const sessions = await UserSessionService.getUserSessions(
      userId,
      sixMonthsAgo.toISOString().split('T')[0]
    );

    const monthlyMap: Record<string, { problems: number; timeSpent: number; streak: number }> = {};

    sessions.forEach(session => {
      const date = new Date(session.session_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { problems: 0, timeSpent: 0, streak: 0 };
      }
      
      monthlyMap[monthKey].problems += session.problems_solved;
      monthlyMap[monthKey].timeSpent += session.time_spent;
      monthlyMap[monthKey].streak = Math.max(monthlyMap[monthKey].streak, session.streak_day || 0);
    });

    return Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        problems: data.problems,
        timeSpent: data.timeSpent,
        streak: data.streak
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate learning velocity (problems per week)
   */
  private static calculateLearningVelocity(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const totalProblems = sessions.reduce((sum, session) => sum + session.problems_solved, 0);
    const daysCovered = sessions.length;
    const weeksEquivalent = daysCovered / 7;
    
    return weeksEquivalent > 0 ? Math.round((totalProblems / weeksEquivalent) * 10) / 10 : 0;
  }

  /**
   * Calculate motivation level based on recent activity
   */
  private static calculateMotivationLevel(
    sessions: any[], 
    currentStreak: number
  ): 'low' | 'medium' | 'high' {
    const recentSessions = sessions.slice(0, 7); // Last 7 days
    const recentActivity = recentSessions.reduce((sum, s) => sum + s.problems_solved, 0);
    
    if (currentStreak >= 7 && recentActivity >= 14) return 'high';
    if (currentStreak >= 3 && recentActivity >= 7) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence level (0-10)
   */
  private static calculateConfidenceLevel(
    solvedProblems: number,
    consistencyScore: number,
    learningVelocity: number,
    currentStreak: number
  ): number {
    const problemsScore = Math.min(solvedProblems / 50, 1) * 3; // Max 3 points
    const consistencyScoreNormalized = (consistencyScore / 100) * 3; // Max 3 points
    const velocityScore = Math.min(learningVelocity / 10, 1) * 2; // Max 2 points
    const streakScore = Math.min(currentStreak / 30, 1) * 2; // Max 2 points
    
    const totalScore = problemsScore + consistencyScoreNormalized + velocityScore + streakScore;
    return Math.round(totalScore * 10) / 10;
  }

  /**
   * Subscribe to real-time analytics updates
   */
  static subscribeToAnalytics(userId: string, callback: (metrics: ProgressMetrics) => void) {
    // Subscribe to problem progress changes
    const progressSubscription = ProblemProgressService.subscribeToProgress(userId, async () => {
      const metrics = await this.getProgressMetrics(userId);
      callback(metrics);
    });

    // Subscribe to session changes
    const sessionSubscription = UserSessionService.subscribeToSessions(userId, async () => {
      const metrics = await this.getProgressMetrics(userId);
      callback(metrics);
    });

    return {
      unsubscribe: () => {
        progressSubscription.unsubscribe();
        sessionSubscription.unsubscribe();
      }
    };
  }
}
