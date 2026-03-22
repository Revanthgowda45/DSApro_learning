import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TimeTrackingService, TimeStats } from '../services/TimeTrackingService';
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function TimerScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<TimeStats>({
    totalTime: 0,
    sessionCount: 0,
    averageSession: 0,
    longestSession: 0,
    todayTime: 0,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    
    try {
      const timeStats = await TimeTrackingService.getTimeStats(user.id);
      setStats(timeStats);
    } catch (error) {
      console.error('Error loading timer stats:', error);
    }
  };

  const startTimer = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to use the timer');
      return;
    }

    try {
      const sessionId = await TimeTrackingService.startTimer(user.id);
      setCurrentSessionId(sessionId);
      setIsRunning(true);
      setIsPaused(false);
      setTime(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const pauseTimer = async () => {
    if (!currentSessionId) return;

    try {
      if (isPaused) {
        await TimeTrackingService.resumeTimer(currentSessionId);
        setIsPaused(false);
      } else {
        await TimeTrackingService.pauseTimer(currentSessionId);
        setIsPaused(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pause/resume timer');
    }
  };

  const stopTimer = async () => {
    if (!currentSessionId) return;

    try {
      const duration = await TimeTrackingService.stopTimer(currentSessionId);
      setIsRunning(false);
      setIsPaused(false);
      setTime(0);
      setCurrentSessionId(null);
      
      Alert.alert(
        'Session Complete!',
        `You practiced for ${formatTime(duration * 60)} minutes. Great job!`,
        [{ text: 'OK', onPress: loadStats }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to stop timer');
    }
  };

  const resetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer? This will discard the current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            setTime(0);
            setCurrentSessionId(null);
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
    timerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 30,
      marginBottom: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    timerDisplay: {
      fontSize: 48,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      fontFamily: 'monospace',
    },
    timerStatus: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 30,
    },
    timerControls: {
      flexDirection: 'row',
      gap: 16,
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    startButton: {
      backgroundColor: theme.colors.success,
    },
    pauseButton: {
      backgroundColor: theme.colors.warning,
    },
    stopButton: {
      backgroundColor: theme.colors.error,
    },
    resetButton: {
      backgroundColor: theme.colors.textSecondary,
    },
    statsSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    tipsSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    tipIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    tipText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Timer</Text>
        <Text style={styles.subtitle}>Track your practice sessions</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Card */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.timerCard}>
          <Text style={styles.timerDisplay}>{formatTime(time)}</Text>
          
          <Text style={styles.timerStatus}>
            {isRunning 
              ? (isPaused ? 'Paused' : 'Running') 
              : 'Ready to start'
            }
          </Text>

          <View style={styles.timerControls}>
            {!isRunning ? (
              <TouchableOpacity style={[styles.controlButton, styles.startButton]} onPress={startTimer}>
                <Ionicons name="play" size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.controlButton, styles.pauseButton]} onPress={pauseTimer}>
                  <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopTimer}>
                  <Ionicons name="stop" size={24} color="white" />
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={resetTimer}>
              <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Statistics */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDuration(stats.todayTime)}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDuration(stats.totalTime)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.sessionCount}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDuration(Math.round(stats.averageSession))}</Text>
              <Text style={styles.statLabel}>Average Session</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Tips */}
        <Animatable.View animation="fadeInUp" delay={500} style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Study Tips</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color={theme.colors.warning} style={styles.tipIcon} />
            <Text style={styles.tipText}>
              Use the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break.
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="target" size={16} color={theme.colors.success} style={styles.tipIcon} />
            <Text style={styles.tipText}>
              Set specific goals for each session to maintain focus and motivation.
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="phone-portrait" size={16} color={theme.colors.error} style={styles.tipIcon} />
            <Text style={styles.tipText}>
              Minimize distractions by putting your phone in silent mode during study sessions.
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="water" size={16} color={theme.colors.info} style={styles.tipIcon} />
            <Text style={styles.tipText}>
              Stay hydrated and take regular breaks to maintain peak performance.
            </Text>
          </View>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}
