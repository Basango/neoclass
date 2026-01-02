import { UserProfile } from "../types";
import { supabase } from "./supabase";

export const authService = {
  signUp: async (name: string, email: string, password: string, grade: string): Promise<{ user: UserProfile | null, session: any }> => {
    // --- SUPABASE MODE ---
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, grade } }
      });
      if (error) throw new Error(error.message);
      
      let profile: UserProfile | null = null;
      if (data.user) {
          profile = {
              id: data.user.id,
              name: name,
              email: email,
              grade: grade,
              joinedAt: new Date().toISOString()
          };
      }
      return { user: profile, session: data.session };
    }

    // --- LOCAL STORAGE MODE (DEMO) ---
    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name,
      email,
      grade,
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem('neoclass_user', JSON.stringify(newUser));
    return { user: newUser, session: { access_token: 'demo-token' } };
  },

  signIn: async (email: string, password: string): Promise<UserProfile> => {
    // --- SUPABASE MODE ---
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("No user found.");

      const meta = data.user.user_metadata || {};
      return {
          id: data.user.id,
          name: meta.full_name || email.split('@')[0],
          email: data.user.email || email,
          grade: meta.grade || '10',
          joinedAt: data.user.created_at
      };
    }

    // --- LOCAL STORAGE MODE (DEMO) ---
    // For demo, we just check if a user exists in local storage, or create a mock one
    const stored = localStorage.getItem('neoclass_user');
    if (stored) {
      return JSON.parse(stored);
    }
    // Allow "login" even if no previous signup in demo (auto-create)
    const demoUser: UserProfile = {
        id: 'demo-user-id',
        name: 'Demo Student',
        email,
        grade: '10',
        joinedAt: new Date().toISOString()
    };
    localStorage.setItem('neoclass_user', JSON.stringify(demoUser));
    return demoUser;
  },

  logout: async () => {
    if (supabase) {
        await supabase.auth.signOut();
    } else {
        localStorage.removeItem('neoclass_user');
        // Force reload to clear state in demo mode
        window.location.reload();
    }
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const meta = user.user_metadata || {};
      return {
          id: user.id,
          name: meta.full_name || user.email?.split('@')[0] || 'Student',
          email: user.email || '',
          grade: meta.grade || '10',
          joinedAt: user.created_at
      };
    } else {
      const stored = localStorage.getItem('neoclass_user');
      return stored ? JSON.parse(stored) : null;
    }
  }
};