// Import DSA database for real category progress calculation
import dsaData from '../../dsa.json';
import { getTopics } from './dsaDatabase';

// Access raw DSA questions
const rawDsaQuestions = (dsaData as any).questions;

export interface UserSession {
  date: string;
  problemsSolved: number;
  timeSpent: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  topics: string[];
  success: boolean;
  notes?: string;
}

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

class RealisticProgressTracker {
  private static readonly STORAGE_KEY = 'dsa_user_sessions';
  private static readonly PROGRESS_KEY = 'dsa_progress_metrics';
  // Achievement key for future use

  // Get user sessions from localStorage
  static getUserSessions(): UserSession[] {
    const sessions = localStorage.getItem(this.STORAGE_KEY);
    return sessions ? JSON.parse(sessions) : [];
  }

  // Get real user progress from localStorage (synced from Supabase)
  private static getRealUserProgress() {
    // Get solved problems from localStorage (synced from Supabase)
    const solvedProblemsStr = localStorage.getItem('dsa_solved_problems');
    const solvedProblems = solvedProblemsStr ? JSON.parse(solvedProblemsStr) : [];
    
    // Get problem statuses for more detailed analysis
    const problemStatusesStr = localStorage.getItem('dsa_problem_statuses');
    const problemStatuses = problemStatusesStr ? JSON.parse(problemStatusesStr) : {};
    
    return {
      solvedProblems,
      totalSolved: solvedProblems.length,
      problemStatuses
    };
  }

  // Save user session
  static saveUserSession(session: UserSession): void {
    const sessions = this.getUserSessions();
    sessions.push(session);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    this.updateProgressMetrics();
  }

  // Calculate realistic progress metrics based on actual user behavior
  static calculateProgressMetrics(): ProgressMetrics {
    const sessions = this.getUserSessions();
    const userProgress = this.getRealUserProgress();
    const today = new Date();
    
    // Basic metrics
    const totalProblems = 375;
    const solvedProblems = userProgress.solvedProblems.length;
    const totalTimeSpent = sessions.reduce((sum, session) => sum + session.timeSpent, 0);
    const averageTimePerProblem = solvedProblems > 0 ? Math.round(totalTimeSpent / solvedProblems) : 0;

    // Streak calculation
    const { currentStreak, longestStreak } = this.calculateStreaks(sessions);

    // Weekly progress (last 7 days)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weeklyProgress = sessions.filter(session => 
      new Date(session.date) >= weekStart
    ).reduce((sum, session) => sum + session.problemsSolved, 0);

    // Category progress based on actual solved problems
    const categoryProgress = this.calculateCategoryProgress(userProgress.solvedProblems);

    // Recent achievements
    const recentAchievements = this.calculateAchievements(sessions, userProgress);

    // Monthly data (last 6 months)
    const monthlyData = this.calculateMonthlyData(sessions);

    // Advanced metrics
    const learningVelocity = this.calculateLearningVelocity(sessions);
    const consistencyScore = this.calculateConsistencyScore(sessions);
    const motivationLevel = this.calculateMotivationLevel(sessions, currentStreak);

    // Confidence level based on performance and consistency
    const confidenceLevel = this.calculateConfidenceLevel(
      solvedProblems,
      consistencyScore,
      learningVelocity,
      currentStreak
    );

