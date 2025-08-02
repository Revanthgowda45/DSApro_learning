import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasActiveSession } from '../lib/authPersistence';
import { Loading } from './ui/Loading';
import { User } from '../lib/enhancedAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

/**
 * Enhanced ProtectedRoute component with multi-layer authentication checks
 * Based on CityFixApp's robust route protection system
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  fallbackPath = '/login'
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth is being determined
  if (loading) {
    return <Loading text="Checking authentication..." fullScreen />;
  }

  // Multi-layer authentication check
  const isAuthenticated = user !== null || hasActiveSession();

  // If we require authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If we require admin and user doesn't have admin privileges
  if (requireAdmin && user && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If we don't require authentication and user is authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
