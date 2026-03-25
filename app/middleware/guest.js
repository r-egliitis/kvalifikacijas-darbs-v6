// middleware/guest.js
// Guest-only middleware: redirects already-logged-in users away from auth pages.
// Apply to /auth/login and /auth/register so users can't visit them while logged in.
// This also prevents the "login while already authenticated" hang.
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (authStore.isLoggedIn) {
    return navigateTo('/profile')
  }
})
