import { useCallback } from 'react';
import { NotificationService } from '../services/NotificationService';

export function useNotifications() {
  const checkDailyNotifications = useCallback(async () => {
    try {
      // Check if it's time for daily notifications
      const settings = NotificationService.getSettings();
      if (settings.dailyReminder) {
        // This would typically check if notifications should be shown
        // For now, we'll just ensure the service is initialized
        console.log('📱 Daily notifications are enabled');
      }
    } catch (error) {
      console.error('Error checking daily notifications:', error);
    }
  }, []);

  const showAchievementNotification = useCallback(async (achievement: string) => {
    try {
      await NotificationService.showAchievementNotification(achievement);
    } catch (error) {
      console.error('Error showing achievement notification:', error);
    }
  }, []);

  const showStreakReminder = useCallback(async (streak: number) => {
    try {
      await NotificationService.showStreakReminder(streak);
    } catch (error) {
      console.error('Error showing streak reminder:', error);
    }
  }, []);

  const showProblemCompletionNotification = useCallback(async (problemTitle: string) => {
    try {
      await NotificationService.showProblemCompletionNotification(problemTitle);
    } catch (error) {
      console.error('Error showing problem completion notification:', error);
    }
  }, []);

  const updateNotificationSettings = useCallback(async (settings: any) => {
    try {
      await NotificationService.updateSettings(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }, []);

  const getNotificationSettings = useCallback(() => {
    return NotificationService.getSettings();
  }, []);

  return {
    checkDailyNotifications,
    showAchievementNotification,
    showStreakReminder,
    showProblemCompletionNotification,
    updateNotificationSettings,
    getNotificationSettings,
  };
}
