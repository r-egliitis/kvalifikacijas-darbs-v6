// stores/auth.js
// This is the global authentication store powered by Pinia.
// It holds the current logged-in user and their profile data,
// and makes this information available to every page and component.

import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // useSupabase() is auto-imported from app/composables/useSupabase.js
  // It is safe to call here because defineStore's setup function runs inside the Nuxt context
  const supabase = useSupabase()

  // ─── State ────────────────────────────────────────────────────────────────

  // user: the Supabase Auth user object (contains email, id, app_metadata, etc.)
  const user = ref(null)

  // profile: the row from our 'profiles' table for the current user
  const profile = ref(null)

  // loading: true while we are checking if a user is logged in (on page load)
  const loading = ref(true)

  // ─── Computed ─────────────────────────────────────────────────────────────

  // isLoggedIn: a quick yes/no check used to guard protected pages
  const isLoggedIn = computed(() => !!user.value)

  // isAdmin: checks Supabase JWT custom claim to see if this user is an admin
  const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function fetchProfile() {
    if (!user.value) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', user.value.id)
      .single()

    if (!error && data) {
      profile.value = data
    }
  }

  // init: called once when the app starts to restore any existing login session
  async function init() {
    loading.value = true

    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      user.value = session.user
      await fetchProfile()
    }

    loading.value = false

    // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        user.value = session.user
        await fetchProfile()
      } else {
        user.value = null
        profile.value = null
      }
    })
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await fetchProfile()
    return data
  }

  async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    user.value = data.user

    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({ profile_id: data.user.id })
        .eq('profile_id', data.user.id)

      await fetchProfile()
    }

    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return {
    user, profile, loading, isLoggedIn, isAdmin,
    init, login, register, logout, fetchProfile,
  }
})
