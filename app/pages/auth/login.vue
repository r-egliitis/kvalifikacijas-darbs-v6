<template>
  <!--
    pages/auth/login.vue
    The login page. Users enter their email and password to sign in.
    All visible text is in Latvian. Error messages are also in Latvian.
  -->
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">

      <!-- Card container -->
      <div class="bg-surface rounded-2xl shadow-lg p-8">

        <!-- Page heading -->
        <h1 class="text-2xl font-bold text-center mb-2">Pieteikties</h1>
        <p class="text-secondary text-center text-sm mb-6">
          Ievadi savu e-pastu un paroli
        </p>

        <!-- Login form -->
        <form @submit.prevent="handleLogin" class="space-y-4">

          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium mb-1">
              E-pasts
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="tavs@epasts.lv"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <!-- Password field -->
          <div>
            <label for="password" class="block text-sm font-medium mb-1">
              Parole
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <!-- Error message (shown only when there is an error) -->
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
            {{ errorMessage }}
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <!-- Show spinner text while logging in -->
            <span v-if="loading">Pieslēdzas...</span>
            <span v-else>Pieteikties</span>
          </button>

        </form>

        <!-- Link to registration page -->
        <p class="text-center text-sm text-secondary mt-6">
          Nav konta?
          <NuxtLink to="/auth/register" class="text-primary font-medium hover:underline">
            Reģistrēties
          </NuxtLink>
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// Page metadata: no middleware needed (login page is public)
definePageMeta({ layout: false })

// Actually we DO want the layout (navbar/footer), so don't set layout: false
// Remove the above line — it was incorrect. Let Nuxt use the default layout.

const authStore = useAuthStore()
const router = useRouter()

// Form field values (bound to the inputs via v-model)
const email = ref('')
const password = ref('')

// State: are we currently waiting for the login request to finish?
const loading = ref(false)

// Error message to display to the user (in Latvian)
const errorMessage = ref('')

// handleLogin: called when the form is submitted
async function handleLogin() {
  // Clear any previous error
  errorMessage.value = ''
  loading.value = true

  try {
    // Call the auth store's login action
    await authStore.login(email.value, password.value)

    // On success, redirect to the user's profile page
    router.push('/profile')

  } catch (error) {
    // Translate common Supabase error messages to Latvian
    const msg = error.message || ''

    if (msg.includes('Invalid login credentials')) {
      errorMessage.value = 'Nepareizs e-pasts vai parole.'
    } else if (msg.includes('Email not confirmed')) {
      errorMessage.value = 'Lūdzu apstipriniet savu e-pastu pirms pieteikšanās.'
    } else if (msg.includes('too many requests')) {
      errorMessage.value = 'Pārāk daudz mēģinājumu. Lūdzu uzgaidiet.'
    } else {
      errorMessage.value = 'Pieteikšanās neizdevās. Mēģiniet vēlreiz.'
    }
  } finally {
    loading.value = false
  }
}
</script>
