import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationService } from '../services/NotificationService';
import * as Animatable from 'react-native-animatable';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { getNotificationSettings, updateNotificationSettings } = useNotifications();
  
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReminder: true,
    morningStartTime: '09:00',
    afternoonBoostTime: '14:00',
    eveningPracticeTime: '18:00',
    nightReflectionTime: '21:00',
    enableNightReflection: true,
    streakReminders: true,
    achievementNotifications: true,
    weeklyGoalReminders: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = getNotificationSettings();
    setNotificationSettings(settings);
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    
    try {
      await updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleTimeChange = async (key: string, time: string) => {
    const newSettings = { ...notificationSettings, [key]: time };
    setNotificationSettings(newSettings);
    
    try {
      await updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error updating time settings:', error);
      Alert.alert('Error', 'Failed to update time settings');
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.resetTimingToDefaults();
              loadSettings();
              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary + '10',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    timeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.primary + '20',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    timeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    scheduleSection: {
      padding: 16,
    },
    scheduleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    scheduleItemLast: {
      borderBottomWidth: 0,
    },
    scheduleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    scheduleEmoji: {
      fontSize: 20,
      marginRight: 12,
    },
    scheduleInfo: {
      flex: 1,
    },
    scheduleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    scheduleDesc: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    resetButton: {
      margin: 20,
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.error + '20',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
      alignItems: 'center',
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.error,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your app experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isDark ? 'moon' : 'sunny'} 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={isDark ? theme.colors.primary : theme.colors.surface}
            />
          </View>
        </Animatable.View>

        {/* Notification Settings */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="notifications" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Daily Reminders</Text>
                <Text style={styles.settingDescription}>
                  Professional notification schedule
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.dailyReminder}
              onValueChange={(value) => handleNotificationToggle('dailyReminder', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationSettings.dailyReminder ? theme.colors.primary : theme.colors.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="flame" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Streak Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get notified about your learning streak
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.streakReminders}
              onValueChange={(value) => handleNotificationToggle('streakReminders', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationSettings.streakReminders ? theme.colors.primary : theme.colors.surface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="trophy" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Achievement Notifications</Text>
                <Text style={styles.settingDescription}>
                  Celebrate your accomplishments
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.achievementNotifications}
              onValueChange={(value) => handleNotificationToggle('achievementNotifications', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationSettings.achievementNotifications ? theme.colors.primary : theme.colors.surface}
            />
          </View>

          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="calendar" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Weekly Goal Reminders</Text>
                <Text style={styles.settingDescription}>
                  Stay on track with weekly goals
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.weeklyGoalReminders}
              onValueChange={(value) => handleNotificationToggle('weeklyGoalReminders', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationSettings.weeklyGoalReminders ? theme.colors.primary : theme.colors.surface}
            />
          </View>
        </Animatable.View>

        {/* Professional Schedule */}
        {notificationSettings.dailyReminder && (
          <Animatable.View animation="fadeInUp" delay={300} style={styles.section}>
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleTitle}>Professional Schedule</Text>
              
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleEmoji}>🌅</Text>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Morning Start</Text>
                    <Text style={styles.scheduleDesc}>Motivational morning message</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeButtonText}>
                    {notificationSettings.morningStartTime}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleItem}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleEmoji}>⚡</Text>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Afternoon Boost</Text>
                    <Text style={styles.scheduleDesc}>Midday encouragement</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeButtonText}>
                    {notificationSettings.afternoonBoostTime}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleItem}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleEmoji}>🌆</Text>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Evening Practice</Text>
                    <Text style={styles.scheduleDesc}>Evening session reminder</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeButtonText}>
                    {notificationSettings.eveningPracticeTime}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleItem}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleEmoji}>🌙</Text>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Night Reflection</Text>
                    <Text style={styles.scheduleDesc}>End-of-day reflection</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Switch
                    value={notificationSettings.enableNightReflection}
                    onValueChange={(value) => handleNotificationToggle('enableNightReflection', value)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                    thumbColor={notificationSettings.enableNightReflection ? theme.colors.primary : theme.colors.surface}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  {notificationSettings.enableNightReflection && (
                    <TouchableOpacity style={styles.timeButton}>
                      <Text style={styles.timeButtonText}>
                        {notificationSettings.nightReflectionTime}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Data & Privacy */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="cloud-upload" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Sync Data</Text>
                <Text style={styles.settingDescription}>
                  Sync your progress across devices
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="download" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Export Data</Text>
                <Text style={styles.settingDescription}>
                  Download your progress data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>

          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name="shield-checkmark" 
                size={24} 
                color={theme.colors.textSecondary} 
                style={styles.settingIcon} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingDescription}>
                  Learn how we protect your data
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>
        </Animatable.View>

        {/* Reset Button */}
        <Animatable.View animation="fadeInUp" delay={500}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}
