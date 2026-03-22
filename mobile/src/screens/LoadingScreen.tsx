import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'expo-linear-gradient';

export default function LoadingScreen() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    spinner: {
      marginTop: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={1500}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.logoContainer}
          >
            <Ionicons
              name="code-slash"
              size={40}
              color="white"
            />
          </LinearGradient>
        </Animatable.View>

        <Animatable.Text
          animation="fadeInUp"
          delay={300}
          style={styles.title}
        >
          DSA Tracker
        </Animatable.Text>

        <Animatable.Text
          animation="fadeInUp"
          delay={600}
          style={styles.subtitle}
        >
          Master Data Structures & Algorithms
        </Animatable.Text>

        <Animatable.View
          animation="fadeInUp"
          delay={900}
          style={styles.spinner}
        >
          <Animatable.View
            animation="rotate"
            iterationCount="infinite"
            duration={2000}
          >
            <Ionicons
              name="refresh"
              size={32}
              color={theme.colors.primary}
            />
          </Animatable.View>
          <Text style={styles.loadingText}>Loading your session...</Text>
        </Animatable.View>
      </View>
    </SafeAreaView>
  );
}
