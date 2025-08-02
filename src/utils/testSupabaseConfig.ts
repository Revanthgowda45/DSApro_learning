/**
 * Test Supabase Configuration
 * This utility checks if Supabase is properly configured
 */

import { supabase } from '../lib/supabase';

export const testSupabaseConfiguration = () => {
  console.log('🔍 Testing Supabase Configuration');
  console.log('=================================');
  
  // Check environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('📋 Environment Variables:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ SET' : '❌ MISSING');
  
  if (supabaseUrl) {
    console.log('🔗 URL:', supabaseUrl.includes('your_supabase') ? '❌ PLACEHOLDER' : '✅ CONFIGURED');
  }
  
  if (supabaseKey) {
    console.log('🔑 Key:', supabaseKey.includes('your_supabase') ? '❌ PLACEHOLDER' : '✅ CONFIGURED');
  }
  
  // Check Supabase client
  console.log('\n🔧 Supabase Client:');
  console.log('Client exists:', supabase ? '✅ YES' : '❌ NO');
  
  if (supabase) {
    console.log('Client type:', typeof supabase);
    console.log('Auth available:', supabase.auth ? '✅ YES' : '❌ NO');
  }
  
  // Determine configuration status
  const isConfigured = supabaseUrl && 
                      supabaseKey && 
                      !supabaseUrl.includes('your_supabase') && 
                      !supabaseKey.includes('your_supabase') &&
                      supabase !== null;
  
  console.log('\n🎯 Configuration Status:');
  if (isConfigured) {
    console.log('✅ Supabase is PROPERLY CONFIGURED');
    console.log('✅ Registration will create Supabase accounts');
  } else {
    console.log('❌ Supabase is NOT CONFIGURED');
    console.log('📱 Registration will use LOCAL FALLBACK');
    
    console.log('\n🛠️ To fix:');
    console.log('1. Check your .env file');
    console.log('2. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    console.log('3. Replace placeholder values with actual Supabase credentials');
    console.log('4. Restart the development server');
  }
  
  return isConfigured;
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  if (!supabase) {
    console.log('❌ Cannot test connection: Supabase client not available');
    return false;
  }
  
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Try to get session (this doesn't require authentication)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Session data available:', data ? 'YES' : 'NO');
    return true;
    
  } catch (error) {
    console.log('❌ Connection test error:', error);
    return false;
  }
};
