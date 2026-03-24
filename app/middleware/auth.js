// middleware/auth.js
// This is a route middleware — it runs BEFORE a protected page is shown.
// If the user is not logged in, they are redirected to the login page.
//
// To protect a page, add this at the top of its <script setup>:
//   definePageMeta({ middleware: 'auth' })

import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  // Get the global auth store
  const authStore = useAuthStore()

  // If the user is not logged in, send them to the login page
  if (!authStore.isLoggedIn) {
    return navigateTo('/auth/login')
  }
})
