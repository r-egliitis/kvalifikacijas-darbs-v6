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
      <Icon name="ph:check-circle" class="w-4 h-4 shrink-0" /> Profils saglabāts veiksmīgi!
    </div>

    <!-- Loading state while profile data is being fetched -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <Icon name="ph:hourglass" class="w-12 h-12 mx-auto mb-3" />
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
            class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-surface shadow"
          >
            <Icon name="ph:user" class="w-12 h-12 text-primary/60" />
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
              :to="`/teams/${profile?.current_team}`"
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

    <!-- ── Delete account ─────────────────────────────────────────────── -->
    <div class="mt-8 pt-6 border-t border-secondary/20">
      <button
        @click="openDeleteModal"
        class="text-sm text-red-500 hover:text-red-600 hover:underline transition"
      >
        Dzēst kontu
      </button>
    </div>

    <!-- ── Delete confirmation modal ──────────────────────────────────── -->
    <div
      v-if="deleteModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
      @click.self="deleteModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          @click="deleteModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none"
        >✕</button>

        <!-- Blocked: captain with other members -->
        <template v-if="deleteModal.state === 'blocked-captain'">
          <Icon name="ph:warning" class="w-10 h-10 text-amber-500 mb-3" />
          <p class="font-semibold mb-2">Nevar dzēst kontu</p>
          <p class="text-sm text-secondary">
            Jūs esat komandas <strong>{{ teamName }}</strong> kapteinis un komandā ir citi spēlētāji.
            Pirms konta dzēšanas nododiet kapteiņa lomu citam spēlētājam.
          </p>
          <button
            @click="deleteModal.show = false"
            class="mt-5 w-full border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
          >Labi</button>
        </template>

        <!-- Blocked: has accepted game -->
        <template v-else-if="deleteModal.state === 'blocked-game'">
          <Icon name="ph:warning" class="w-10 h-10 text-amber-500 mb-3" />
          <p class="font-semibold mb-2">Nevar dzēst kontu</p>
          <p class="text-sm text-secondary">
            Jūs esat pierakstījies spēlei, kas vēl nav notikusi.
            Vispirms atceliet dalību spēlē (Spēles → Pieņemtās → Neiešu).
          </p>
          <button
            @click="deleteModal.show = false"
            class="mt-5 w-full border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
          >Labi</button>
        </template>

        <!-- Warning: sole team member — team will be deleted too -->
        <template v-else-if="deleteModal.state === 'warn-team-delete'">
          <Icon name="ph:trash" class="w-10 h-10 text-red-500 mb-3" />
          <p class="font-semibold mb-2">Dzēst kontu?</p>
          <p class="text-sm text-secondary mb-3">
            Jūs esat vienīgais spēlētājs komandā <strong>{{ teamName }}</strong>.
            Dzēšot kontu, <strong>komanda arī tiks dzēsta</strong>.
          </p>
          <p class="text-sm text-secondary">Šo darbību nevar atcelt.</p>
          <div v-if="deleteModal.error" class="mt-3 text-sm text-red-500">{{ deleteModal.error }}</div>
          <div class="flex gap-3 mt-5">
            <button
              @click="confirmDelete(true)"
              :disabled="deleteModal.loading"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition"
            >
              <span v-if="deleteModal.loading">Dzēš...</span>
              <span v-else>Dzēst kontu un komandu</span>
            </button>
            <button
              @click="deleteModal.show = false"
              class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
            >Atcelt</button>
          </div>
        </template>

        <!-- Normal confirmation -->
        <template v-else-if="deleteModal.state === 'confirm'">
          <Icon name="ph:trash" class="w-10 h-10 text-red-500 mb-3" />
          <p class="font-semibold mb-2">Dzēst kontu?</p>
          <p class="text-sm text-secondary">
            Jūsu konts tiks neatgriezeniski dzēsts. Vēlāk varēsiet reģistrēties ar to pašu e-pastu.
          </p>
          <div v-if="deleteModal.error" class="mt-3 text-sm text-red-500">{{ deleteModal.error }}</div>
          <div class="flex gap-3 mt-5">
            <button
              @click="confirmDelete(false)"
              :disabled="deleteModal.loading"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition"
            >
              <span v-if="deleteModal.loading">Dzēš...</span>
              <span v-else>Dzēst kontu</span>
            </button>
            <button
              @click="deleteModal.show = false"
              class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
            >Atcelt</button>
          </div>
        </template>

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
    const { data } = await supabase
      .from('teams')
      .select('name')
      .eq('team_id', profile.value.current_team)
      .single()

    if (data) teamName.value = data.name
  }

  loading.value = false
})

