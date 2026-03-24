<template>
  <!--
    pages/auth/register.vue
    The registration page. New users create an account with email and password.
    After successful registration, they are redirected to the profile edit page
    to fill in their personal details (name, surname, etc.).
  -->
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">

      <!-- Card container -->
      <div class="bg-surface rounded-2xl shadow-lg p-8">

        <!-- Page heading -->
        <h1 class="text-2xl font-bold text-center mb-2">Reģistrēties</h1>
        <p class="text-secondary text-center text-sm mb-6">
          Izveido kontu, lai pievienotos sistēmai
        </p>

        <!-- Success message (shown after successful registration) -->
        <div
          v-if="successMessage"
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ successMessage }}
        </div>

        <!-- Registration form (hidden after success) -->
        <form v-if="!successMessage" @submit.prevent="handleRegister" class="space-y-4">

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
              placeholder="Vismaz 6 rakstzīmes"
              minlength="6"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <!-- Confirm password field -->
          <div>
            <label for="passwordConfirm" class="block text-sm font-medium mb-1">
              Apstiprini paroli
            </label>
            <input
              id="passwordConfirm"
              v-model="passwordConfirm"
              type="password"
              required
              placeholder="Atkārtoti ievadi paroli"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
            {{ errorMessage }}
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <span v-if="loading">Reģistrējas...</span>
            <span v-else>Reģistrēties</span>
          </button>

        </form>

        <!-- Link to login page -->
        <p class="text-center text-sm text-secondary mt-6">
          Jau ir konts?
          <NuxtLink to="/auth/login" class="text-primary font-medium hover:underline">
            Pieteikties
          </NuxtLink>
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

// Form fields
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')

// UI state
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// handleRegister: called when the registration form is submitted
async function handleRegister() {
  errorMessage.value = ''

  // Client-side validation: check passwords match before sending to server
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = 'Paroles nesakrīt.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Parolei jābūt vismaz 6 rakstzīmes garai.'
    return
  }

  loading.value = true

  try {
    // Call the auth store's register action
    // This creates the Supabase Auth user AND upserts a profile row
    const data = await authStore.register(email.value, password.value)

    // Supabase may require email confirmation depending on project settings.
    // If the session is null, the user needs to confirm their email first.
    if (!data.session) {
      successMessage.value = 'Reģistrācija veiksmīga! Lūdzu pārbaudiet savu e-pastu un apstipriniet kontu, lai pieteiktos.'
    } else {
      // Session exists — user is logged in immediately, redirect to profile edit
      router.push('/profile/edit')
    }

  } catch (error) {
    const msg = error.message || ''

    if (msg.includes('User already registered')) {
      errorMessage.value = 'Šis e-pasts jau ir reģistrēts. Pieteicieties vai izmantojiet citu e-pastu.'
    } else if (msg.includes('Password should be')) {
      errorMessage.value = 'Parolei jābūt vismaz 6 rakstzīmes garai.'
    } else if (msg.includes('invalid email')) {
      errorMessage.value = 'Nederīga e-pasta adrese.'
    } else {
      errorMessage.value = 'Reģistrācija neizdevās. Mēģiniet vēlreiz.'
    }
  } finally {
    loading.value = false
  }
}
</script>
