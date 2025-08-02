/**
 * Authentication Validation Utilities
 * Implements secure user validation and credential checking
 */

// Predefined valid users for local authentication (for demo/development)
const VALID_LOCAL_USERS = [
  {
    email: 'admin@dsa.com',
    password: 'admin123',
    role: 'admin',
    username: 'admin'
  },
  {
    email: 'student@dsa.com', 
    password: 'student123',
    role: 'student',
    username: 'student'
  },
  {
    email: 'demo@dsa.com',
    password: 'demo123', 
    role: 'student',
    username: 'demo'
  }
];

/**
 * Validates local user credentials
 * @param email User email
 * @param password User password
 * @returns Valid user data or null if invalid
 */
export const validateLocalCredentials = (email: string, password: string) => {
  console.log('🔐 Validating local credentials for:', email);
  
  // Find user with matching email and password
  const validUser = VALID_LOCAL_USERS.find(
    user => user.email.toLowerCase() === email.toLowerCase() && user.password === password
  );
  
  if (validUser) {
    console.log('✅ Valid local credentials found for:', email);
    return {
      id: `local-${validUser.username}-${Date.now()}`,
      email: validUser.email,
      username: validUser.username,
      full_name: validUser.username.charAt(0).toUpperCase() + validUser.username.slice(1),
      role: validUser.role,
      is_admin: validUser.role === 'admin',
      avatar_url: null,
      learning_pace: 'medium',
      daily_time_limit: 120,
      difficulty_preferences: ['Easy', 'Medium'],
      adaptive_difficulty: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  console.log('❌ Invalid local credentials for:', email);
  return null;
};

/**
 * Validates email format
 * @param email Email to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password Password to validate
 * @returns Object with validation result and message
 */
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true, message: 'Password is valid' };
};

/**
 * Checks if user exists in local users list
 * @param email Email to check
 * @returns True if user exists
 */
export const userExists = (email: string): boolean => {
  return VALID_LOCAL_USERS.some(user => user.email.toLowerCase() === email.toLowerCase());
};

/**
 * Gets available demo credentials for display
 * @returns Array of demo credentials (without passwords)
 */
export const getDemoCredentials = () => {
  return VALID_LOCAL_USERS.map(user => ({
    email: user.email,
    role: user.role,
    username: user.username
  }));
};
