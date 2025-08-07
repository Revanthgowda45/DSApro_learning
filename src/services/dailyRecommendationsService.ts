import { supabase } from '../lib/supabase';
import type { DailyRecommendation } from '../data/progressiveAIRecommender';

export interface DailyRecommendationRecord {
  id?: string;
  user_id: string;
  date: string;
  problems: any[]; // JSON array of problem objects
  carry_over_problems: any[]; // JSON array
  new_problems: any[]; // JSON array
  total_target: number;
  completed: number;
  status: 'pending' | 'partial' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export class DailyRecommendationsService {
  /**
   * Get today's recommendations for a user
   */
  static async getTodaysRecommendations(userId: string): Promise<DailyRecommendation | null> {
    if (!supabase) {
      console.warn('Supabase not configured, cannot get daily recommendations');
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - this is expected for new days
          return null;
        }
        throw error;
      }

      // Convert database record to DailyRecommendation format
      return this.convertToRecommendation(data);
    } catch (error) {
      console.error('Error getting today\'s recommendations:', error);
      return null;
    }
  }

  /**
   * Save daily recommendations to Supabase
   */
  static async saveDailyRecommendations(
    userId: string, 
    recommendation: DailyRecommendation
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured, cannot save daily recommendations');
      return false;
    }

    try {
      const record: DailyRecommendationRecord = {
        user_id: userId,
        date: recommendation.date,
        problems: recommendation.problems,
        carry_over_problems: recommendation.carryOverProblems,
        new_problems: recommendation.newProblems,
        total_target: recommendation.totalTarget,
        completed: recommendation.completed,
        status: recommendation.status
      };

      const { error } = await supabase
        .from('daily_recommendations')
        .upsert(record, {
          onConflict: 'user_id,date'
        });

      if (error) {
        throw error;
      }

      console.log('✅ Daily recommendations saved to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Error saving daily recommendations:', error);
      return false;
    }
  }

  /**
   * Update recommendation status (when problems are completed)
   */
  static async updateRecommendationStatus(
    userId: string,
    date: string,
    completed: number,
    status: 'pending' | 'partial' | 'completed'
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured, cannot update recommendation status');
      return false;
    }

    try {
      const { error } = await supabase
        .from('daily_recommendations')
        .update({
          completed,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('date', date);

      if (error) {
        throw error;
      }

      console.log('✅ Recommendation status updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating recommendation status:', error);
      return false;
    }
  }

  /**
   * Get recommendations for a specific date range
   */
  static async getRecommendationsHistory(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyRecommendation[]> {
    if (!supabase) {
      console.warn('Supabase not configured, cannot get recommendations history');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('daily_recommendations')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return data?.map(record => this.convertToRecommendation(record)) || [];
    } catch (error) {
      console.error('Error getting recommendations history:', error);
      return [];
    }
  }

  /**
   * Check if daily recommendations need to be refreshed based on solved problems
   */
  static async shouldRefreshRecommendations(
    userId: string,
    currentSolvedProblems: Set<string>
  ): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_recommendations')
        .select('problems')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error || !data) {
        return false; // No existing recommendations, no need to refresh
      }

      // Check if any recommended problems have been solved
      const recommendedProblems = data.problems || [];
      const solvedRecommendedProblems = recommendedProblems.filter((problem: any) => 
        currentSolvedProblems.has(problem.id)
      );

      // Refresh if more than 50% of recommended problems are solved
      const shouldRefresh = solvedRecommendedProblems.length > recommendedProblems.length * 0.5;
      
      console.log('🔄 Checking if recommendations need refresh:', {
        totalRecommended: recommendedProblems.length,
        solvedRecommended: solvedRecommendedProblems.length,
        shouldRefresh
      });

      return shouldRefresh;
    } catch (error) {
      console.error('Error checking if recommendations need refresh:', error);
      return false;
    }
  }

  /**
   * Clean up old recommendations (older than 30 days)
   */
  static async cleanupOldRecommendations(userId: string): Promise<void> {
    if (!supabase) {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('daily_recommendations')
        .delete()
        .eq('user_id', userId)
        .lt('date', cutoffDate);

      if (error) {
        throw error;
      }

      console.log('✅ Old recommendations cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up old recommendations:', error);
    }
  }

  /**
   * Convert database record to DailyRecommendation format
   */
  private static convertToRecommendation(record: DailyRecommendationRecord): DailyRecommendation {
    return {
      date: record.date,
      problems: record.problems || [],
      carryOverProblems: record.carry_over_problems || [],
      newProblems: record.new_problems || [],
      totalTarget: record.total_target,
      completed: record.completed,
      status: record.status
    };
  }
}
