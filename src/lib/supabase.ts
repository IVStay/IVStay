import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * The browser's Supabase client, or null when the site has no Supabase settings yet
 * (see .env.example). Only the public key is ever used here; the database rules decide
 * what each visitor can read or change.
 *
 * Regenerate the Database type after changing the schema:
 *   npx supabase gen types typescript --local > src/types/database.ts
 */
export const supabase: SupabaseClient<Database> | null =
  url && publishableKey
    ? createClient<Database>(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // "Continue with Google" comes back to the site with a one-time code in the URL;
          // the client swaps it for a session (PKCE flow).
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null;
