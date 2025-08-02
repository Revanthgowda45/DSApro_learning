import { supabase } from '../lib/supabase'
import type { Database, Tables, Inserts, Updates } from '../lib/supabase'

type ProblemProgress = Tables<'problem_progress'>
type ProblemProgressInsert = Inserts<'problem_progress'>
type ProblemProgressUpdate = Updates<'problem_progress'>

export class ProblemProgressService {
  // Get user's problem progress with real-time subscription
  static async getUserProgress(userId: string): Promise<ProblemProgress[]> {
    const { data, error } = await supabase
      .from('problem_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching user progress:', error)
      throw error
    }
    
    return data || []
  }

  // Get progress for a specific problem
  static async getProblemProgress(userId: string, problemId: string): Promise<ProblemProgress | null> {
    const { data, error } = await supabase
      .from('problem_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching problem progress:', error)
      throw error
    }
    
    return data
  }

  // Update problem status with real-time sync
  static async updateProblemStatus(
    userId: string, 
    problemId: string, 
    updates: ProblemProgressUpdate
  ): Promise<ProblemProgress> {
    const updateData: ProblemProgressInsert = {
      user_id: userId,
      problem_id: problemId,
      status: updates.status || 'not-started',
      notes: updates.notes,
      rating: updates.rating,
      time_spent: updates.time_spent || 0,
      attempts: updates.attempts || 0,
      is_bookmarked: updates.is_bookmarked || false,
      solved_at: updates.solved_at,
      ...updates
    }

    const { data, error } = await supabase
      .from('problem_progress')
      .upsert(updateData, {
        onConflict: 'user_id,problem_id'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error updating problem status:', error)
      throw error
    }
    
    // Update user analytics in real-time
    await this.updateUserAnalytics(userId)
    
    return data
  }

  // Delete problem progress (reset to not-started)
  static async deleteProblemProgress(userId: string, problemId: string): Promise<void> {
    const { error } = await supabase
      .from('problem_progress')
      .delete()
      .eq('user_id', userId)
      .eq('problem_id', problemId)
    
    if (error) {
      console.error('Error deleting problem progress:', error)
      throw error
    }
    
    // Update user analytics after deletion
    await this.updateUserAnalytics(userId)
  }

  // Bulk update multiple problems
  static async bulkUpdateProblems(
    userId: string,
    updates: Array<{ problemId: string; updates: ProblemProgressUpdate }>
  ): Promise<ProblemProgress[]> {
    const updateData = updates.map(({ problemId, updates }) => ({
      user_id: userId,
      problem_id: problemId,
      status: updates.status || 'not-started',
      ...updates
    }))

    const { data, error } = await supabase
      .from('problem_progress')
      .upsert(updateData, {
        onConflict: 'user_id,problem_id'
      })
      .select()
    
    if (error) {
      console.error('Error bulk updating problems:', error)
      throw error
    }
    
    await this.updateUserAnalytics(userId)
    
    return data || []
  }

  // Real-time subscription for problem progress changes
  static subscribeToProgress(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`problem_progress:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problem_progress',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    const progress = await this.getUserProgress(userId)
    
    const stats = {
      totalProblems: progress.length,
      solvedProblems: progress.filter(p => p.status === 'solved' || p.status === 'mastered').length,
      attemptedProblems: progress.filter(p => p.status === 'attempted').length,
      masteredProblems: progress.filter(p => p.status === 'mastered').length,
      bookmarkedProblems: progress.filter(p => p.is_bookmarked).length,
      averageRating: this.calculateAverageRating(progress),
      totalTimeSpent: progress.reduce((sum, p) => sum + p.time_spent, 0),
      currentStreak: await this.calculateStreak(userId),
      topicProgress: this.calculateTopicProgress(progress)
    }
    
    return stats
  }

  // Calculate average rating
  private static calculateAverageRating(progress: ProblemProgress[]): number {
    const ratedProblems = progress.filter(p => p.rating && p.rating > 0)
    if (ratedProblems.length === 0) return 0
    
    const totalRating = ratedProblems.reduce((sum, p) => sum + (p.rating || 0), 0)
    return Math.round((totalRating / ratedProblems.length) * 10) / 10
  }

  // Calculate topic-wise progress
  private static calculateTopicProgress(progress: ProblemProgress[]) {
    // This would need to be enhanced with actual topic mapping from dsa.json
    const topicStats: Record<string, { total: number; solved: number }> = {}
    
    // For now, return empty object - this would be populated with actual topic data
    return topicStats
  }

  // Update user analytics in real-time
  private static async updateUserAnalytics(userId: string) {
    try {
      const stats = await this.getUserStats(userId)
      
      // Update AI insights with latest stats
      await supabase
        .from('ai_insights')
        .upsert({
          user_id: userId,
          insight_type: 'progress_update',
          data: {
            ...stats,
            updated_at: new Date().toISOString()
          },
          confidence_score: 0.95
        }, {
          onConflict: 'user_id,insight_type'
        })
      
      // Update today's session
      await this.updateTodaySession(userId, stats)
      
    } catch (error) {
      console.error('Error updating user analytics:', error)
    }
  }

  // Update today's session data
  private static async updateTodaySession(userId: string, stats: any) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single()
    
    const sessionData = {
      user_id: userId,
      session_date: today,
      problems_solved: stats.solvedProblems,
      time_spent: stats.totalTimeSpent,
      topics_covered: Object.keys(stats.topicProgress),
      streak_day: stats.currentStreak
    }
    
    if (existingSession) {
      await supabase
        .from('user_sessions')
        .update(sessionData)
        .eq('id', existingSession.id)
    } else {
      await supabase
        .from('user_sessions')
        .insert(sessionData)
    }
  }

  // Calculate streak from session data
  private static async calculateStreak(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_sessions')
      .select('session_date, problems_solved')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(30)
    
    if (!data || data.length === 0) return 0
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < data.length; i++) {
      const sessionDate = new Date(data[i].session_date)
      sessionDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (sessionDate.getTime() === expectedDate.getTime() && data[i].problems_solved > 0) {
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

  // Get recent activity
  static async getRecentActivity(userId: string, limit: number = 10): Promise<ProblemProgress[]> {
    const { data, error } = await supabase
      .from('problem_progress')
      .select('*')
      .eq('user_id', userId)
      .not('solved_at', 'is', null)
      .order('solved_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
    
    return data || []
  }

  // Search problems by status, topic, etc.
  static async searchProblems(
    userId: string,
    filters: {
      status?: string
      isBookmarked?: boolean
      hasNotes?: boolean
      minRating?: number
    }
  ): Promise<ProblemProgress[]> {
    let query = supabase
      .from('problem_progress')
      .select('*')
      .eq('user_id', userId)
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.isBookmarked !== undefined) {
      query = query.eq('is_bookmarked', filters.isBookmarked)
    }
    
    if (filters.hasNotes) {
      query = query.not('notes', 'is', null)
    }
    
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating)
    }
    
    const { data, error } = await query.order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error searching problems:', error)
      throw error
    }
    
    return data || []
  }
}
