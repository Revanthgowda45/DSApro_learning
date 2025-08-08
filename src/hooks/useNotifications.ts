import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/notificationService';

export function useNotifications() {
  const { user } = useAuth();

  // Check and show daily notifications
  const checkDailyNotifications = useCallback(async () => {
    if (!user) return;

    const settings = NotificationService.getSettings();
    if (!settings.enabled || !NotificationService.canShowNotifications()) {
      return;
    }

    try {
      // Show motivational notification based on progress
      if (settings.motivationalMessages) {
        await NotificationService.showMotivationalNotification();
      }

      // Show weekly goal reminders on Monday/Sunday
      if (settings.weeklyGoalReminder) {
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1 || dayOfWeek === 0) {
          await NotificationService.showWeeklyGoalReminder();
        }
      }
    } catch (error) {
      console.error('❌ Error checking daily notifications:', error);
    }
  }, [user]);

  // Show streak reminder
  const showStreakReminder = useCallback(async (currentStreak: number) => {
    const settings = NotificationService.getSettings();
    if (!settings.enabled || !settings.streakReminder || !NotificationService.canShowNotifications()) {
      return;
    }

    await NotificationService.showStreakReminder(currentStreak);
  }, []);

  // Show achievement notification
  const showAchievementNotification = useCallback(async (title: string, message: string) => {
    const settings = NotificationService.getSettings();
    if (!settings.enabled || !NotificationService.canShowNotifications()) {
      return;
    }

    await NotificationService.showNotification({
      title: `🏆 ${title}`,
      body: message,
      tag: 'achievement',
      requireInteraction: false
    });
  }, []);

  // Show problem completion notification
  const showProblemCompletedNotification = useCallback(async (problemTitle: string, difficulty: string) => {
    const settings = NotificationService.getSettings();
    if (!settings.enabled || !NotificationService.canShowNotifications()) {
      return;
    }

    const difficultyEmoji = {
      'Easy': '🟢',
      'Medium': '🟡', 
      'Hard': '🔴'
    }[difficulty] || '⭐';

    await NotificationService.showNotification({
      title: `${difficultyEmoji} Problem Solved!`,
      body: `Great job completing "${problemTitle}"!`,
      tag: 'problem-completed',
      requireInteraction: false
    });
  }, []);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      // Check daily notifications after a short delay to allow app to load
      const timer = setTimeout(() => {
        checkDailyNotifications();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, checkDailyNotifications]);

  // Request permission if needed
  const requestNotificationPermission = useCallback(async () => {
    return await NotificationService.requestPermission();
  }, []);

  // Get notification settings
  const getNotificationSettings = useCallback(() => {
    return NotificationService.getSettings();
  }, []);

  // Save notification settings
  const saveNotificationSettings = useCallback((settings: any) => {
    NotificationService.saveSettings(settings);
  }, []);



  return {
    checkDailyNotifications,
    showStreakReminder,
    showAchievementNotification,
    showProblemCompletedNotification,
    requestNotificationPermission,
    getNotificationSettings,
    saveNotificationSettings,

    canShowNotifications: NotificationService.canShowNotifications(),
    isSupported: NotificationService.isSupported()
  };
}
