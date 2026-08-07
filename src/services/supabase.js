// ============================================================================
// Supabase client.
//
// Creates a single, reusable Supabase client instance and exposes a small
// helper, `isSupabaseConfigured`, used by the data layer to decide whether
// to talk to the real backend or fall back to the in-memory mock data.
//
// Environment variables are read from Vite's `import.meta.env`. Create a
// `.env` file at the project root (see `.env.example`) before wiring real
// calls:
//
//   VITE_SUPABASE_URL=your-project-url
//   VITE_SUPABASE_ANON_KEY=your-anon-key
// ============================================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True only when real Supabase credentials are present in the environment. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Intentionally just a warning, not a thrown error — the app must keep
  // working in mock-demo mode even before credentials are configured.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'The data layer will fall back to in-memory mock data.'
  )
}

/** Null when Supabase isn't configured; the data layer uses `isSupabaseConfigured` to skip it. */
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null