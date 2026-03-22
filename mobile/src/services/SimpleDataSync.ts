import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseAuthService } from './SupabaseAuthService';

class SimpleDataSyncClass {
  private supabase = SupabaseAuthService.getClient();
  private userId: string | null = null;
  private syncInProgress = false;

  async initialize(userId: string): Promise<void> {
    try {
      console.log('🔄 SimpleDataSync: Initializing for user:', userId);
      this.userId = userId;
      
      // Perform initial sync
      await this.syncData();
      
      console.log('✅ SimpleDataSync: Initialized successfully');
    } catch (error) {
      console.error('❌ SimpleDataSync: Initialization failed:', error);
    }
  }

  async syncData(): Promise<void> {
    if (!this.userId || this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      console.log('🔄 SimpleDataSync: Starting data sync...');

      // Sync problem progress
      await this.syncProblemProgress();
      
      // Sync user sessions
      await this.syncUserSessions();
      
      // Sync notification settings
      await this.syncNotificationSettings();

      console.log('✅ SimpleDataSync: Data sync completed');
    } catch (error) {
      console.error('❌ SimpleDataSync: Data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncProblemProgress(): Promise<void> {
    try {
      // Load local problem progress
      const [statusData, bookmarkData, ratingData, notesData, timeData] = await Promise.all([
        AsyncStorage.getItem('dsa_problem_statuses'),
        AsyncStorage.getItem('dsa_problem_bookmarks'),
        AsyncStorage.getItem('dsa_problem_ratings'),
        AsyncStorage.getItem('dsa_problem_notes'),
        AsyncStorage.getItem('dsa_problem_time'),
      ]);

      const localStatuses = statusData ? JSON.parse(statusData) : {};
      const localBookmarks = bookmarkData ? JSON.parse(bookmarkData) : {};
      const localRatings = ratingData ? JSON.parse(ratingData) : {};
      const localNotes = notesData ? JSON.parse(notesData) : {};
      const localTimes = timeData ? JSON.parse(timeData) : {};

      // Get all unique problem IDs
      const allProblemIds = new Set([
        ...Object.keys(localStatuses),
        ...Object.keys(localBookmarks),
        ...Object.keys(localRatings),
        ...Object.keys(localNotes),
        ...Object.keys(localTimes),
      ]);

      if (allProblemIds.size === 0) {
        console.log('📱 SimpleDataSync: No local problem progress to sync');
        return;
      }

      // Prepare data for Supabase
      const progressData = Array.from(allProblemIds).map(problemId => ({
        user_id: this.userId,
        problem_id: problemId,
        status: localStatuses[problemId] || 'not_started',
        is_bookmarked: localBookmarks[problemId] || false,
        rating: localRatings[problemId] || null,
        notes: localNotes[problemId] || null,
        time_spent: localTimes[problemId] || null,
        updated_at: new Date().toISOString(),
      }));

      // Sync to Supabase
      const { error } = await this.supabase
        .from('problem_progress')
        .upsert(progressData);

      if (error) {
        console.error('❌ SimpleDataSync: Problem progress sync failed:', error);
      } else {
        console.log('✅ SimpleDataSync: Problem progress synced successfully');
      }
    } catch (error) {
      console.error('❌ SimpleDataSync: Problem progress sync error:', error);
    }
  }

  private async syncUserSessions(): Promise<void> {
    try {
      // Load local session data
      const sessionKeys = await AsyncStorage.getAllKeys();
      const userSessionKeys = sessionKeys.filter(key => 
        key.startsWith(`session_${this.userId}_`)
      );

      if (userSessionKeys.length === 0) {
        console.log('📱 SimpleDataSync: No local sessions to sync');
        return;
      }

      const sessionData = await AsyncStorage.multiGet(userSessionKeys);
      const sessions = sessionData.map(([key, value]) => {
        if (!value) return null;
        
        const dateStr = key.split('_')[2]; // Extract date from key
        const session = JSON.parse(value);
        
        return {
          user_id: this.userId,
          date: dateStr,
          problems_solved: session.problems_solved || 0,
          time_spent: session.time_spent || 0,
          streak_count: session.streak_count || 0,
          updated_at: new Date().toISOString(),
        };
      }).filter(Boolean);

      if (sessions.length === 0) return;

      // Sync to Supabase
      const { error } = await this.supabase
        .from('user_sessions')
        .upsert(sessions);

      if (error) {
        console.error('❌ SimpleDataSync: User sessions sync failed:', error);
      } else {
        console.log('✅ SimpleDataSync: User sessions synced successfully');
      }
    } catch (error) {
      console.error('❌ SimpleDataSync: User sessions sync error:', error);
    }
  }

  private async syncNotificationSettings(): Promise<void> {
    try {
      const settingsData = await AsyncStorage.getItem('dsa_notification_settings');
      if (!settingsData) {
        console.log('📱 SimpleDataSync: No notification settings to sync');
        return;
      }

      const settings = JSON.parse(settingsData);
      
      // Sync to Supabase user preferences
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: this.userId,
          notification_settings: settings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ SimpleDataSync: Notification settings sync failed:', error);
      } else {
        console.log('✅ SimpleDataSync: Notification settings synced successfully');
      }
    } catch (error) {
      console.error('❌ SimpleDataSync: Notification settings sync error:', error);
    }
  }

  async migrateLocalToSupabase(): Promise<void> {
    if (!this.userId) {
      console.warn('⚠️ SimpleDataSync: No user ID available for migration');
      return;
    }

    try {
      console.log('🔄 SimpleDataSync: Starting local to Supabase migration...');
      await this.syncData();
      console.log('✅ SimpleDataSync: Migration completed successfully');
    } catch (error) {
      console.error('❌ SimpleDataSync: Migration failed:', error);
    }
  }

  async downloadSupabaseData(): Promise<void> {
    if (!this.userId) {
      console.warn('⚠️ SimpleDataSync: No user ID available for download');
      return;
    }

    try {
      console.log('🔄 SimpleDataSync: Downloading data from Supabase...');

      // Download problem progress
      const { data: progressData, error: progressError } = await this.supabase
        .from('problem_progress')
        .select('*')
        .eq('user_id', this.userId);

      if (progressError) {
        console.error('❌ SimpleDataSync: Failed to download problem progress:', progressError);
      } else if (progressData && progressData.length > 0) {
        // Convert to local storage format
        const statuses: Record<string, string> = {};
        const bookmarks: Record<string, boolean> = {};
        const ratings: Record<string, number> = {};
        const notes: Record<string, string> = {};
        const times: Record<string, number> = {};

        progressData.forEach(item => {
          if (item.status) statuses[item.problem_id] = item.status;
          if (item.is_bookmarked) bookmarks[item.problem_id] = item.is_bookmarked;
          if (item.rating) ratings[item.problem_id] = item.rating;
          if (item.notes) notes[item.problem_id] = item.notes;
          if (item.time_spent) times[item.problem_id] = item.time_spent;
        });

        // Save to local storage
        await Promise.all([
          AsyncStorage.setItem('dsa_problem_statuses', JSON.stringify(statuses)),
          AsyncStorage.setItem('dsa_problem_bookmarks', JSON.stringify(bookmarks)),
          AsyncStorage.setItem('dsa_problem_ratings', JSON.stringify(ratings)),
          AsyncStorage.setItem('dsa_problem_notes', JSON.stringify(notes)),
          AsyncStorage.setItem('dsa_problem_time', JSON.stringify(times)),
        ]);

        console.log('✅ SimpleDataSync: Problem progress downloaded successfully');
      }

      // Download user sessions
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', this.userId);

      if (sessionError) {
        console.error('❌ SimpleDataSync: Failed to download user sessions:', sessionError);
      } else if (sessionData && sessionData.length > 0) {
        // Save sessions to local storage
        const sessionPromises = sessionData.map(session => {
          const key = `session_${this.userId}_${session.date}`;
          const value = {
            problems_solved: session.problems_solved,
            time_spent: session.time_spent,
            streak_count: session.streak_count,
          };
          return AsyncStorage.setItem(key, JSON.stringify(value));
        });

        await Promise.all(sessionPromises);
        console.log('✅ SimpleDataSync: User sessions downloaded successfully');
      }

      console.log('✅ SimpleDataSync: Data download completed');
    } catch (error) {
      console.error('❌ SimpleDataSync: Data download failed:', error);
    }
  }
}

export const SimpleDataSync = new SimpleDataSyncClass();
