import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Recruiter';
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get admin profile
      const { data: profile, error: profileError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError) throw profileError;

      return {
        id: data.user.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return null;
    }
  },

  async signUp(email: string, password: string, name: string, role: 'Admin' | 'Recruiter' = 'Recruiter'): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create admin profile
      const { data: profile, error: profileError } = await supabase
        .from('admin_users')
        .insert([
          {
            id: data.user?.id,
            email,
            name,
            role,
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return null;
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async resetPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  },
};