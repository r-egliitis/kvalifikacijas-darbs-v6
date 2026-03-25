<template>
  <!--
    pages/profile/index.vue
    The "My Profile" page — shows the current user's profile information.
    This page is protected (requires login).
  -->
  <div class="max-w-2xl mx-auto px-4 py-10">

    <!-- Page title -->
    <h1 class="text-2xl font-bold mb-6">Mans profils</h1>

    <!-- Success banner — shown when redirected from /profile/edit?saved=true -->
    <div
      v-if="showSavedMessage"
      class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2"
    >
      ✅ Profils saglabāts veiksmīgi!
    </div>

    <!-- Loading state while profile data is being fetched -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <div class="text-4xl mb-3">⏳</div>
      <p>Ielādē profilu...</p>
    </div>

    <!-- Profile card (shown once data is loaded) -->
    <div v-else class="bg-surface rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">

      <!-- ── Header: Photo + Name ──────────────────────────────────────── -->
      <div class="bg-gradient-to-r from-primary/10 to-accent/5 p-6 flex items-center gap-5">

        <!-- Profile photo or default avatar -->
        <div class="flex-shrink-0">
          <img
            v-if="profile?.picture"
            :src="profile.picture"
            alt="Profilbilde"
            class="w-24 h-24 rounded-full object-cover border-4 border-surface shadow"
          />
          <!-- Default avatar when no photo is set -->
          <div
            v-else
            class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-surface shadow text-4xl"
          >
            🙋
          </div>
        </div>

        <!-- Name and visual ID -->
        <div>
          <!-- Full name (or placeholder if not set) -->
          <h2 class="text-xl font-bold">
            {{ fullName || 'Vārds nav norādīts' }}
          </h2>
          <!-- Nickname -->
          <p v-if="profile?.nickname" class="text-secondary text-sm">
            „{{ profile.nickname }}"
          </p>
          <!-- Visual ID (like a player card number) -->
          <p class="text-xs text-secondary/60 mt-1 font-mono">
            {{ profile?.visual_id }}
          </p>
        </div>
      </div>

      <!-- ── Profile Details ────────────────────────────────────────────── -->
      <div class="p-6 space-y-4">

        <!-- Jersey number -->
        <div class="flex justify-between items-center py-3 border-b border-secondary/10">
          <span class="text-secondary text-sm font-medium">Krekla numurs</span>
          <span class="font-semibold">
            {{ profile?.number !== null && profile?.number !== undefined ? '#' + profile.number : '—' }}
          </span>
        </div>

        <!-- Birthday -->
        <div class="flex justify-between items-center py-3 border-b border-secondary/10">
          <span class="text-secondary text-sm font-medium">Dzimšanas datums</span>
          <span class="font-semibold">{{ formattedBirthday || '—' }}</span>
        </div>

        <!-- Current team -->
        <div class="flex justify-between items-center py-3 border-b border-secondary/10">
          <span class="text-secondary text-sm font-medium">Komanda</span>
          <span class="font-semibold">
            <NuxtLink
              v-if="teamName"
              :to="`/teams/${profile.current_team}`"
              class="text-primary hover:underline"
            >
              {{ teamName }}
            </NuxtLink>
            <span v-else class="text-secondary">Nav komandas</span>
          </span>
        </div>

        <!-- Email (from auth) -->
        <div class="flex justify-between items-center py-3">
          <span class="text-secondary text-sm font-medium">E-pasts</span>
          <span class="font-semibold text-sm">{{ authStore.user?.email }}</span>
        </div>

      </div>

      <!-- ── Edit Button ─────────────────────────────────────────────────── -->
      <div class="px-6 pb-6">
        <NuxtLink
          to="/profile/edit"
          class="block w-full text-center bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition"
        >
          Rediģēt profilu
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// This page requires the user to be logged in
definePageMeta({ middleware: 'auth' })

const supabase = useSupabase()
const authStore = useAuthStore()
const route = useRoute()

// showSavedMessage: true when redirected from /profile/edit after a successful save.
// The edit page appends ?saved=true to the URL on success.
const showSavedMessage = computed(() => route.query.saved === 'true')

// Loading state for the team name fetch
const loading = ref(true)
const teamName = ref('')

// profile is read directly from the auth store (already fetched on login)
const profile = computed(() => authStore.profile)

// fullName: combines first name and last name into one string
const fullName = computed(() => {
  const parts = [profile.value?.name, profile.value?.surname].filter(Boolean)
  return parts.join(' ')
})

// formattedBirthday: converts ISO date string to a readable Latvian format
const formattedBirthday = computed(() => {
  if (!profile.value?.birthday) return null
  const date = new Date(profile.value.birthday)
  // Use Latvian locale for date formatting
  return date.toLocaleDateString('lv-LV', { year: 'numeric', month: 'long', day: 'numeric' })
})

// On mount, fetch the team name if the user has a current_team
onMounted(async () => {
  loading.value = true

  if (profile.value?.current_team) {
    // Fetch the team name from the teams table using the team_id
    const { data } = await supabase
      .from('teams')
      .select('name')
      .eq('team_id', profile.value.current_team)
      .single()

    if (data) teamName.value = data.name
  }

  loading.value = false
})
</script>
