// composables/useSupabase.js
// A composable is a function you can call inside any Vue component or Pinia store.
// This one simply returns the Supabase client that was created by the plugin.
// Because composables in app/composables/ are auto-imported by Nuxt,
// you do NOT need to import this manually — just call useSupabase() directly.

export const useSupabase = () => useNuxtApp().$supabase
