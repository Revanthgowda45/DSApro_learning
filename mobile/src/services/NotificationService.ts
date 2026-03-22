import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface NotificationSettings {
  dailyReminder: boolean;
  morningStartTime: string;
  afternoonBoostTime: string;
  eveningPracticeTime: string;
  nightReflectionTime: string;
  enableNightReflection: boolean;
  streakReminders: boolean;
  achievementNotifications: boolean;
  weeklyGoalReminders: boolean;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationServiceClass {
  private settings: NotificationSettings = {
    dailyReminder: true,
    morningStartTime: '09:00',
    afternoonBoostTime: '14:00',
    eveningPracticeTime: '18:00',
    nightReflectionTime: '21:00',
    enableNightReflection: true,
    streakReminders: true,
    achievementNotifications: true,
    weeklyGoalReminders: true,
  };

  private scheduledNotifications: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      console.log('🔄 NotificationService: Initializing...');

      // Request permissions
      await this.requestPermissions();

      // Load settings
      await this.loadSettings();

      // Schedule notifications if enabled
      if (this.settings.dailyReminder) {
        await this.scheduleProfessionalNotifications();
      }

      console.log('✅ NotificationService: Initialized successfully');
    } catch (error) {
      console.error('❌ NotificationService: Initialization failed:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ NotificationService: Permission not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'DSA Tracker',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });
      }

      console.log('✅ NotificationService: Permissions granted');
      return true;
    } catch (error) {
      console.error('❌ NotificationService: Permission request failed:', error);
      return false;
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      console.log('🔄 NotificationService: Updating settings...');

      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();

      // Reschedule notifications
      await this.cancelAllNotifications();
      if (this.settings.dailyReminder) {
        await this.scheduleProfessionalNotifications();
      }

      console.log('✅ NotificationService: Settings updated');
    } catch (error) {
      console.error('❌ NotificationService: Update settings failed:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async scheduleProfessionalNotifications(): Promise<void> {
    try {
      console.log('🔄 NotificationService: Scheduling professional notifications...');

      const schedule = this.getProfessionalSchedule();
      
      for (const notification of schedule) {
        await this.scheduleNotification(notification);
      }

      console.log('✅ NotificationService: Professional notifications scheduled');
    } catch (error) {
      console.error('❌ NotificationService: Schedule notifications failed:', error);
    }
  }

  private getProfessionalSchedule() {
    const schedule = [
      {
        id: 'morning-start',
        title: '🌅 Morning DSA Practice',
        body: 'Good morning! Ready to start your day with some algorithm practice?',
        time: this.settings.morningStartTime,
        priority: 'high' as const,
      },
      {
        id: 'afternoon-boost',
        title: '⚡ Afternoon Coding Break',
        body: 'Time for a productive coding session! Solve a quick problem to boost your skills.',
        time: this.settings.afternoonBoostTime,
        priority: 'medium' as const,
      },
      {
        id: 'evening-practice',
        title: '🌆 Evening Problem Solving',
        body: 'End your day strong! Practice some DSA problems before wrapping up.',
        time: this.settings.eveningPracticeTime,
        priority: 'high' as const,
      },
    ];

    // Add night reflection if enabled
    if (this.settings.enableNightReflection) {
      schedule.push({
        id: 'night-reflection',
        title: '🌙 Daily Reflection',
        body: 'How did your coding practice go today? Review your progress and plan tomorrow.',
        time: this.settings.nightReflectionTime,
        priority: 'low' as const,
      });
    }

    return schedule;
  }

  private async scheduleNotification(notification: {
    id: string;
    title: string;
    body: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
  }): Promise<void> {
    try {
      const [hours, minutes] = notification.time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: true,
          priority: notification.priority === 'high' ? 
            Notifications.AndroidNotificationPriority.HIGH : 
            Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger,
      });

      this.scheduledNotifications.add(notificationId);
      console.log(`📅 NotificationService: Scheduled ${notification.id} for ${notification.time}`);
    } catch (error) {
      console.error(`❌ NotificationService: Failed to schedule ${notification.id}:`, error);
    }
  }

  async showAchievementNotification(achievement: string): Promise<void> {
    if (!this.settings.achievementNotifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Achievement Unlocked!',
          body: achievement,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ NotificationService: Achievement notification failed:', error);
    }
  }

  async showStreakReminder(streak: number): Promise<void> {
    if (!this.settings.streakReminders) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Keep Your Streak Alive!',
          body: `You're on a ${streak}-day streak! Don't break it now.`,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ NotificationService: Streak reminder failed:', error);
    }
  }

  async showProblemCompletionNotification(problemTitle: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Problem Solved!',
          body: `Great job solving "${problemTitle}"! Keep up the momentum.`,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ NotificationService: Problem completion notification failed:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      console.log('🗑️ NotificationService: All notifications cancelled');
    } catch (error) {
      console.error('❌ NotificationService: Cancel notifications failed:', error);
    }
  }

  async resetTimingToDefaults(): Promise<void> {
    const defaultSettings: Partial<NotificationSettings> = {
      morningStartTime: '09:00',
      afternoonBoostTime: '14:00',
      eveningPracticeTime: '18:00',
      nightReflectionTime: '21:00',
      enableNightReflection: true,
    };

    await this.updateSettings(defaultSettings);
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('dsa_notification_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        console.log('📱 NotificationService: Settings loaded from storage');
      }
    } catch (error) {
      console.error('❌ NotificationService: Load settings failed:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('dsa_notification_settings', JSON.stringify(this.settings));
      console.log('💾 NotificationService: Settings saved to storage');
    } catch (error) {
      console.error('❌ NotificationService: Save settings failed:', error);
    }
  }
}

export const NotificationService = new NotificationServiceClass();