    return {
      totalProblems,
      solvedProblems,
      currentStreak,
      longestStreak,
      totalTimeSpent,
      averageTimePerProblem,
      confidenceLevel,
      weeklyGoal: 15, // 3 problems × 5 days (respecting slow learner pace)
      weeklyProgress,
      categoryProgress,
      recentAchievements,
      monthlyData,
      learningVelocity,
      consistencyScore,
      motivationLevel
    };
  }

  // Calculate streaks based on actual practice days
  private static calculateStreaks(sessions: UserSession[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const practiceDays = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if user practiced today or yesterday for current streak
    if (practiceDays.includes(today) || practiceDays.includes(yesterday)) {
      currentStreak = 1;
      
      // Count backwards from most recent day
      for (let i = practiceDays.length - 2; i >= 0; i--) {
        const currentDay = new Date(practiceDays[i + 1]);
        const previousDay = new Date(practiceDays[i]);
        const dayDiff = Math.floor((currentDay.getTime() - previousDay.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < practiceDays.length; i++) {
      const currentDay = new Date(practiceDays[i]);
      const previousDay = new Date(practiceDays[i - 1]);
      const dayDiff = Math.floor((currentDay.getTime() - previousDay.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  // Calculate category progress based on solved problems
  private static calculateCategoryProgress(solvedProblems: string[]): CategoryProgress[] {
    // Get all topics from DSA database
    const allTopics = getTopics();
    
    // Calculate real category progress
    return allTopics.map(topic => {
      // Get all problems for this topic
      const topicProblems = rawDsaQuestions.filter((p: { id: number; topic: string; question: string; difficulty: string }) => p.topic === topic);
      const total = topicProblems.length;
      
      // Count solved problems for this topic
      const solved = topicProblems.filter((p: { id: number; topic: string; question: string; difficulty: string }) => 
        solvedProblems.includes(p.id.toString())
      ).length;
      
      const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
      
      // Calculate recent activity (problems solved in last 7 days)
      const sessions = this.getUserSessions();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = sessions
        .filter(session => new Date(session.date) >= weekAgo)
        .filter(session => session.topics.includes(topic))
        .reduce((sum, session) => sum + session.problemsSolved, 0);
      
      // Calculate average time for this topic
      const topicSessions = sessions.filter(session => session.topics.includes(topic));
      const averageTime = topicSessions.length > 0 
        ? Math.round(topicSessions.reduce((sum, session) => sum + session.timeSpent, 0) / topicSessions.length)
        : 60; // Default 60 minutes
      
      // Determine difficulty based on percentage and topic complexity
      let difficulty: 'Easy' | 'Medium' | 'Hard';
      if (['Arrays', 'Strings', 'Searching & Sorting'].includes(topic)) {
        difficulty = percentage > 40 ? 'Easy' : percentage > 20 ? 'Medium' : 'Hard';
      } else if (['Dynamic Programming', 'Graphs', 'Backtracking'].includes(topic)) {
        difficulty = percentage > 30 ? 'Medium' : 'Hard';
      } else {
        difficulty = percentage > 35 ? 'Easy' : percentage > 15 ? 'Medium' : 'Hard';
      }
      
      return {
        name: topic,
        solved,
        total,
        percentage,
        recentActivity,
        averageTime,
        difficulty
      };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by progress percentage
  }

  // Calculate achievements based on actual progress
  private static calculateAchievements(sessions: UserSession[], userProgress: any): Achievement[] {
    const achievements: Achievement[] = [];
    const solvedCount = userProgress.solvedProblems.length;
    const { currentStreak } = this.calculateStreaks(sessions);

    // Streak achievements
    if (currentStreak >= 3) {
      achievements.push({
        title: `${currentStreak}-Day Streak`,
        description: `Practiced for ${currentStreak} consecutive days`,
        date: 'Today',
        icon: '🔥',
        rarity: currentStreak >= 7 ? 'rare' : 'common',
        points: currentStreak * 10
      });
    }

    // Problem count achievements
    if (solvedCount >= 10) {
      achievements.push({
        title: 'Problem Solver',
        description: `Solved ${solvedCount} problems`,
        date: '2 days ago',
        icon: '🎯',
        rarity: solvedCount >= 50 ? 'epic' : solvedCount >= 25 ? 'rare' : 'common',
        points: solvedCount * 5
      });
    }

    // Time-based achievements
    const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
    if (totalTime >= 600) { // 10 hours
      achievements.push({
        title: 'Time Master',
        description: `Invested ${Math.round(totalTime / 60)} hours in learning`,
        date: '1 week ago',
        icon: '⏰',
        rarity: 'uncommon',
        points: Math.round(totalTime / 10)
      });
    }

    // Consistency achievements
    const consistencyScore = this.calculateConsistencyScore(sessions);
    if (consistencyScore >= 70) {
      achievements.push({
        title: 'Consistent Learner',
        description: 'Maintained consistent practice routine',
        date: '3 days ago',
        icon: '📈',
        rarity: 'rare',
        points: 100
      });
    }

    return achievements.slice(0, 4); // Show recent 4 achievements
  }

  // Calculate monthly data for charts
  private static calculateMonthlyData(sessions: UserSession[]): MonthlyData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      const monthSessions = sessions.filter(session => {
        const sessionMonth = new Date(session.date).getMonth();
        return sessionMonth === index;
      });

      return {
        month,
        problems: monthSessions.reduce((sum, s) => sum + s.problemsSolved, 0),
        timeSpent: monthSessions.reduce((sum, s) => sum + s.timeSpent, 0),
        streak: index === currentMonth ? this.calculateStreaks(sessions).currentStreak : 0
      };
    });
  }

  // Calculate learning velocity (problems per week)
  private static calculateLearningVelocity(sessions: UserSession[]): number {
    if (sessions.length === 0) return 0;
    
    const totalProblems = sessions.reduce((sum, s) => sum + s.problemsSolved, 0);
    const firstSession = new Date(sessions[0].date);
    const lastSession = new Date(sessions[sessions.length - 1].date);
    const weeksDiff = Math.max(1, (lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    return Math.round((totalProblems / weeksDiff) * 10) / 10;
  }

  // Calculate consistency score (0-100)
  private static calculateConsistencyScore(sessions: UserSession[]): number {
    if (sessions.length === 0) return 0;
    
    const practiceDays = [...new Set(sessions.map(s => s.date.split('T')[0]))];
    const totalDays = Math.max(1, Math.floor((Date.now() - new Date(sessions[0].date).getTime()) / (1000 * 60 * 60 * 24)));
    
    return Math.min(100, Math.round((practiceDays.length / totalDays) * 100));
  }

  // Calculate motivation level based on recent activity
  private static calculateMotivationLevel(sessions: UserSession[], currentStreak: number): 'low' | 'medium' | 'high' {
    const recentSessions = sessions.filter(s => 
      new Date(s.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const recentProblems = recentSessions.reduce((sum, s) => sum + s.problemsSolved, 0);
    
    if (currentStreak >= 5 && recentProblems >= 10) return 'high';
    if (currentStreak >= 3 && recentProblems >= 5) return 'medium';
    return 'low';
  }

  // Calculate confidence level (0-10)
  private static calculateConfidenceLevel(
    solvedProblems: number,
    consistencyScore: number,
    learningVelocity: number,
    currentStreak: number
  ): number {
    const problemsScore = Math.min(4, solvedProblems / 10); // Max 4 points for problems
    const consistencyPoints = (consistencyScore / 100) * 3; // Max 3 points for consistency
    const velocityPoints = Math.min(2, learningVelocity / 5); // Max 2 points for velocity
    const streakPoints = Math.min(1, currentStreak / 10); // Max 1 point for streak
    
    return Math.round((problemsScore + consistencyPoints + velocityPoints + streakPoints) * 10) / 10;
  }

  // Update progress metrics in localStorage
  private static updateProgressMetrics(): void {
    const metrics = this.calculateProgressMetrics();
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(metrics));
  }

  // Get cached progress metrics
  static getProgressMetrics(): ProgressMetrics {
    const cached = localStorage.getItem(this.PROGRESS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return this.calculateProgressMetrics();
  }

  // Initialize with empty data for new users (they start with 0 progress)
  static initializeForNewUser(): void {
    const existingSessions = this.getUserSessions();
    if (existingSessions.length > 0) return;

    // Start with empty sessions array - user begins with 0 problems solved
    const sampleSessions: UserSession[] = [];

    // Save empty sessions (user starts fresh)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sampleSessions));
    this.updateProgressMetrics();
  }

  // Generate sample data for demo purposes (separate from initialization)
  static generateSampleData(): void {
    // Create realistic sample sessions for a slow learner over the past 3 weeks
    const sampleSessions: UserSession[] = [];
    const today = new Date();
    const topics = ['Arrays', 'Strings', 'Linked Lists', 'Stacks & Queues', 'Trees', 'Two Pointers'];
    const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Easy', 'Easy', 'Medium', 'Easy', 'Medium'];
    
    // Generate 21 days of realistic practice data (3 weeks)
    for (let i = 20; i >= 0; i--) {
      const sessionDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayOfWeek = sessionDate.getDay();
      
      // Skip some days to make it realistic (not every day)
      // More likely to practice on weekdays, less on weekends
      const practiceChance = dayOfWeek === 0 || dayOfWeek === 6 ? 0.4 : 0.8;
      
      if (Math.random() < practiceChance) {
        // Determine problems solved (1-3 for slow learner)
        const problemsSolved = Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3;
        
        // Time spent varies based on problems and difficulty
        const baseTime = 45; // 45 minutes base
        const timeVariation = Math.random() * 30 - 15; // ±15 minutes
        const timeSpent = Math.round(baseTime + (problemsSolved * 25) + timeVariation);
        
        // Select topic and difficulty
        const topicIndex = Math.floor(Math.random() * topics.length);
        const selectedTopics = [topics[topicIndex]];
        if (Math.random() < 0.3) {
          // Sometimes practice 2 topics
          const secondTopic = topics[(topicIndex + 1) % topics.length];
          selectedTopics.push(secondTopic);
        }
        
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        
        sampleSessions.push({
          date: sessionDate.toISOString(),
          problemsSolved,
          timeSpent,
          difficulty,
          topics: selectedTopics,
          success: Math.random() < 0.85, // 85% success rate
          notes: i === 20 ? 'Started DSA journey!' : undefined
        });
      }
    }
    
    // Ensure we have at least some recent activity
    if (sampleSessions.length === 0 || !sampleSessions.some(s => 
      new Date(s.date).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000
    )) {
      // Add today's session
      sampleSessions.push({
        date: today.toISOString(),
        problemsSolved: 2,
        timeSpent: 95,
        difficulty: 'Easy',
        topics: ['Arrays'],
        success: true,
        notes: 'Getting back on track!'
      });
    }
    
    // Sort sessions by date
    sampleSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Save sample sessions
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sampleSessions));
    this.updateProgressMetrics();
  }

  // Record a new problem solving session
  static recordSession(problemsSolved: number, timeSpent: number, topics: string[], difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard'): void {
    // Create date in local timezone to avoid timezone conversion issues
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const session: UserSession = {
      date: localDate.toISOString().split('T')[0], // Store only date part (YYYY-MM-DD)
      problemsSolved,
      timeSpent,
      difficulty,
      topics,
      success: true
    };

    this.saveUserSession(session);
  }

  // Reset to zero progress (start fresh)
  static resetToZeroProgress(): void {
    // Clear existing data
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
    
    // Initialize with empty data (0 problems solved)
    this.initializeForNewUser();
  }

  // Reset and generate sample data (for demo purposes)
  static resetAndGenerateRealisticData(): void {
    // Clear existing data
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
    
    // Generate sample data
    this.generateSampleData();
  }
}

export default RealisticProgressTracker;
