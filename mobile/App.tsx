import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialize services safely after component mounts
    const initializeServices = async () => {
      try {
        console.log('🚀 DSA Mobile: Starting app...');
        
        // Initialize notification service safely
        try {
          const { NotificationService } = await import('./src/services/NotificationService');
          await NotificationService.initialize();
          console.log('✅ Notifications initialized');
        } catch (error) {
          console.warn('⚠️ Failed to initialize notifications:', error);
        }

        // Initialize app services safely
        try {
          const { initializeApp } = await import('./src/utils/appInitializer');
          await initializeApp();
          console.log('✅ App services initialized');
        } catch (error) {
          console.warn('⚠️ Failed to initialize app services:', error);
        }

        console.log('✅ DSA Mobile: App started successfully');
      } catch (error) {
        console.error('❌ DSA Mobile: App initialization failed:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
