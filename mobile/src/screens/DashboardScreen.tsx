import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import StatsCard from '../components/dashboard/StatsCard';
import ProgressiveRecommendations from '../components/dashboard/ProgressiveRecommendations';
import { UserSessionService } from '../services/UserSessionService';
import { useOptimizedAnalytics, useQuickStats } from '../hooks/useOptimizedAnalytics';
import { useNotifications } from '../hooks/useNotifications';
import LinearGradient from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { metrics: progressMetrics, loading, error, refresh } = useOptimizedAnalytics();
  const { stats: quickStats } = useQuickStats();
  const { checkDailyNotifications } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    timeSpent: 0,
    problemsSolved: 0
  });
  
  // Consolidated stats from optimized analytics and today's data
  const dashboardStats = {
    currentStreak: progressMetrics?.currentStreak || 0,
    timeToday: todayStats.timeSpent,
    confidenceLevel: progressMetrics?.confidenceLevel || 0,
    problemsToday: todayStats.problemsSolved,
    dailyTimeLimit: user?.daily_time_limit || 120
  };
  
  // Load today's specific data
  const loadTodayStats = async () => {
    if (!user?.id) return;
    
    try {
      const todaySession = await UserSessionService.getTodaySession(user.id);
      setTodayStats({
        timeSpent: todaySession?.time_spent || 0,
        problemsSolved: todaySession?.problems_solved || 0
      });
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  useEffect(() => {
    loadTodayStats();
    checkDailyNotifications();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refresh(),
        loadTodayStats()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    greeting: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    motivationText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    statsContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    recommendationsContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: 10,
    },
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons 
            name="refresh" 
            size={32} 
            color={theme.colors.primary} 
          />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={[theme.colors.primary + '20', theme.colors.secondary + '20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {user?.full_name || user?.username || 'Student'}! 👋
          </Text>
          <Text style={styles.motivationText}>
            Ready to level up your DSA skills today?
          </Text>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Current Streak"
              value={dashboardStats.currentStreak}
              unit="days"
              icon="flame"
              color={theme.colors.warning}
              width={(width - 60) / 2}
            />
            <StatsCard
              title="Time Today"
              value={formatTime(dashboardStats.timeToday)}
              unit=""
              icon="time"
              color={theme.colors.info}
              width={(width - 60) / 2}
            />
            <StatsCard
              title="Problems Today"
              value={dashboardStats.problemsToday}
              unit="solved"
              icon="checkmark-circle"
              color={theme.colors.success}
              width={(width - 60) / 2}
            />
            <StatsCard
              title="Confidence"
              value={Math.round(dashboardStats.confidenceLevel)}
              unit="%"
              icon="trending-up"
              color={theme.colors.primary}
              width={(width - 60) / 2}
            />
          </View>
        </View>

        {/* Daily Recommendations */}
        <Text style={styles.sectionTitle}>Today's Recommendations</Text>
        <View style={styles.recommendationsContainer}>
          <ProgressiveRecommendations />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