// ─── Delete account ────────────────────────────────────────────────────────

const deleteModal = reactive({
  show:    false,
  state:   '',     // 'blocked-captain' | 'blocked-game' | 'warn-team-delete' | 'confirm'
  loading: false,
  error:   '',
})

async function openDeleteModal() {
  deleteModal.error = ''
  deleteModal.loading = false
  const userId  = authStore.user?.id
  const teamId  = profile.value?.current_team

  // Check 1: block only if deleting this player would leave their team with <3 going players
  const { data: myAcceptVotes } = await supabase
    .from('challenge_votes')
    .select('challenge_id')
    .eq('profile_id', userId)
    .eq('vote', 'accept')

  if (myAcceptVotes?.length) {
    const challengeIds = myAcceptVotes.map(v => v.challenge_id)
    const { data: activeChallenges } = await supabase
      .from('game_challenges')
      .select('challenge_id')
      .in('challenge_id', challengeIds)
      .eq('status', 'accepted')

    if (activeChallenges?.length) {
      // Fetch actual teammates from team_members (reliable source — not challenge_votes.team_id)
      const { data: myTeamMembers } = await supabase
        .from('team_members')
        .select('profile_id')
        .eq('team_id', teamId)
        .neq('profile_id', userId)
      const teammateIds = (myTeamMembers || []).map(m => m.profile_id)

      for (const ch of activeChallenges) {
        // Count teammates (excluding this user) who accepted this challenge
        const { data: othersGoing } = teammateIds.length
          ? await supabase
              .from('challenge_votes')
              .select('profile_id')
              .eq('challenge_id', ch.challenge_id)
              .eq('vote', 'accept')
              .in('profile_id', teammateIds)
          : { data: [] }

        if ((othersGoing?.length ?? 0) < 3) {
          deleteModal.state = 'blocked-game'
          deleteModal.show  = true
          return
        }
      }
    }
  }

  // Check 2: captain status
  if (teamId) {
    const { data: captainRow } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('profile_id', userId)
      .maybeSingle()

    if (captainRow?.role === 'captain') {
      // Count ALL members in the team
      const { data: allMembers } = await supabase
        .from('team_members')
        .select('profile_id')
        .eq('team_id', teamId)

      if ((allMembers?.length ?? 0) > 1) {
        // Other members exist — must hand over captaincy first
        deleteModal.state = 'blocked-captain'
        deleteModal.show  = true
        return
      }

      // Sole member — will delete team too
      deleteModal.state = 'warn-team-delete'
      deleteModal.show  = true
      return
    }
  }

  // Regular player or no team — simple confirmation
  deleteModal.state = 'confirm'
  deleteModal.show  = true
}

async function confirmDelete(deleteTeam) {
  deleteModal.loading = true
  deleteModal.error   = ''

  try {
    const session = await supabase.auth.getSession()
    const token   = session.data?.session?.access_token
    if (!token) throw new Error('Nav aktīvas sesijas.')

    const res = await $fetch('/api/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    { deleteTeam },
    })

    if (res?.ok) {
      // Sign out locally and redirect to home
      await authStore.logout()
      navigateTo('/')
    }
  } catch (err) {
    deleteModal.error   = err?.data?.message || err?.message || 'Kļūda. Mēģiniet vēlreiz.'
    deleteModal.loading = false
  }
}
</script>
