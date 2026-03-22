import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import LinearGradient from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

interface AboutScreenProps {
  navigation: any;
}

export default function AboutScreen({ navigation }: AboutScreenProps) {
  const { theme } = useTheme();

  const features = [
    {
      icon: 'book-outline',
      title: '375+ Problems',
      description: 'Comprehensive collection of DSA problems from easy to hard',
    },
    {
      icon: 'trending-up-outline',
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics',
    },
    {
      icon: 'game-controller-outline',
      title: 'AI Gaming',
      description: 'Interactive challenges with AI-powered feedback',
    },
    {
      icon: 'code-outline',
      title: 'Code Editor',
      description: 'Practice coding with our built-in multi-language editor',
    },
    {
      icon: 'notifications-outline',
      title: 'Smart Reminders',
      description: 'Professional notification system to maintain consistency',
    },
    {
      icon: 'timer-outline',
      title: 'Time Tracking',
      description: 'Track time spent on each problem and session',
    },
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open link:', url);
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    content: {
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    featuresGrid: {
      marginBottom: 40,
    },
    featureCard: {
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
    featureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 40,
      paddingVertical: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
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
    actionButtons: {
      marginBottom: 40,
    },
    primaryButton: {
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    secondaryButton: {
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    socialLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
    },
    socialButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.logoContainer}
          >
            <Ionicons name="code-slash" size={50} color="white" />
          </LinearGradient>
          <Text style={styles.title}>DSA Tracker</Text>
          <Text style={styles.subtitle}>Master Data Structures & Algorithms</Text>
          <Text style={styles.description}>
            Your comprehensive companion for learning and mastering data structures and algorithms.
            Track progress, solve problems, and build coding confidence.
          </Text>
        </Animatable.View>

        <View style={styles.content}>
          {/* Stats */}
          <Animatable.View animation="fadeInUp" delay={300} style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>375+</Text>
              <Text style={styles.statLabel}>Problems</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>15+</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10+</Text>
              <Text style={styles.statLabel}>Languages</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </Animatable.View>

          {/* Features */}
          <Animatable.View animation="fadeInUp" delay={600}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <Animatable.View
                  key={index}
                  animation="fadeInUp"
                  delay={800 + index * 100}
                  style={styles.featureCard}
                >
                  <View style={styles.featureHeader}>
                    <LinearGradient
                      colors={[theme.colors.primary + '20', theme.colors.secondary + '20']}
                      style={styles.featureIconContainer}
                    >
                      <Ionicons
                        name={feature.icon as any}
                        size={24}
                        color={theme.colors.primary}
                      />
                    </LinearGradient>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                  </View>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </Animatable.View>
              ))}
            </View>
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View animation="fadeInUp" delay={1400} style={styles.actionButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Footer */}
          <Animatable.View animation="fadeInUp" delay={1600} style={styles.footer}>
            <Text style={styles.footerText}>
              Built with ❤️ for developers who want to excel in coding interviews
            </Text>
            
            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://github.com')}
              >
                <Ionicons name="logo-github" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://linkedin.com')}
              >
                <Ionicons name="logo-linkedin" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOpenLink('https://twitter.com')}
              >
                <Ionicons name="logo-twitter" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
