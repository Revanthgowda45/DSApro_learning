import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import { cleanupLocalStorage } from './lib/storageUtils';
import { initProductionOptimizations, forceSupabaseConnection } from './utils/productionOptimizer';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';

import Admin from './pages/Admin';
import Stopwatch from './pages/Stopwatch';
import './utils/progressReset'; // Import for console access
import './utils/resetAnalytics'; // Import reset analytics utility
import { NotificationService } from './services/notificationService';

import './utils/adminConsole'; // Import admin console utilities

// Initialize production optimizations first
console.log('🚀 DSA App: Initializing production optimizations...');
initProductionOptimizations();

// Initialize notification service
NotificationService.initialize().catch(error => {
  console.warn('⚠️ DSA App: Failed to initialize notifications:', error);
});

// Clean up localStorage on app startup
try {
  cleanupLocalStorage();
} catch (error) {
  console.warn('⚠️ DSA App: Error cleaning localStorage:', error);
}

// Auth persistence is now handled entirely within AuthContext
// This prevents race conditions and ensures proper loading state management

// Add global functions for console access to debug and force Supabase connection
(window as any).forceSupabaseConnection = forceSupabaseConnection;
(window as any).checkSupabaseHealth = () => {
  const { supabaseHealthManager } = require('./utils/supabaseHealthManager');
  const status = supabaseHealthManager.getHealthStatus();
  console.log('🔍 Supabase Health Status:', status);
  return status;
};

function AppContent() {
  const { user, loading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-green-500 dark:border-t-green-400"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Protected route component to handle authentication checks
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  // Public route component to redirect authenticated users
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    console.log('🔄 PublicRoute: Checking user state:', user ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED');
    if (user) {
      console.log('🚀 PublicRoute: User is authenticated, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    console.log('📝 PublicRoute: User not authenticated, showing public content');
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {user && <Navbar />}
      <main className={user ? "pt-16 pb-16 lg:pb-0" : ""}>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/problems" element={
            <ProtectedRoute>
              <Problems />
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/timer" element={
            <ProtectedRoute>
              <Stopwatch />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<About />} />
          
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/about" replace />
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;