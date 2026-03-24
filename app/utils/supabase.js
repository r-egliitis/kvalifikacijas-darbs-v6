// utils/supabase.js
// This file creates a single Supabase client that is reused across the entire app.
// Think of it like a "door" to the database — we open it once and use it everywhere.
//
// useRuntimeConfig() reads our environment variables from .env (via nuxt.config.ts),
// making it safe for both server-side and client-side rendering.

import { createClient } from '@supabase/supabase-js'

// useRuntimeConfig is a Nuxt composable that gives access to runtimeConfig values
const config = useRuntimeConfig()

// Create and export the Supabase client instance
// - supabaseUrl: the URL of your Supabase project
// - supabaseKey: the public "anon" key (safe to use in the browser)
export const supabase = createClient(
  config.public.supabaseUrl,
  config.public.supabaseKey
)
