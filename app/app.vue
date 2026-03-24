<template>
  <!--
    app.vue — The root component of the entire application.
    Every page is rendered inside the <NuxtPage /> slot.
    AppNavbar and AppFooter wrap all pages consistently.
  -->
  <div class="min-h-screen flex flex-col bg-background text-app-text">
    <!-- Top navigation bar (always visible) -->
    <AppNavbar />

    <!-- Main content area — each page renders here -->
    <main class="flex-1">
      <!-- NuxtPage renders the current route's page component -->
      <NuxtPage />
    </main>

    <!-- Footer (always visible at the bottom) -->
    <AppFooter />
  </div>
</template>

<script setup>
// Import and initialize the auth store when the app starts.
// This checks if the user is already logged in (from a saved browser session).
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// onMounted runs once, after the app is ready in the browser.
// We call init() to restore any existing login session.
onMounted(async () => {
  await authStore.init()

  // Also restore dark mode preference from localStorage
  const savedDark = localStorage.getItem('darkMode')
  if (savedDark === 'true') {
    document.documentElement.classList.add('dark')
  }
})
</script>
