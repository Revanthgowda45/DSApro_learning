import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { transformDSAQuestions, Problem } from '../../data/dsaDatabase';
import ProblemCard from '../problems/ProblemCard';
import * as Animatable from 'react-native-animatable';

export default function ProgressiveRecommendations() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      
      // Get all problems
      const allProblems = await transformDSAQuestions();
      
      // Simple recommendation logic - get unsolved problems
      const unsolvedProblems = allProblems.filter(problem => 
        !problem.status || problem.status === 'not_started'
      );

      // Sort by difficulty (Easy first, then Medium, then Hard)
      const sortedProblems = unsolvedProblems.sort((a, b) => {
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });

      // Take first 6 problems as recommendations
      const dailyRecommendations = sortedProblems.slice(0, 6);
      
      setRecommendations(dailyRecommendations);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const handleProblemUpdate = (problemId: string, updates: any) => {
    setRecommendations(prev => 
      prev.map(problem => 
        problem.id === problemId 
          ? { ...problem, ...updates }
          : problem
      )
    );
  };

  useEffect(() => {
    loadRecommendations();
  }, [user?.id]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: 12,
      fontSize: 14,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    problemsList: {
      gap: 12,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Today's Recommendations</Text>
            <Text style={styles.subtitle}>Personalized problems for you</Text>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <Animatable.View
            animation="rotate"
            iterationCount="infinite"
            duration={2000}
          >
            <Ionicons name="refresh" size={32} color={theme.colors.primary} />
          </Animatable.View>
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Today's Recommendations</Text>
            <Text style={styles.subtitle}>Personalized problems for you</Text>
          </View>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Today's Recommendations</Text>
            <Text style={styles.subtitle}>Personalized problems for you</Text>
          </View>
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark" size={30} color={theme.colors.success} />
          </View>
          <Text style={styles.emptyTitle}>Great Job!</Text>
          <Text style={styles.emptyText}>
            You've completed all available recommendations.{'\n'}
            Keep up the excellent work!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Today's Recommendations</Text>
          <Text style={styles.subtitle}>
            {recommendations.length} problems selected for you
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Animatable.View
            animation={refreshing ? 'rotate' : undefined}
            iterationCount={refreshing ? 'infinite' : 1}
            duration={1000}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={theme.colors.primary}
            />
          </Animatable.View>
        </TouchableOpacity>
      </View>

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
        contentContainerStyle={styles.problemsList}
      >
        {recommendations.map((problem, index) => (
          <Animatable.View
            key={problem.id}
            animation="fadeInUp"
            delay={index * 100}
          >
            <ProblemCard
              problem={problem}
              onUpdate={(updates) => handleProblemUpdate(problem.id, updates)}
            />
          </Animatable.View>
        ))}
      </ScrollView>
    </View>
  );
}
