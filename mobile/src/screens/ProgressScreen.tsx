import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import { UserSessionService } from '../services/UserSessionService';
import StatsCard from '../components/dashboard/StatsCard';
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { metrics, loading, refresh } = useOptimizedAnalytics();
  
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    totalProblems: 0,
    totalTime: 0,
    averageDaily: 0,
    daysActive: 0,
  });

  const loadWeeklyStats = async () => {
    if (!user?.id) return;
    
    try {
      const stats = await UserSessionService.getWeeklyStats(user.id);
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error loading weekly stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refresh(),
        loadWeeklyStats(),
      ]);
    } catch (error) {
      console.error('Error refreshing progress:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeeklyStats();
  }, [user?.id]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressPercentage = (solved: number, total: number) => {
    return total > 0 ? Math.round((solved / total) * 100) : 0;
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
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
      marginTop: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    difficultyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    difficultyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    difficultyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    difficultyBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
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
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress Tracking</Text>
          <Text style={styles.subtitle}>Monitor your DSA journey</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <Animatable.View
            animation="rotate"
            iterationCount="infinite"
            duration={2000}
          >
            <Ionicons name="refresh" size={32} color={theme.colors.primary} />
          </Animatable.View>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Tracking</Text>
        <Text style={styles.subtitle}>Monitor your DSA journey</Text>
      </View>

      <ScrollView
        style={styles.content}
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
        {/* Overall Stats */}
        <Animatable.View animation="fadeInUp" delay={100}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Total Solved"
              value={metrics?.solvedProblems || 0}
              unit={`/ ${metrics?.totalProblems || 375}`}
              icon="checkmark-circle"
              color={theme.colors.success}
              width={(width - 60) / 2}
            />
            <StatsCard
              title="Current Streak"
              value={metrics?.currentStreak || 0}
              unit="days"
              icon="flame"
              color={theme.colors.warning}
              width={(width - 60) / 2}
            />
            <StatsCard
              title="Confidence Level"
              value={Math.round(metrics?.confidenceLevel || 0)}
              unit="%"
              icon="trending-up"
              color={theme.colors.primary}
              width={(width - 60) / 2}
            />
            <StatsCard
              title="Avg Time"
              value={formatTime(metrics?.averageTime || 0)}
              unit=""
              icon="time"
              color={theme.colors.info}
              width={(width - 60) / 2}
            />
          </View>
        </Animatable.View>

        {/* Difficulty Breakdown */}
        <Animatable.View animation="fadeInUp" delay={300}>
          <Text style={styles.sectionTitle}>Difficulty Progress</Text>
          
          {/* Easy Problems */}
          <View style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>Easy Problems</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.difficultyBadgeText}>EASY</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[theme.colors.success, theme.colors.success + 'CC']}
                  style={[
                    styles.progressFill,
                    { 
                      width: `${getProgressPercentage(
                        metrics?.difficultyBreakdown?.easy?.solved || 0,
                        metrics?.difficultyBreakdown?.easy?.total || 125
                      )}%` 
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {metrics?.difficultyBreakdown?.easy?.solved || 0} / {metrics?.difficultyBreakdown?.easy?.total || 125} solved
                ({getProgressPercentage(
                  metrics?.difficultyBreakdown?.easy?.solved || 0,
                  metrics?.difficultyBreakdown?.easy?.total || 125
                )}%)
              </Text>
            </View>
          </View>

          {/* Medium Problems */}
          <View style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>Medium Problems</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.difficultyBadgeText}>MEDIUM</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[theme.colors.warning, theme.colors.warning + 'CC']}
                  style={[
                    styles.progressFill,
                    { 
                      width: `${getProgressPercentage(
                        metrics?.difficultyBreakdown?.medium?.solved || 0,
                        metrics?.difficultyBreakdown?.medium?.total || 150
                      )}%` 
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {metrics?.difficultyBreakdown?.medium?.solved || 0} / {metrics?.difficultyBreakdown?.medium?.total || 150} solved
                ({getProgressPercentage(
                  metrics?.difficultyBreakdown?.medium?.solved || 0,
                  metrics?.difficultyBreakdown?.medium?.total || 150
                )}%)
              </Text>
            </View>
          </View>

          {/* Hard Problems */}
          <View style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>Hard Problems</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.difficultyBadgeText}>HARD</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[theme.colors.error, theme.colors.error + 'CC']}
                  style={[
                    styles.progressFill,
                    { 
                      width: `${getProgressPercentage(
                        metrics?.difficultyBreakdown?.hard?.solved || 0,
                        metrics?.difficultyBreakdown?.hard?.total || 100
                      )}%` 
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {metrics?.difficultyBreakdown?.hard?.solved || 0} / {metrics?.difficultyBreakdown?.hard?.total || 100} solved
                ({getProgressPercentage(
                  metrics?.difficultyBreakdown?.hard?.solved || 0,
                  metrics?.difficultyBreakdown?.hard?.total || 100
                )}%)
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Weekly Stats */}
        <Animatable.View animation="fadeInUp" delay={500}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.difficultyCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklyStats.totalProblems}</Text>
                <Text style={styles.statLabel}>Problems</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(weeklyStats.totalTime)}</Text>
                <Text style={styles.statLabel}>Time Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklyStats.daysActive}</Text>
                <Text style={styles.statLabel}>Active Days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklyStats.averageDaily.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Daily Avg</Text>
              </View>
            </View>
          </View>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}
