import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseAuthService } from './SupabaseAuthService';

export interface ProblemProgress {
  user_id: string;
  problem_id: string;
  status: 'not_started' | 'attempted' | 'solved' | 'mastered';
  is_bookmarked: boolean;
  rating?: number;
  notes?: string;
  time_spent?: number;
  created_at: string;
  updated_at: string;
}

class ProblemProgressServiceClass {
  private supabase = SupabaseAuthService.getClient();

  async updateProblemStatus(
    userId: string,
    problemId: string,
    updates: {
      status?: string;
      is_bookmarked?: boolean;
      rating?: number;
      notes?: string;
      time_spent?: number;
    }
  ): Promise<void> {
    try {
      console.log('🔄 ProblemProgress: Updating problem status...');

      // Update in Supabase
      const { error } = await this.supabase
        .from('problem_progress')
        .upsert({
          user_id: userId,
          problem_id: problemId,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ ProblemProgress: Supabase update error:', error);
        // Continue with local storage as fallback
      }

      // Update local storage as backup
      await this.updateLocalStorage(problemId, updates);

      console.log('✅ ProblemProgress: Problem status updated');
    } catch (error) {
      console.error('❌ ProblemProgress: Update failed:', error);
      // Fallback to local storage only
      await this.updateLocalStorage(problemId, updates);
    }
  }

  async getProblemProgress(userId: string, problemId: string): Promise<ProblemProgress | null> {
    try {
      // Try Supabase first
      const { data, error } = await this.supabase
        .from('problem_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .single();

      if (!error && data) {
        return data;
      }

      // Fallback to local storage
      return await this.getLocalProgress(problemId);
    } catch (error) {
      console.error('❌ ProblemProgress: Get progress failed:', error);
      return await this.getLocalProgress(problemId);
    }
  }

  async getAllUserProgress(userId: string): Promise<Record<string, ProblemProgress>> {
    try {
      // Try Supabase first
      const { data, error } = await this.supabase
        .from('problem_progress')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        const progressMap: Record<string, ProblemProgress> = {};
        data.forEach(item => {
          progressMap[item.problem_id] = item;
        });
        return progressMap;
      }

      // Fallback to local storage
      return await this.getAllLocalProgress();
    } catch (error) {
      console.error('❌ ProblemProgress: Get all progress failed:', error);
      return await this.getAllLocalProgress();
    }
  }

  async getProgressStats(userId: string): Promise<{
    total: number;
    solved: number;
    attempted: number;
    mastered: number;
    bookmarked: number;
  }> {
    try {
      const allProgress = await this.getAllUserProgress(userId);
      const stats = {
        total: Object.keys(allProgress).length,
        solved: 0,
        attempted: 0,
        mastered: 0,
        bookmarked: 0,
      };

      Object.values(allProgress).forEach(progress => {
        if (progress.status === 'solved') stats.solved++;
        if (progress.status === 'attempted') stats.attempted++;
        if (progress.status === 'mastered') stats.mastered++;
        if (progress.is_bookmarked) stats.bookmarked++;
      });

      return stats;
    } catch (error) {
      console.error('❌ ProblemProgress: Get stats failed:', error);
      return {
        total: 0,
        solved: 0,
        attempted: 0,
        mastered: 0,
        bookmarked: 0,
      };
    }
  }

  private async updateLocalStorage(
    problemId: string,
    updates: {
      status?: string;
      is_bookmarked?: boolean;
      rating?: number;
      notes?: string;
      time_spent?: number;
    }
  ): Promise<void> {
    try {
      // Update status
      if (updates.status) {
        const statusKey = 'dsa_problem_statuses';
        const existingStatuses = await AsyncStorage.getItem(statusKey);
        const statuses = existingStatuses ? JSON.parse(existingStatuses) : {};
        statuses[problemId] = updates.status;
        await AsyncStorage.setItem(statusKey, JSON.stringify(statuses));
      }

      // Update bookmarks
      if (updates.is_bookmarked !== undefined) {
        const bookmarkKey = 'dsa_problem_bookmarks';
        const existingBookmarks = await AsyncStorage.getItem(bookmarkKey);
        const bookmarks = existingBookmarks ? JSON.parse(existingBookmarks) : {};
        bookmarks[problemId] = updates.is_bookmarked;
        await AsyncStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
      }

      // Update ratings
      if (updates.rating !== undefined) {
        const ratingKey = 'dsa_problem_ratings';
        const existingRatings = await AsyncStorage.getItem(ratingKey);
        const ratings = existingRatings ? JSON.parse(existingRatings) : {};
        ratings[problemId] = updates.rating;
        await AsyncStorage.setItem(ratingKey, JSON.stringify(ratings));
      }

      // Update notes
      if (updates.notes !== undefined) {
        const notesKey = 'dsa_problem_notes';
        const existingNotes = await AsyncStorage.getItem(notesKey);
        const notes = existingNotes ? JSON.parse(existingNotes) : {};
        notes[problemId] = updates.notes;
        await AsyncStorage.setItem(notesKey, JSON.stringify(notes));
      }

      // Update time spent
      if (updates.time_spent !== undefined) {
        const timeKey = 'dsa_problem_time';
        const existingTime = await AsyncStorage.getItem(timeKey);
        const timeSpent = existingTime ? JSON.parse(existingTime) : {};
        timeSpent[problemId] = updates.time_spent;
        await AsyncStorage.setItem(timeKey, JSON.stringify(timeSpent));
      }
    } catch (error) {
      console.error('❌ ProblemProgress: Local storage update failed:', error);
    }
  }

  private async getLocalProgress(problemId: string): Promise<ProblemProgress | null> {
    try {
      const [statusData, bookmarkData, ratingData, notesData, timeData] = await Promise.all([
        AsyncStorage.getItem('dsa_problem_statuses'),
        AsyncStorage.getItem('dsa_problem_bookmarks'),
        AsyncStorage.getItem('dsa_problem_ratings'),
        AsyncStorage.getItem('dsa_problem_notes'),
        AsyncStorage.getItem('dsa_problem_time'),
      ]);

      const statuses = statusData ? JSON.parse(statusData) : {};
      const bookmarks = bookmarkData ? JSON.parse(bookmarkData) : {};
      const ratings = ratingData ? JSON.parse(ratingData) : {};
      const notes = notesData ? JSON.parse(notesData) : {};
      const timeSpent = timeData ? JSON.parse(timeData) : {};

      if (statuses[problemId] || bookmarks[problemId] || ratings[problemId] || notes[problemId] || timeSpent[problemId]) {
        return {
          user_id: 'local',
          problem_id: problemId,
          status: statuses[problemId] || 'not_started',
          is_bookmarked: bookmarks[problemId] || false,
          rating: ratings[problemId],
          notes: notes[problemId],
          time_spent: timeSpent[problemId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('❌ ProblemProgress: Get local progress failed:', error);
      return null;
    }
  }

  private async getAllLocalProgress(): Promise<Record<string, ProblemProgress>> {
    try {
      const [statusData, bookmarkData, ratingData, notesData, timeData] = await Promise.all([
        AsyncStorage.getItem('dsa_problem_statuses'),
        AsyncStorage.getItem('dsa_problem_bookmarks'),
        AsyncStorage.getItem('dsa_problem_ratings'),
        AsyncStorage.getItem('dsa_problem_notes'),
        AsyncStorage.getItem('dsa_problem_time'),
      ]);

      const statuses = statusData ? JSON.parse(statusData) : {};
      const bookmarks = bookmarkData ? JSON.parse(bookmarkData) : {};
      const ratings = ratingData ? JSON.parse(ratingData) : {};
      const notes = notesData ? JSON.parse(notesData) : {};
      const timeSpent = timeData ? JSON.parse(timeData) : {};

      const allProblemIds = new Set([
        ...Object.keys(statuses),
        ...Object.keys(bookmarks),
        ...Object.keys(ratings),
        ...Object.keys(notes),
        ...Object.keys(timeSpent),
      ]);

      const progressMap: Record<string, ProblemProgress> = {};

      allProblemIds.forEach(problemId => {
        progressMap[problemId] = {
          user_id: 'local',
          problem_id: problemId,
          status: statuses[problemId] || 'not_started',
          is_bookmarked: bookmarks[problemId] || false,
          rating: ratings[problemId],
          notes: notes[problemId],
          time_spent: timeSpent[problemId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      return progressMap;
    } catch (error) {
      console.error('❌ ProblemProgress: Get all local progress failed:', error);
      return {};
    }
  }

  async syncLocalToSupabase(userId: string): Promise<void> {
    try {
      console.log('🔄 ProblemProgress: Syncing local data to Supabase...');

      const localProgress = await this.getAllLocalProgress();
      
      if (Object.keys(localProgress).length === 0) {
        console.log('📱 ProblemProgress: No local data to sync');
        return;
      }

      // Prepare data for batch upsert
      const progressData = Object.values(localProgress).map(progress => ({
        ...progress,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('problem_progress')
        .upsert(progressData);

      if (error) {
        console.error('❌ ProblemProgress: Sync to Supabase failed:', error);
      } else {
        console.log('✅ ProblemProgress: Successfully synced to Supabase');
      }
    } catch (error) {
      console.error('❌ ProblemProgress: Sync failed:', error);
    }
  }
}

export const ProblemProgressService = new ProblemProgressServiceClass();
