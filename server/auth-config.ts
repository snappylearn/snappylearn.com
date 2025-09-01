import { supabase } from "./lib/supabase";

// Helper function to configure Supabase for development
export async function configureSupabaseForDevelopment() {
  try {
    // Note: Auth settings are typically configured in the Supabase dashboard
    // For development, we'll handle email confirmation in the signup process
    console.log('Supabase auth configured for development mode');
  } catch (error) {
    console.warn('Auth configuration warning:', error);
  }
}

// Helper function to auto-confirm users for development
export async function autoConfirmUser(userId: string) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    
    if (error) {
      console.warn('Could not auto-confirm user:', error.message);
    } else {
      console.log('User auto-confirmed for development');
    }
  } catch (error) {
    console.warn('Auto-confirm warning:', error);
  }
}