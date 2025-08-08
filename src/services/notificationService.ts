export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // Legacy - kept for compatibility
  streakReminder: boolean;
  weeklyGoalReminder: boolean;
  motivationalMessages: boolean;
  // Professional schedule times
  morningStartTime: string;
  afternoonBoostTime: string;
  eveningPracticeTime: string;
  nightReflectionTime: string;
  enableNightReflection: boolean;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export class NotificationService {
  private static readonly STORAGE_KEY = 'dsa_notification_settings';
  private static readonly DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    dailyReminder: true,
    reminderTime: '09:00', // Legacy
    streakReminder: true,
    weeklyGoalReminder: true,
    motivationalMessages: true,
    // Professional schedule defaults
    morningStartTime: '09:00',
    afternoonBoostTime: '14:00',
    eveningPracticeTime: '18:00',
    nightReflectionTime: '21:00',
    enableNightReflection: true
  };

  /**
   * Get professional notification schedule based on user settings
   */
  private static getProfessionalSchedule(): Array<{ time: string; type: string; priority: string }> {
    const settings = this.getSettings();
    const schedule = [
      { time: settings.morningStartTime, type: 'morning_start', priority: 'high' },
      { time: settings.afternoonBoostTime, type: 'afternoon_boost', priority: 'medium' },
      { time: settings.eveningPracticeTime, type: 'evening_practice', priority: 'high' }
    ];
    
    // Add night reflection if enabled
    if (settings.enableNightReflection) {
      schedule.push({ time: settings.nightReflectionTime, type: 'night_review', priority: 'low' });
    }
    
    return schedule;
  }

  private static notificationPermission: NotificationPermission = 'default';
  private static scheduledNotifications: Map<string, number> = new Map();

  /**
   * Initialize the notification service
   */
  static async initialize(): Promise<void> {
    console.log('🔔 Initializing Notification Service...');
    
    // Check if notifications are supported
    if (!this.isSupported()) {
      console.warn('⚠️ Notifications are not supported in this browser');
      return;
    }

    // Check current permission status
    this.notificationPermission = Notification.permission;
    console.log('🔔 Current notification permission:', this.notificationPermission);

    // Load user settings
    const settings = this.getSettings();
    
    if (settings.enabled && this.notificationPermission === 'default') {
      await this.requestPermission();
    }

    // Schedule professional daily notifications if enabled
    if (settings.enabled && settings.dailyReminder) {
      this.scheduleProfessionalNotifications();
    }

    // Register service worker for background notifications
    await this.registerServiceWorker();
    
    // Setup service worker communication
    this.setupServiceWorkerCommunication();
    
    // Schedule persistent background notifications
    if (settings.enabled && settings.dailyReminder) {
      await this.scheduleBackgroundNotifications(settings);
    }
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      console.log('🔔 Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a notification
   */
  static async showNotification(data: NotificationData): Promise<boolean> {
    if (!this.canShowNotifications()) {
      console.warn('⚠️ Cannot show notifications - permission denied or not supported');
      return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        tag: data.tag,
        requireInteraction: data.requireInteraction || false
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to problems page if it's a daily reminder
        if (data.tag === 'daily-reminder') {
          window.location.href = '/problems';
        }
      };

      // Auto-close after 10 seconds if not requiring interaction
      if (!data.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      console.log('✅ Notification shown:', data.title);
      return true;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return false;
    }
  }

  /**
   * Schedule professional daily notifications (3-4 per day)
   */
  static scheduleProfessionalNotifications(): void {
    // Clear existing notifications
    this.clearAllScheduledNotifications();
    
    const today = new Date();

    
    // Schedule each notification in the daily schedule
    const professionalSchedule = this.getProfessionalSchedule();
    professionalSchedule.forEach((schedule) => {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= today) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      // Skip low priority notifications if user is likely busy
      if (schedule.priority === 'low' && this.isUserLikelyBusy(hours)) {
        return;
      }
      
      const timeUntilNotification = scheduledTime.getTime() - today.getTime();
      const notificationId = `professional-${schedule.type}`;
      
      console.log(`📅 Professional notification scheduled: ${schedule.type} at ${scheduledTime.toLocaleString()}`);
      
      // Schedule initial notification
      const timeoutId = setTimeout(async () => {
        await this.showProfessionalNotification(schedule.type);
        
        // Schedule follow-up notifications for practice sessions (not night reflection)
        if (schedule.type !== 'night-reflection') {
          this.scheduleFollowUpNotifications(schedule.type);
        }
        
        // Reschedule for next day
        this.scheduleProfessionalNotifications();
      }, timeUntilNotification) as unknown as number;
      
      this.scheduledNotifications.set(notificationId, timeoutId);
    });
  }
  
  /**
   * Check if user is likely busy at given hour
   */
  private static isUserLikelyBusy(hour: number): boolean {
    // Skip late night notifications on weekdays
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    return isWeekday && hour >= 22; // After 10 PM on weekdays
  }

  /**
   * Schedule follow-up notifications at 3, 20, and 40 minutes after initial notification
   */
  private static scheduleFollowUpNotifications(type: string): void {
    const followUpTimes = [3, 20, 40]; // Minutes after initial notification
    const now = new Date();
    
    console.log(`🔔 Scheduling follow-up notifications for ${type} starting from ${now.toLocaleString()}`);
    
    followUpTimes.forEach((minutesDelay, index) => {
      const followUpTime = new Date(now.getTime() + (minutesDelay * 60 * 1000));
      const timeUntilFollowUp = minutesDelay * 60 * 1000; // Convert minutes to milliseconds
      const followUpId = `${type}-followup-${index + 1}`;
      
      console.log(`📅 Follow-up notification scheduled: ${type} follow-up ${index + 1} in ${minutesDelay} minutes at ${followUpTime.toLocaleString()}`);
      
      const timeoutId = setTimeout(async () => {
        console.log(`🔔 Sending follow-up notification: ${type} follow-up ${index + 1}`);
        await this.showFollowUpNotification(type, index + 1);
      }, timeUntilFollowUp) as unknown as number;
      
      this.scheduledNotifications.set(followUpId, timeoutId);
    });
  }

  /**
   * Show professional notification based on type and time
   */
  static async showProfessionalNotification(type: string): Promise<void> {
    const userProgress = this.getUserProgress();
    
    let title = "DSA Practice";
    let body = "";
    
    switch (type) {
      case 'morning_start':
        title = "Good Morning! 🌅";
        if (userProgress.solvedToday > 0) {
          body = `Great start! You've already solved ${userProgress.solvedToday} problems today. Keep the momentum going!`;
        } else {
          body = "Start your day strong with some problem-solving practice. Your future self will thank you!";
        }
        break;
        
      case 'afternoon_boost':
        title = "Afternoon Focus Time 🎯";
        if (userProgress.solvedToday > 0) {
          body = `Excellent progress! ${userProgress.solvedToday} problems completed. Ready for an afternoon challenge?`;
        } else {
          body = "Perfect time for a productive coding session. Even 20 minutes can make a difference!";
        }
        break;
        
      case 'evening_practice':
        title = "Evening Practice Session 🌆";
        if (userProgress.solvedToday >= 3) {
          body = `Outstanding day! ${userProgress.solvedToday} problems solved. Consider reviewing or tackling one more?`;
        } else if (userProgress.solvedToday > 0) {
          body = `Good work today! ${userProgress.solvedToday} problems down. How about one more before dinner?`;
        } else {
          body = "End your day productively with some algorithm practice. Your skills compound daily!";
        }
        break;
        
      case 'night_review':
        title = "Night Reflection 🌙";
        if (userProgress.solvedToday > 0) {
          body = `Well done today! ${userProgress.solvedToday} problems completed. Tomorrow's another opportunity to grow!`;
        } else {
          body = "Tomorrow is a fresh start for your coding journey. Set yourself up for success!";
        }
        break;
        
      default:
        body = "Time for your DSA practice session!";
    }
    
    // Add streak information for motivation
    if (userProgress.currentStreak > 0 && type !== 'night_review') {
      body += ` Your ${userProgress.currentStreak}-day streak is impressive! 🔥`;
    }
    
    await this.showNotification({
      title,
      body,
      tag: `professional-${type}`
    });
  }

  /**
   * Show daily reminder notification
   */
  static async showDailyReminder(): Promise<void> {
    const messages = [
      "🚀 Ready to tackle some coding problems today?",
      "💪 Your daily DSA practice is waiting!",
      "🎯 Time to level up your problem-solving skills!",
      "🔥 Keep your coding streak alive - solve problems now!",
      "⚡ Daily practice makes perfect - let's code!",
      "🏆 Your future self will thank you for practicing today!",
      "🧠 Exercise your brain with some algorithms!",
      "📈 Consistent practice leads to coding mastery!"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.showNotification({
      title: "DSA Practice Reminder",
      body: randomMessage,
      tag: 'daily-reminder',
      requireInteraction: true
    });
  }

  /**
   * Show follow-up notification for practice sessions
   */
  static async showFollowUpNotification(type: string, followUpNumber: number): Promise<void> {
    const followUpMessages = this.getFollowUpMessages(type, followUpNumber);
    
    await this.showNotification({
      title: followUpMessages.title,
      body: followUpMessages.body,
      tag: `${type}-followup-${followUpNumber}`
    });
  }

  /**
   * Get follow-up messages based on notification type and follow-up number
   */
  private static getFollowUpMessages(type: string, followUpNumber: number): { title: string; body: string } {
    const messages = {
      'morning-start': {
        1: { title: "Morning Momentum! 🌅", body: "3 minutes in - How's your first problem going?" },
        2: { title: "Keep Going! 💪", body: "20 minutes of focus - You're building great habits!" },
        3: { title: "Morning Champion! 🏆", body: "40 minutes of practice - Excellent start to your day!" }
      },
      'afternoon-boost': {
        1: { title: "Afternoon Energy! ⚡", body: "3 minutes in - Perfect time to tackle that algorithm!" },
        2: { title: "Staying Strong! 🎯", body: "20 minutes of focus - Your problem-solving skills are growing!" },
        3: { title: "Afternoon Success! 🌟", body: "40 minutes of dedication - You're crushing your goals!" }
      },
      'evening-practice': {
        1: { title: "Evening Focus! 🌆", body: "3 minutes in - Great way to end your productive day!" },
        2: { title: "Consistent Practice! 📈", body: "20 minutes of evening coding - Building expertise daily!" },
        3: { title: "Evening Excellence! 🎉", body: "40 minutes completed - Perfect end to a productive day!" }
      }
    };

    const typeMessages = messages[type as keyof typeof messages];
    if (typeMessages && typeMessages[followUpNumber as keyof typeof typeMessages]) {
      return typeMessages[followUpNumber as keyof typeof typeMessages];
    }

    // Fallback message
    return {
      title: "Keep Practicing! 🚀",
      body: `Follow-up ${followUpNumber}: You're doing great - keep up the momentum!`
    };
  }

  /**
   * Show streak reminder notification
   */
  static async showStreakReminder(currentStreak: number): Promise<void> {
    if (currentStreak === 0) {
      await this.showNotification({
        title: "Don't Break the Chain! 🔗",
        body: "Start your problem-solving streak today!",
        tag: 'streak-reminder'
      });
    } else {
      await this.showNotification({
        title: `${currentStreak} Day Streak! 🔥`,
        body: "Keep the momentum going - solve more problems!",
        tag: 'streak-reminder'
      });
    }
  }

  /**
   * Show motivational notification based on user progress
   */
  static async showMotivationalNotification(): Promise<void> {
    try {
      // Get user's actual progress from localStorage or Supabase
      const userProgress = this.getUserProgress();
      const currentHour = new Date().getHours();
      
      // Different messages based on time of day and progress
      let title = "DSA Practice Reminder";
      let body = "";
      
      if (currentHour < 12) {
        // Morning messages
        if (userProgress.solvedToday > 0) {
          body = `Good morning! You've already solved ${userProgress.solvedToday} problems today. Keep the momentum going! 🌅`;
        } else {
          body = "Good morning! Start your day with some problem-solving practice. ☕️";
        }
      } else if (currentHour < 18) {
        // Afternoon messages
        if (userProgress.solvedToday > 0) {
          body = `Great afternoon progress! ${userProgress.solvedToday} problems solved. Ready for more? 🌟`;
        } else {
          body = "Perfect time for a coding break! Solve a few problems to boost your skills. 💪";
        }
      } else {
        // Evening messages
        if (userProgress.solvedToday > 0) {
          body = `Excellent day! You solved ${userProgress.solvedToday} problems. Consider one more before bed? 🌙`;
        } else {
          body = "Evening practice session? Even 15 minutes can make a difference! 🌆";
        }
      }
      
      // Add streak information if available
      if (userProgress.currentStreak > 0) {
        body += ` Your ${userProgress.currentStreak}-day streak is impressive!`;
      }
      
      await this.showNotification({
        title,
        body,
        tag: 'motivational'
      });
    } catch (error) {
      console.error('❌ Error showing motivational notification:', error);
    }
  }

  /**
   * Get user progress from storage
   */
  private static getUserProgress(): { solvedToday: number; currentStreak: number; totalSolved: number } {
    try {
      // Try to get from localStorage first
      const today = new Date().toISOString().split('T')[0];
      const dailyProgress = localStorage.getItem(`daily_progress_${today}`);
      const streakData = localStorage.getItem('user_streak');
      const totalProgress = localStorage.getItem('user_total_solved');
      
      return {
        solvedToday: dailyProgress ? JSON.parse(dailyProgress).count || 0 : 0,
        currentStreak: streakData ? JSON.parse(streakData).current || 0 : 0,
        totalSolved: totalProgress ? JSON.parse(totalProgress) || 0 : 0
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return { solvedToday: 0, currentStreak: 0, totalSolved: 0 };
    }
  }

  /**
   * Show weekly goal reminder
   */
  static async showWeeklyGoalReminder(): Promise<void> {
    const dayOfWeek = new Date().getDay();
    
    if (dayOfWeek === 1) { // Monday
      await this.showNotification({
        title: "New Week, New Goals! 🎯",
        body: "Set your weekly problem-solving targets and crush them!",
        tag: 'weekly-goal'
      });
    } else if (dayOfWeek === 0) { // Sunday
      await this.showNotification({
        title: "Week Review Time! 📊",
        body: "Check your progress and prepare for the upcoming week!",
        tag: 'weekly-goal'
      });
    }
  }

  /**
   * Check if we can show notifications
   */
  static canShowNotifications(): boolean {
    return this.isSupported() && this.notificationPermission === 'granted';
  }

  /**
   * Get current notification settings
   */
  static getSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...this.DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    return this.DEFAULT_SETTINGS;
  }

  /**
   * Reset timing settings to defaults
   */
  static resetTimingToDefaults(): NotificationSettings {
    const currentSettings = this.getSettings();
    const resetSettings: NotificationSettings = {
      ...currentSettings,
      morningStartTime: this.DEFAULT_SETTINGS.morningStartTime,
      afternoonBoostTime: this.DEFAULT_SETTINGS.afternoonBoostTime,
      eveningPracticeTime: this.DEFAULT_SETTINGS.eveningPracticeTime,
      nightReflectionTime: this.DEFAULT_SETTINGS.nightReflectionTime,
      enableNightReflection: this.DEFAULT_SETTINGS.enableNightReflection
    };
    
    this.saveSettings(resetSettings);
    return resetSettings;
  }

  /**
   * Save notification settings to localStorage
   */
  static saveSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      console.log('✅ Notification settings saved');
      
      // Reschedule professional notifications if settings changed
      if (settings.enabled && settings.dailyReminder) {
        this.scheduleProfessionalNotifications();
        // Also update background notifications
        this.scheduleBackgroundNotifications(settings);
      } else {
        // Clear existing reminder
        const existingTimeout = this.scheduledNotifications.get('daily-reminder');
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          this.scheduledNotifications.delete('daily-reminder');
        }
      }
      
      // Send updated settings to service worker
      this.updateServiceWorkerSettings(settings);
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
    }
  }

  /**
   * Update service worker with new settings
   */
  private static async updateServiceWorkerSettings(settings: NotificationSettings): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'UPDATE_SETTINGS',
            settings: settings
          });
        }
      } catch (error) {
        console.error('❌ Error updating service worker settings:', error);
      }
    }
  }

  /**
   * Register service worker for background notifications
   */
  private static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered:', registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker ready for background notifications');
      } catch (error) {
        console.log('ℹ️ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup communication with service worker
   */
  private static setupServiceWorkerCommunication(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'GET_NOTIFICATION_SETTINGS') {
          // Send current settings to service worker
          const settings = this.getSettings();
          event.ports[0]?.postMessage(settings);
        }
      });
    }
  }

  /**
   * Schedule background notifications through service worker
   */
  private static async scheduleBackgroundNotifications(settings: NotificationSettings): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Send settings to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATIONS',
            settings: settings
          });
          console.log('📅 Background notifications scheduled');
        }
        
        // Background notifications are now scheduled
      } catch (error) {
        console.error('❌ Error scheduling background notifications:', error);
      }
    }
  }



  /**
   * Test follow-up notifications with shorter intervals (for testing)
   */
  static testFollowUpNotifications(): void {
    console.log('🧪 Testing follow-up notifications...');
    
    // Send initial test notification
    this.showNotification({
      title: 'Test Initial Notification 🚀',
      body: 'Follow-up notifications will arrive in 5, 10, and 15 seconds',
      tag: 'test-initial'
    });
    
    // Schedule test follow-ups with shorter intervals (5, 10, 15 seconds)
    const testIntervals = [5, 10, 15]; // seconds
    
    testIntervals.forEach((seconds, index) => {
      const timeoutId = setTimeout(async () => {
        console.log(`🔔 Sending test follow-up ${index + 1}`);
        await this.showNotification({
          title: `Test Follow-up ${index + 1} 🎉`,
          body: `This is test follow-up ${index + 1} after ${seconds} seconds`,
          tag: `test-followup-${index + 1}`
        });
      }, seconds * 1000);
      
      this.scheduledNotifications.set(`test-followup-${index + 1}`, timeoutId as unknown as number);
    });
  }

  /**
   * Clear all scheduled notifications
   */
  static clearAllScheduledNotifications(): void {
    console.log('🧹 Clearing all scheduled notifications...');
    this.scheduledNotifications.forEach((timeoutId, notificationId) => {
      clearTimeout(timeoutId);
      console.log(`❌ Cleared notification: ${notificationId}`);
    });
    this.scheduledNotifications.clear();
    console.log('✅ All scheduled notifications cleared');
  }

}
