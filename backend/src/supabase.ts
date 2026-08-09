import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log(`[SUPABASE CLOUD DB] Connected to Supabase Project at ${supabaseUrl}`);
  } catch (err) {
    console.warn('[SUPABASE WARN] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[SUPABASE INFO] SUPABASE_URL / SUPABASE_KEY not configured yet. Operating in local SQLite mode (database/vetri_indane.db).');
}

export const getSupabase = (): SupabaseClient | null => supabaseClient;

export const isSupabaseConfigured = (): boolean => supabaseClient !== null;
