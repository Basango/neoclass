import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

// Check if keys are actually provided (not empty and not placeholders)
const hasKeys = SUPABASE_URL && 
                SUPABASE_KEY && 
                SUPABASE_URL.startsWith('https') && 
                !SUPABASE_URL.includes('YOUR_SUPABASE_URL');

export const supabase = hasKeys
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabase) {
  console.log("⚠️ No Supabase keys found. App running in LOCAL DEMO MODE.");
}