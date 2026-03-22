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
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

interface ProblemForm {
  topic: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  leetcode_link: string;
  gfg_link: string;
  companies: string[];
  remarks: string;
}

export default function AdminScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<ProblemForm>({
    topic: '',
    title: '',
    difficulty: 'Easy',
    leetcode_link: '',
    gfg_link: '',
    companies: [],
    remarks: '',
  });
  const [newCompany, setNewCompany] = useState('');
  const [stats, setStats] = useState({
    totalProblems: 375,
    totalTopics: 15,
    hardProblems: 100,
    companies: 50,
  });

  // Check if user is admin
  if (!user?.is_admin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Ionicons name="shield-outline" size={64} color={theme.colors.error} />
          <Text style={styles.unauthorizedTitle}>Access Denied</Text>
          <Text style={styles.unauthorizedText}>
            You don't have permission to access the admin panel.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const addCompany = () => {
    if (newCompany.trim() && !form.companies.includes(newCompany.trim())) {
      setForm(prev => ({
        ...prev,
        companies: [...prev.companies, newCompany.trim()]
      }));
      setNewCompany('');
    }
  };

  const removeCompany = (company: string) => {
    setForm(prev => ({
      ...prev,
      companies: prev.companies.filter(c => c !== company)
    }));
  };

  const validateForm = () => {
    if (!form.topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return false;
    }
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a problem title');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // In a real app, this would submit to the backend
    Alert.alert(
      'Problem Added',
      `Successfully added "${form.title}" to the database.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowAddModal(false);
            resetForm();
            // Update stats
            setStats(prev => ({
              ...prev,
              totalProblems: prev.totalProblems + 1,
              hardProblems: form.difficulty === 'Hard' ? prev.hardProblems + 1 : prev.hardProblems,
            }));
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setForm({
      topic: '',
      title: '',
      difficulty: 'Easy',
      leetcode_link: '',
      gfg_link: '',
      companies: [],
      remarks: '',
    });
    setNewCompany('');
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
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
    actionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    actionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    actionButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    unauthorizedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    unauthorizedTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.error,
      marginTop: 16,
      marginBottom: 8,
    },
    unauthorizedText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
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
      maxHeight: '90%',
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
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    difficultyButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    difficultyButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    difficultyButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    difficultyButtonText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    difficultyButtonTextActive: {
      color: 'white',
      fontWeight: '600',
    },
    companySection: {
      marginBottom: 16,
    },
    companyInputRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    companyInput: {
      flex: 1,
    },
    addCompanyButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    companyTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    companyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    companyTagText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginRight: 4,
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
    submitButton: {
      backgroundColor: theme.colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    submitButtonText: {
      color: 'white',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Manage DSA problems and content</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Database Statistics */}
        <Animatable.View animation="fadeInUp" delay={100}>
          <Text style={styles.actionTitle}>Database Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalProblems}</Text>
              <Text style={styles.statLabel}>Total Problems</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalTopics}</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.hardProblems}</Text>
              <Text style={styles.statLabel}>Hard Problems</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.companies}</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Add Problem */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.actionCard}>
          <Text style={styles.actionTitle}>Add New Problem</Text>
          <Text style={styles.actionDescription}>
            Add a new DSA problem to the database with all necessary details including difficulty, topic, and company tags.
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Add Problem</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Manage Users */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.actionCard}>
          <Text style={styles.actionTitle}>User Management</Text>
          <Text style={styles.actionDescription}>
            View and manage user accounts, monitor progress, and handle user-related administrative tasks.
          </Text>
          <TouchableOpacity>
            <LinearGradient
              colors={[theme.colors.info, theme.colors.info + 'CC']}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Manage Users</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Analytics */}
        <Animatable.View animation="fadeInUp" delay={400} style={styles.actionCard}>
          <Text style={styles.actionTitle}>Analytics Dashboard</Text>
          <Text style={styles.actionDescription}>
            View detailed analytics about user engagement, problem completion rates, and platform usage statistics.
          </Text>
          <TouchableOpacity>
            <LinearGradient
              colors={[theme.colors.warning, theme.colors.warning + 'CC']}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>View Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>

      {/* Add Problem Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Problem</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Topic */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Topic *</Text>
                <TextInput
                  style={styles.input}
                  value={form.topic}
                  onChangeText={(text) => setForm(prev => ({ ...prev, topic: text }))}
                  placeholder="e.g., Array, String, Tree"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Problem Title *</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Two Sum"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Difficulty */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Difficulty</Text>
                <View style={styles.difficultyButtons}>
                  {(['Easy', 'Medium', 'Hard'] as const).map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      style={[
                        styles.difficultyButton,
                        form.difficulty === difficulty && styles.difficultyButtonActive,
                      ]}
                      onPress={() => setForm(prev => ({ ...prev, difficulty }))}
                    >
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          form.difficulty === difficulty && styles.difficultyButtonTextActive,
                        ]}
                      >
                        {difficulty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Companies */}
              <View style={styles.companySection}>
                <Text style={styles.inputLabel}>Companies</Text>
                <View style={styles.companyInputRow}>
                  <TextInput
                    style={[styles.input, styles.companyInput]}
                    value={newCompany}
                    onChangeText={setNewCompany}
                    placeholder="Add company"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <TouchableOpacity style={styles.addCompanyButton} onPress={addCompany}>
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                
                {form.companies.length > 0 && (
                  <View style={styles.companyTags}>
                    {form.companies.map((company, index) => (
                      <View key={index} style={styles.companyTag}>
                        <Text style={styles.companyTagText}>{company}</Text>
                        <TouchableOpacity onPress={() => removeCompany(company)}>
                          <Ionicons name="close" size={12} color={theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* LeetCode Link */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LeetCode Link</Text>
                <TextInput
                  style={styles.input}
                  value={form.leetcode_link}
                  onChangeText={(text) => setForm(prev => ({ ...prev, leetcode_link: text }))}
                  placeholder="https://leetcode.com/problems/..."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* GeeksforGeeks Link */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GeeksforGeeks Link</Text>
                <TextInput
                  style={styles.input}
                  value={form.gfg_link}
                  onChangeText={(text) => setForm(prev => ({ ...prev, gfg_link: text }))}
                  placeholder="https://www.geeksforgeeks.org/..."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Remarks */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.remarks}
                  onChangeText={(text) => setForm(prev => ({ ...prev, remarks: text }))}
                  placeholder="Additional notes or hints about the problem..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={[styles.modalButtonText, styles.submitButtonText]}>Add Problem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
