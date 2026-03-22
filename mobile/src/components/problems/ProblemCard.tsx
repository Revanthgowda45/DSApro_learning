import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Problem } from '../../data/dsaDatabase';
import { ProblemProgressService } from '../../services/ProblemProgressService';
import { useAuth } from '../../context/AuthContext';

interface ProblemCardProps {
  problem: Problem;
  onUpdate: (updates: any) => void;
}

export default function ProblemCard({ problem, onUpdate }: ProblemCardProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return theme.colors.success;
      case 'medium':
        return theme.colors.warning;
      case 'hard':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solved':
        return theme.colors.success;
      case 'attempted':
        return theme.colors.warning;
      case 'mastered':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved':
        return 'checkmark-circle';
      case 'attempted':
        return 'time';
      case 'mastered':
        return 'star';
      default:
        return 'radio-button-off';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user?.id || isUpdating) return;

    try {
      setIsUpdating(true);
      
      await ProblemProgressService.updateProblemStatus(user.id, problem.id, {
        status: newStatus,
        is_bookmarked: problem.isBookmarked || false,
      });

      onUpdate({ status: newStatus });
    } catch (error) {
      console.error('Error updating problem status:', error);
      Alert.alert('Error', 'Failed to update problem status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user?.id || isUpdating) return;

    try {
      setIsUpdating(true);
      const newBookmarkState = !problem.isBookmarked;
      
      await ProblemProgressService.updateProblemStatus(user.id, problem.id, {
        status: problem.status || 'not_started',
        is_bookmarked: newBookmarkState,
      });

      onUpdate({ isBookmarked: newBookmarkState });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLinkPress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open link');
      });
    }
  };

  const showStatusOptions = () => {
    const options = [
      { text: 'Not Started', value: 'not_started' },
      { text: 'Attempted', value: 'attempted' },
      { text: 'Solved', value: 'solved' },
      { text: 'Mastered', value: 'mastered' },
      { text: 'Cancel', value: null, style: 'cancel' },
    ];

    Alert.alert(
      'Update Status',
      'Choose the status for this problem:',
      options.map(option => ({
        text: option.text,
        style: option.style as any,
        onPress: option.value ? () => handleStatusChange(option.value) : undefined,
      }))
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
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
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    topic: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: 'white',
    },
    bookmarkButton: {
      padding: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
      marginLeft: 6,
    },
    companies: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    companyTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: theme.colors.background,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    companyText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    links: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: theme.colors.info + '20',
    },
    linkText: {
      fontSize: 12,
      color: theme.colors.info,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{problem.title}</Text>
          <Text style={styles.topic}>{problem.topic}</Text>
          
          <View style={styles.badges}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) }]}>
              <Text style={styles.difficultyText}>{problem.difficulty}</Text>
            </View>
            
            {problem.status && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(problem.status) }]}>
                <Text style={styles.statusText}>
                  {problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmarkToggle}
          disabled={isUpdating}
        >
          <Ionicons
            name={problem.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={problem.isBookmarked ? theme.colors.warning : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Companies */}
      {problem.companies && problem.companies.length > 0 && (
        <View style={styles.companies}>
          {problem.companies.slice(0, 5).map((company, index) => (
            <View key={index} style={styles.companyTag}>
              <Text style={styles.companyText}>{company}</Text>
            </View>
          ))}
          {problem.companies.length > 5 && (
            <View style={styles.companyTag}>
              <Text style={styles.companyText}>+{problem.companies.length - 5} more</Text>
            </View>
          )}
        </View>
      )}

      {/* Links */}
      {(problem.leetcode_link || problem.gfg_link) && (
        <View style={styles.links}>
          {problem.leetcode_link && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleLinkPress(problem.leetcode_link)}
            >
              <Ionicons name="link" size={12} color={theme.colors.info} />
              <Text style={styles.linkText}>LeetCode</Text>
            </TouchableOpacity>
          )}
          
          {problem.gfg_link && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleLinkPress(problem.gfg_link)}
            >
              <Ionicons name="link" size={12} color={theme.colors.info} />
              <Text style={styles.linkText}>GeeksforGeeks</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={showStatusOptions}
          disabled={isUpdating}
        >
          <Ionicons
            name={getStatusIcon(problem.status || 'not_started')}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.actionText}>Update Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
