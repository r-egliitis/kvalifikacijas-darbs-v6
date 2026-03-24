// stores/auth.js
// This is the global authentication store powered by Pinia.
// It holds the current logged-in user and their profile data,
// and makes this information available to every page and component.

import { defineStore } from 'pinia'
import { supabase } from '~/utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ────────────────────────────────────────────────────────────────

  // user: the Supabase Auth user object (contains email, id, app_metadata, etc.)
  // null means no one is logged in
  const user = ref(null)

  // profile: the row from our 'profiles' table for the current user
  // Contains name, surname, nickname, jersey number, etc.
  const profile = ref(null)

  // loading: true while we are checking if a user is logged in (on page load)
  const loading = ref(true)

  // ─── Computed ─────────────────────────────────────────────────────────────

  // isLoggedIn: a quick yes/no check used to guard protected pages
  const isLoggedIn = computed(() => !!user.value)

  // isAdmin: checks Supabase JWT custom claim to see if this user is an admin
  // Admins can add courts. The claim is set via the set_admin_claim() SQL function.
  const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')

  // ─── Actions ──────────────────────────────────────────────────────────────

  // fetchProfile: loads the profile row from the database for the current user
  async function fetchProfile() {
    if (!user.value) return

    // Query the profiles table for a row matching the current user's UUID
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', user.value.id)
      .single()

    if (!error && data) {
      profile.value = data
    }
  }

  // init: called once when the app starts up.
  // It checks if a user session already exists (e.g. from a previous browser session).
  async function init() {
    loading.value = true

    // getSession() checks for an existing login session stored in the browser
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      user.value = session.user
      await fetchProfile()
    }

    loading.value = false

    // Listen for auth state changes (login, logout, token refresh)
    // This updates our store automatically whenever auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        user.value = session.user
        await fetchProfile()
      } else {
        // User logged out — clear the store
        user.value = null
        profile.value = null
      }
    })
  }

  // login: signs in the user with email and password via Supabase Auth
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await fetchProfile()
    return data
  }

  // register: creates a new account and immediately creates a profile row
  async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    user.value = data.user

    // Upsert a profile row for this new user.
    // We use upsert (insert or update) so this is safe whether or not a database
    // trigger already created the row automatically.
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({ profile_id: data.user.id })
        .eq('profile_id', data.user.id)

      await fetchProfile()
    }

    return data
  }

  // logout: signs out the current user
  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return {
    user,
    profile,
    loading,
    isLoggedIn,
    isAdmin,
    init,
    login,
    register,
    logout,
    fetchProfile,
  }
})
