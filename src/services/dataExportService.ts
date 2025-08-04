import { supabase } from '../lib/supabase';
import { ProblemProgressService } from './problemProgressService';
import { UserSessionService } from './userSessionService';
import { LocalStorageAnalytics } from './localStorageAnalytics';
import type { User } from '../context/AuthContext';

export interface ExportData {
  user: {
    id: string;
    email: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
    daily_time_limit?: number;
    learning_pace?: string;
    created_at?: string;
  };
  problemProgress: Array<{
    problem_id: string;
    status: string;
    difficulty: string;
    time_spent: number;
    attempts: number;
    last_attempted: string;
    completed_at?: string;
    notes?: string;
  }>;
  sessions: Array<{
    date: string;
    problems_solved: number;
    time_spent: number;
    topics_covered: string[];
    session_type: string;
    created_at: string;
  }>;
  analytics: {
    totalProblems: number;
    solvedProblems: number;
    currentStreak: number;
    longestStreak: number;
    averageTimePerProblem: number;
    favoriteTopics: string[];
    difficultyBreakdown: {
      easy: number;
      medium: number;
      hard: number;
    };
    monthlyProgress: Array<{
      month: string;
      problemsSolved: number;
      timeSpent: number;
    }>;
  };
  exportMetadata: {
    exportDate: string;
    exportVersion: string;
    dataSource: 'supabase' | 'localStorage' | 'hybrid';
    totalRecords: number;
  };
}

export class DataExportService {
  private static readonly EXPORT_VERSION = '1.0.0';

