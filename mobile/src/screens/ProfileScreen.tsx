import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOptimizedAnalytics } from '../hooks/useOptimizedAnalytics';
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const { metrics } = useOptimizedAnalytics();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    daily_time_limit: user?.daily_time_limit?.toString() || '120',
    learning_pace: user?.learning_pace || 'moderate',
  });
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      await updateUser({
        full_name: editForm.full_name,
        username: editForm.username,
        email: editForm.email,
        daily_time_limit: parseInt(editForm.daily_time_limit) || 120,
        learning_pace: editForm.learning_pace,
      });

      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const getDifficultyStats = () => {
    if (!metrics?.difficultyBreakdown) {
      return {
        easy: { solved: 0, total: 125, percentage: 0 },
        medium: { solved: 0, total: 150, percentage: 0 },
        hard: { solved: 0, total: 100, percentage: 0 },
      };
    }

    const { easy, medium, hard } = metrics.difficultyBreakdown;
    return {
      easy: {
        solved: easy.solved,
        total: easy.total,
        percentage: Math.round((easy.solved / easy.total) * 100),
      },
      medium: {
        solved: medium.solved,
        total: medium.total,
        percentage: Math.round((medium.solved / medium.total) * 100),
      },
      hard: {
        solved: hard.solved,
        total: hard.total,
        percentage: Math.round((hard.solved / hard.total) * 100),
      },
    };
  };

  const difficultyStats = getDifficultyStats();

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
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
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
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    statsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 80,
    },
    statPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    difficultyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    difficultyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    difficultyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    difficultyBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    settingsSection: {
      marginTop: 20,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    logoutButton: {
      marginTop: 20,
      marginBottom: 40,
    },
    logoutButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.error + '20',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.error,
      marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    saveButtonText: {
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account and progress</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.avatar}
            >
              <Ionicons name="person" size={40} color="white" />
            </LinearGradient>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.full_name || user?.username || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Pills */}
          <View style={styles.statsHeader}>
            <View style={[styles.statPill, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.statPillText}>
                {difficultyStats.easy.solved}/{difficultyStats.easy.total} Easy
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.statPillText}>
                {difficultyStats.medium.solved}/{difficultyStats.medium.total} Medium
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.statPillText}>
                {difficultyStats.hard.solved}/{difficultyStats.hard.total} Hard
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Difficulty Progress */}
        <Animatable.View animation="fadeInUp" delay={300}>
          <Text style={styles.sectionTitle}>Progress by Difficulty</Text>
          
          {/* Easy */}
          <View style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>Easy Problems</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.difficultyBadgeText}>EASY</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[theme.colors.success, theme.colors.success + 'CC']}
                style={[styles.progressFill, { width: `${difficultyStats.easy.percentage}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {difficultyStats.easy.solved} / {difficultyStats.easy.total} solved ({difficultyStats.easy.percentage}%)
            </Text>
          </View>

          {/* Medium */}
          <View style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>Medium Problems</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.difficultyBadgeText}>MEDIUM</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[theme.colors.warning, theme.colors.warning + 'CC']}
                style={[styles.progressFill, { width: `${difficultyStats.medium.percentage}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {difficultyStats.medium.solved} / {difficultyStats.medium.total} solved ({difficultyStats.medium.percentage}%)
            </Text>
          </View>

          {/* Hard */}
          <View style={styles.difficultyCard}>
            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>Hard Problems</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.difficultyBadgeText}>HARD</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[theme.colors.error, theme.colors.error + 'CC']}
                style={[styles.progressFill, { width: `${difficultyStats.hard.percentage}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {difficultyStats.hard.solved} / {difficultyStats.hard.total} solved ({difficultyStats.hard.percentage}%)
            </Text>
          </View>
        </Animatable.View>

        {/* Settings */}
        <Animatable.View animation="fadeInUp" delay={500} style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.textSecondary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color={theme.colors.textSecondary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Theme</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.textSecondary} style={styles.settingIcon} />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Animatable.View>

        {/* Logout Button */}
        <Animatable.View animation="fadeInUp" delay={700} style={styles.logoutButton}>
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.logoutButtonContent}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text }))}
                  placeholder="Enter your username"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Time Limit (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.daily_time_limit}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, daily_time_limit: text }))}
                  placeholder="120"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
