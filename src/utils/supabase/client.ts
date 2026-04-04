import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientInstance: SupabaseClient<any, "public", any> | null = null;

export const createClient = (): SupabaseClient<any, "public", any> => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key must be defined.');
  }
  
  // Singleton pattern to prevent re-initializing in Dev mode
  if (!clientInstance) {
    clientInstance = createSupabaseClient<any, "public", any>(supabaseUrl, supabaseKey);
  }
  
  return clientInstance;
};