  /**
   * Export all user data in JSON format
   */
  static async exportUserData(user: User): Promise<ExportData> {
    console.log('🔄 Starting data export for user:', user.email);
    
    try {
      // Determine data source
      const isSupabaseAvailable = await this.checkSupabaseConnection();
      const dataSource = isSupabaseAvailable ? 'supabase' : 'localStorage';
      
      console.log(`📊 Using data source: ${dataSource}`);
      
      // Debug: Check what's in localStorage
      console.log('🔍 Checking localStorage data:');
      console.log('- dsa_problem_statuses:', localStorage.getItem('dsa_problem_statuses') ? 'Found' : 'Not found');
      console.log('- dsa_solved_problems:', localStorage.getItem('dsa_solved_problems') ? 'Found' : 'Not found');
      console.log('- dsa_user_sessions:', localStorage.getItem('dsa_user_sessions') ? 'Found' : 'Not found');

      // Collect all user data
      const [problemProgress, sessions, analytics] = await Promise.all([
        this.exportProblemProgress(user.id, dataSource),
        this.exportUserSessions(user.id, dataSource),
        this.exportAnalytics(user.id, dataSource)
      ]);

      // Prepare user profile data
      const userProfile = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        avatar_url: user.avatar_url,
        daily_time_limit: user.daily_time_limit,
        learning_pace: user.learning_pace,
        created_at: user.created_at
      };

      const exportData: ExportData = {
        user: userProfile,
        problemProgress,
        sessions,
        analytics,
        exportMetadata: {
          exportDate: new Date().toISOString(),
          exportVersion: this.EXPORT_VERSION,
          dataSource,
          totalRecords: problemProgress.length + sessions.length
        }
      };

      console.log('✅ Data export completed successfully');
      console.log(`📊 Export summary:`, {
        problemRecords: problemProgress.length,
        sessionRecords: sessions.length,
        solvedProblems: analytics.solvedProblems,
        currentStreak: analytics.currentStreak,
        dataSource
      });
      
      return exportData;
    } catch (error) {
      console.error('❌ Data export failed:', error);
      throw new Error(`Data export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download exported data as CSV file
   */
  static async downloadUserDataCSV(user: User): Promise<void> {
    try {
      const exportData = await this.exportUserData(user);
      
      // Convert to CSV format
      const csvContent = this.convertToCSV(exportData);
      
      // Create downloadable file
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dsa-data-export-${user.email}-${new Date().toISOString().split('T')[0]}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ CSV data download completed successfully');
    } catch (error) {
      console.error('❌ CSV data download failed:', error);
      throw error;
    }
  }

  /**
   * Download exported data as PDF file
   */
  static async downloadUserDataPDF(user: User): Promise<void> {
    try {
      const exportData = await this.exportUserData(user);
      
      // Generate HTML content for PDF conversion
      const htmlContent = this.generatePDFContent(exportData);
      
      // Create a temporary iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);
      
      // Write HTML content to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trigger print dialog (which allows saving as PDF)
        iframe.contentWindow?.print();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }
      
      console.log('✅ PDF generation initiated - use browser print dialog to save as PDF');
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * Export problem progress data
   */
  private static async exportProblemProgress(userId: string, dataSource: string) {
    if (dataSource === 'supabase') {
      try {
        const progress = await ProblemProgressService.getUserProgress(userId);
        return progress.map(p => ({
          problem_id: p.problem_id,
          status: p.status,
          difficulty: p.difficulty || 'unknown',
          time_spent: p.time_spent || 0,
          attempts: p.attempts || 1,
          last_attempted: p.updated_at,
          completed_at: p.completed_at,
          notes: p.notes
        }));
      } catch (error) {
        console.warn('⚠️ Failed to fetch from Supabase, falling back to localStorage');
        return this.exportProblemProgressFromLocalStorage();
      }
    } else {
      return this.exportProblemProgressFromLocalStorage();
    }
  }

  /**
   * Export user sessions data
   */
  private static async exportUserSessions(userId: string, dataSource: string) {
    if (dataSource === 'supabase') {
      try {
        const sessions = await UserSessionService.getUserSessions(userId);
        return sessions.map(s => ({
          date: s.session_date,
          problems_solved: s.problems_solved,
          time_spent: s.time_spent,
          topics_covered: s.topics_covered || [],
          session_type: s.session_type || 'practice',
          created_at: s.created_at
        }));
      } catch (error) {
        console.warn('⚠️ Failed to fetch sessions from Supabase, falling back to localStorage');
        return this.exportSessionsFromLocalStorage();
      }
    } else {
      return this.exportSessionsFromLocalStorage();
    }
  }

  /**
   * Export analytics data
   */
  private static async exportAnalytics(userId: string, dataSource: string) {
    try {
      console.log('📊 Collecting analytics data from localStorage...');
      
      // Get data from LocalStorageAnalytics
      const solvedCount = LocalStorageAnalytics.getSolvedProblemsCount();
      const currentStreak = LocalStorageAnalytics.getCurrentStreak();
      const longestStreak = currentStreak; // Use current streak as longest for now
      const sessions = LocalStorageAnalytics.getUserSessions();
      
      // Calculate additional metrics
      const totalTimeSpent = sessions.reduce((total, session) => total + (session.timeSpent || 0), 0);
      const averageTimePerProblem = solvedCount > 0 ? totalTimeSpent / solvedCount : 0;
      
      // Get problem statuses for difficulty breakdown
      const problemStatuses = LocalStorageAnalytics.getProblemStatuses();
      const totalProblems = Object.keys(problemStatuses).length || 500; // Default to 500 if no data
      
      // Calculate monthly progress from sessions
      const monthlyProgress = this.calculateMonthlyProgress(sessions);
      
      const analytics = {
        totalProblems,
        solvedProblems: solvedCount,
        currentStreak,
        longestStreak,
        averageTimePerProblem,
        favoriteTopics: this.extractFavoriteTopics(sessions),
        difficultyBreakdown: {
          easy: Math.floor(solvedCount * 0.4), // Estimate based on typical distribution
          medium: Math.floor(solvedCount * 0.4),
          hard: Math.floor(solvedCount * 0.2)
        },
        monthlyProgress
      };
      
      console.log('✅ Analytics data collected:', {
        solvedProblems: analytics.solvedProblems,
        currentStreak: analytics.currentStreak,
        sessionsCount: sessions.length
      });
      
      return analytics;
    } catch (error) {
      console.warn('⚠️ Failed to get analytics data:', error);
      return {
        totalProblems: 500,
        solvedProblems: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageTimePerProblem: 0,
        favoriteTopics: [],
        difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
        monthlyProgress: []
      };
    }
  }

  /**
   * Calculate monthly progress from sessions
   */
  private static calculateMonthlyProgress(sessions: any[]) {
    const monthlyData: Record<string, { problemsSolved: number; timeSpent: number }> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { problemsSolved: 0, timeSpent: 0 };
      }
      
      monthlyData[monthKey].problemsSolved += session.problemsSolved || 0;
      monthlyData[monthKey].timeSpent += session.timeSpent || 0;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      problemsSolved: data.problemsSolved,
      timeSpent: Math.round(data.timeSpent / 60) // Convert to minutes
    }));
  }

  /**
   * Extract favorite topics from sessions
   */
  private static extractFavoriteTopics(sessions: any[]): string[] {
    const topicCounts: Record<string, number> = {};
    
    sessions.forEach(session => {
      const topics = session.topicsCovered || [];
      topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    
    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Export problem progress from localStorage
   */
  private static exportProblemProgressFromLocalStorage() {
    try {
      // Use the correct localStorage key for problem statuses
      const statuses = JSON.parse(localStorage.getItem('dsa_problem_statuses') || '{}');
      const solvedProblems = JSON.parse(localStorage.getItem('dsa_solved_problems') || '[]');
      
      console.log('📊 Found localStorage data:', {
        statusesCount: Object.keys(statuses).length,
        solvedCount: solvedProblems.length
      });
      
      // Convert problem statuses to progress format
      const progressData = Object.entries(statuses).map(([problemId, status]: [string, any]) => {
        const isSolved = solvedProblems.includes(problemId);
        return {
          problem_id: problemId,
          status: status || (isSolved ? 'solved' : 'not_started'),
          difficulty: 'unknown', // We don't store difficulty in localStorage
          time_spent: 0, // We don't track individual problem time in localStorage
          attempts: 1,
          last_attempted: new Date().toISOString(),
          completed_at: isSolved ? new Date().toISOString() : undefined,
          notes: undefined
        };
      });
      
      // Also add solved problems that might not be in statuses
      solvedProblems.forEach((problemId: string) => {
        if (!statuses[problemId]) {
          progressData.push({
            problem_id: problemId,
            status: 'solved',
            difficulty: 'unknown',
            time_spent: 0,
            attempts: 1,
            last_attempted: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            notes: undefined
          });
        }
      });
      
      console.log('✅ Exported', progressData.length, 'problem progress records from localStorage');
      return progressData;
    } catch (error) {
      console.warn('⚠️ Failed to parse localStorage problem progress:', error);
      return [];
    }
  }

  /**
   * Export sessions from localStorage
   */
  private static exportSessionsFromLocalStorage() {
    try {
      // Use the correct localStorage key for user sessions
      const sessions = JSON.parse(localStorage.getItem('dsa_user_sessions') || '[]');
      
      console.log('📊 Found localStorage sessions:', sessions.length);
      
      const sessionData = sessions.map((session: any) => ({
        date: session.date || session.session_date,
        problems_solved: session.problems_solved || session.problemsSolved || 0,
        time_spent: session.time_spent || session.timeSpent || 0,
        topics_covered: session.topics_covered || session.topicsCovered || [],
        session_type: session.session_type || session.sessionType || 'practice',
        created_at: session.created_at || session.createdAt || session.date
      }));
      
      console.log('✅ Exported', sessionData.length, 'session records from localStorage');
      return sessionData;
    } catch (error) {
      console.warn('⚠️ Failed to parse localStorage sessions:', error);
      return [];
    }
  }

  /**
   * Convert export data to CSV format
   */
  private static convertToCSV(exportData: ExportData): string {
    const csvRows: string[] = [];
    
    // Add header
    csvRows.push('=== DSA TRACKER DATA EXPORT ===');
    csvRows.push(`Export Date: ${exportData.exportMetadata.exportDate}`);
    csvRows.push(`User: ${exportData.user.email}`);
    csvRows.push(`Data Source: ${exportData.exportMetadata.dataSource}`);
    csvRows.push('');
    
    // Problem Progress Section
    csvRows.push('=== PROBLEM PROGRESS ===');
    csvRows.push('Problem ID,Status,Difficulty,Time Spent (min),Attempts,Last Attempted,Completed At,Notes');
    exportData.problemProgress.forEach(p => {
      csvRows.push([
        p.problem_id,
        p.status,
        p.difficulty,
        Math.round(p.time_spent / 60),
        p.attempts,
        p.last_attempted,
        p.completed_at || '',
        (p.notes || '').replace(/,/g, ';')
      ].join(','));
    });
    
    csvRows.push('');
    
    // Sessions Section
    csvRows.push('=== STUDY SESSIONS ===');
    csvRows.push('Date,Problems Solved,Time Spent (min),Topics Covered,Session Type');
    exportData.sessions.forEach(s => {
      csvRows.push([
        s.date,
        s.problems_solved,
        Math.round(s.time_spent / 60),
        s.topics_covered.join(';'),
        s.session_type
      ].join(','));
    });
    
    csvRows.push('');
    
    // Analytics Section
    csvRows.push('=== ANALYTICS SUMMARY ===');
    csvRows.push(`Total Problems,${exportData.analytics.totalProblems}`);
    csvRows.push(`Solved Problems,${exportData.analytics.solvedProblems}`);
    csvRows.push(`Current Streak,${exportData.analytics.currentStreak}`);
    csvRows.push(`Longest Streak,${exportData.analytics.longestStreak}`);
    csvRows.push(`Average Time Per Problem (min),${Math.round(exportData.analytics.averageTimePerProblem / 60)}`);
    csvRows.push(`Easy Problems,${exportData.analytics.difficultyBreakdown.easy}`);
    csvRows.push(`Medium Problems,${exportData.analytics.difficultyBreakdown.medium}`);
    csvRows.push(`Hard Problems,${exportData.analytics.difficultyBreakdown.hard}`);
    
    return csvRows.join('\n');
  }

  /**
   * Generate PDF content using HTML and CSS
   */
  private static generatePDFContent(exportData: ExportData): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate completion percentage
    const completionRate = exportData.analytics.totalProblems > 0 
      ? Math.round((exportData.analytics.solvedProblems / exportData.analytics.totalProblems) * 100)
      : 0;

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DSA Progress Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4F46E5;
            font-size: 2.5em;
            margin: 0;
            font-weight: 700;
        }
        .header .subtitle {
            color: #6B7280;
            font-size: 1.1em;
            margin-top: 10px;
        }
        .user-info {
            background: #F8FAFC;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid #10B981;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: 700;
            color: #4F46E5;
            margin: 0;
        }
        .stat-label {
            color: #6B7280;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #1F2937;
            font-size: 1.8em;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .progress-bar {
            background: #E5E7EB;
            border-radius: 10px;
            height: 20px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            background: linear-gradient(90deg, #10B981, #059669);
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        .difficulty-breakdown {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .difficulty-item {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
        }
        .easy { background: #D1FAE5; color: #065F46; }
        .medium { background: #FEF3C7; color: #92400E; }
        .hard { background: #FEE2E2; color: #991B1B; }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table th, .table td {
            border: 1px solid #E5E7EB;
            padding: 12px;
            text-align: left;
        }
        .table th {
            background: #F9FAFB;
            font-weight: 600;
            color: #374151;
        }
        .table tr:nth-child(even) {
            background: #F9FAFB;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 0.9em;
        }
        .highlight {
            background: #FEF3C7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DSA Progress Report</h1>
        <div class="subtitle">Data Structures & Algorithms Learning Journey</div>
        <div class="subtitle">Generated on ${currentDate}</div>
    </div>

    <div class="user-info">
        <h3>👤 Student Information</h3>
        <p><strong>Name:</strong> ${exportData.user.full_name || exportData.user.username || 'N/A'}</p>
        <p><strong>Email:</strong> ${exportData.user.email}</p>
        <p><strong>Learning Pace:</strong> <span class="highlight">${exportData.user.learning_pace || 'Not set'}</span></p>
        <p><strong>Daily Time Limit:</strong> <span class="highlight">${exportData.user.daily_time_limit || 120} minutes</span></p>
        <p><strong>Data Source:</strong> ${exportData.exportMetadata.dataSource}</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">${exportData.analytics.solvedProblems}</div>
            <div class="stat-label">Problems Solved</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${completionRate}%</div>
            <div class="stat-label">Completion Rate</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${exportData.analytics.currentStreak}</div>
            <div class="stat-label">Current Streak</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${exportData.analytics.longestStreak}</div>
            <div class="stat-label">Longest Streak</div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Progress Overview</h2>
        <p><strong>Overall Progress:</strong></p>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionRate}%"></div>
        </div>
        <p style="text-align: center; margin-top: 10px;">
            <strong>${exportData.analytics.solvedProblems}</strong> out of <strong>${exportData.analytics.totalProblems}</strong> problems completed
        </p>
        
        <div class="difficulty-breakdown">
            <div class="difficulty-item easy">
                <div style="font-size: 1.5em; font-weight: bold;">${exportData.analytics.difficultyBreakdown.easy}</div>
                <div>Easy Problems</div>
            </div>
            <div class="difficulty-item medium">
                <div style="font-size: 1.5em; font-weight: bold;">${exportData.analytics.difficultyBreakdown.medium}</div>
                <div>Medium Problems</div>
            </div>
            <div class="difficulty-item hard">
                <div style="font-size: 1.5em; font-weight: bold;">${exportData.analytics.difficultyBreakdown.hard}</div>
                <div>Hard Problems</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📈 Recent Activity</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Problems Solved</th>
                    <th>Time Spent</th>
                    <th>Topics</th>
                </tr>
            </thead>
            <tbody>
                ${exportData.sessions.slice(0, 10).map(session => `
                <tr>
                    <td>${new Date(session.date).toLocaleDateString()}</td>
                    <td>${session.problems_solved}</td>
                    <td>${Math.round(session.time_spent / 60)} min</td>
                    <td>${session.topics_covered.slice(0, 3).join(', ')}${session.topics_covered.length > 3 ? '...' : ''}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ${exportData.sessions.length > 10 ? `<p><em>Showing recent 10 sessions. Total sessions: ${exportData.sessions.length}</em></p>` : ''}
    </div>

    <div class="section">
        <h2>🎯 Problem Progress Summary</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Problem ID</th>
                    <th>Status</th>
                    <th>Difficulty</th>
                    <th>Time Spent</th>
                    <th>Attempts</th>
                </tr>
            </thead>
            <tbody>
                ${exportData.problemProgress.slice(0, 15).map(problem => `
                <tr>
                    <td>${problem.problem_id}</td>
                    <td><span class="highlight">${problem.status}</span></td>
                    <td>${problem.difficulty}</td>
                    <td>${Math.round(problem.time_spent / 60)} min</td>
                    <td>${problem.attempts}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ${exportData.problemProgress.length > 15 ? `<p><em>Showing recent 15 problems. Total problems attempted: ${exportData.problemProgress.length}</em></p>` : ''}
    </div>

    <div class="section">
        <h2>📚 Learning Insights</h2>
        <div style="background: #F0F9FF; padding: 20px; border-radius: 10px; border-left: 4px solid #0EA5E9;">
            <p><strong>⏱️ Average Time per Problem:</strong> ${Math.round(exportData.analytics.averageTimePerProblem / 60)} minutes</p>
            <p><strong>🔥 Current Learning Streak:</strong> ${exportData.analytics.currentStreak} days</p>
            <p><strong>🏆 Best Streak Achievement:</strong> ${exportData.analytics.longestStreak} days</p>
            <p><strong>📊 Favorite Topics:</strong> ${exportData.analytics.favoriteTopics.slice(0, 5).join(', ') || 'Not enough data'}</p>
        </div>
    </div>

    <div class="footer">
        <p>Generated by DSA Tracker • ${currentDate}</p>
        <p>Keep up the great work on your coding journey! 🚀</p>
    </div>
</body>
</html>`;

    return htmlContent;
  }

  /**
   * Check if Supabase connection is available
   */
  private static async checkSupabaseConnection(): Promise<boolean> {
    try {
      // Check environment variables
      const hasUrl = import.meta.env.VITE_SUPABASE_URL;
      const hasKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!hasUrl || !hasKey) {
        return false;
      }
      
      // Test connection with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );
      
      const healthCheck = supabase.from('profiles').select('id').limit(1);
      
      await Promise.race([healthCheck, timeoutPromise]);
      return true;
    } catch (error) {
      console.log('📱 Supabase connection not available, using localStorage');
      return false;
    }
  }
}
