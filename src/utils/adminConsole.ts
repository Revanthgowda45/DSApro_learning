/**
 * Admin Console Utilities
 * Simple console commands for admin management
 */

// Make admin functions available globally for console access
declare global {
  interface Window {
    showAdminInstructions: () => void;
  }
}

// Show admin setup instructions
window.showAdminInstructions = () => {
  console.log(`
🔧 Admin Setup Instructions:

1. Go to your Supabase Dashboard → SQL Editor
2. Run this SQL command (replace with your email):

   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
   
   UPDATE profiles 
   SET is_admin = TRUE 
   WHERE id IN (
       SELECT id 
       FROM auth.users 
       WHERE email = 'your-email@example.com'
   );

3. Verify with:
   SELECT au.email, p.username, p.is_admin 
   FROM profiles p
   JOIN auth.users au ON p.id = au.id
   WHERE p.is_admin = TRUE;

4. Login to your app with that email to access admin panel

📝 Note: Replace 'your-email@example.com' with your actual email address!
`);
};

// Log available functions
console.log(`
🔧 Admin Console Available:

• showAdminInstructions() - Show how to set up admin users

Run showAdminInstructions() for detailed setup steps.
`);

export {};
