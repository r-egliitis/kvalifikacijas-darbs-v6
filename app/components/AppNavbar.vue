<template>
  <!--
    AppNavbar.vue
    The top navigation bar shown on every page.
    Contains: logo/brand, navigation links, dark mode toggle, login/logout button.
  -->
  <nav class="bg-surface border-b border-secondary/20 shadow-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">

      <!-- ── Brand / Logo ──────────────────────────────────────────────── -->
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-primary">
        <!-- Basketball emoji as a simple logo -->
        <span class="text-2xl">🏀</span>
        <span class="hidden sm:inline">Basketbols</span>
      </NuxtLink>

      <!-- ── Navigation Links ─────────────────────────────────────────── -->
      <div class="flex items-center gap-1 sm:gap-4">

        <!-- Public links — always visible -->
        <NuxtLink
          to="/teams"
          class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
        >
          Komandas
        </NuxtLink>

        <NuxtLink
          to="/courts"
          class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
        >
          Laukumi
        </NuxtLink>

        <!-- Authenticated-only links -->
        <template v-if="authStore.isLoggedIn">
          <NuxtLink
            to="/games"
            class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            active-class="text-primary font-semibold"
          >
            Spēles
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            active-class="text-primary font-semibold"
          >
            Profils
          </NuxtLink>
        </template>
      </div>

      <!-- ── Right Side: Dark Mode Toggle + Auth Button ───────────────── -->
      <div class="flex items-center gap-2">

        <!-- Dark mode toggle button -->
        <!-- Switches between light and dark by toggling the 'dark' class on <html> -->
        <button
          @click="toggleDarkMode"
          class="p-2 rounded-full hover:bg-secondary/10 transition-colors"
          :title="isDark ? 'Gaišais režīms' : 'Tumšais režīms'"
          aria-label="Pārslēgt tumšo režīmu"
        >
          <!-- Show sun icon when in dark mode, moon icon when in light mode -->
          <span v-if="isDark" class="text-xl">☀️</span>
          <span v-else class="text-xl">🌙</span>
        </button>

        <!-- Logout button (only shown when logged in) -->
        <button
          v-if="authStore.isLoggedIn"
          @click="handleLogout"
          class="text-sm font-medium px-3 py-1.5 rounded border border-secondary/30 hover:bg-secondary/10 transition-colors"
        >
          Izrakstīties
        </button>

        <!-- Login button (only shown when NOT logged in) -->
        <NuxtLink
          v-else
          to="/auth/login"
          class="text-sm font-medium px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Pieteikties
        </NuxtLink>
      </div>

    </div>
  </nav>
</template>

<script setup>
// Import the auth store to know if the user is logged in
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

// ─── Dark Mode ─────────────────────────────────────────────────────────────

// isDark tracks the current dark mode state.
// We initialize it by checking if the <html> element already has the 'dark' class
// (which could be set from a previously saved preference).
const isDark = ref(false)

// On component mount, read the saved preference from localStorage
onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

// toggleDarkMode: switches between light and dark mode
function toggleDarkMode() {
  isDark.value = !isDark.value

  if (isDark.value) {
    // Add 'dark' class to <html> — CSS variables will switch to dark values
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    // Remove 'dark' class — CSS variables revert to light values
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

// ─── Logout ────────────────────────────────────────────────────────────────

// handleLogout: calls the auth store's logout action and redirects to home
async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>
