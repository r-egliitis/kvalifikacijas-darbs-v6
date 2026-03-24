<template>
  <!--
    pages/games/challenge.vue
    Form to send a game challenge to another team.
    The user selects: opponent team, court, date/time, and their lineup (players from their team).
    A game_request record is created with status 'pending'.
    This page requires login.
  -->
  <div class="max-w-2xl mx-auto px-4 py-10">

    <h1 class="text-2xl font-bold mb-6">Sūtīt izaicinājumu</h1>

    <!-- No team warning -->
    <div v-if="!myTeamId" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-xl px-4 py-4 mb-6">
      <p class="font-semibold">Nav komandas</p>
      <p class="text-sm mt-1">
        Lai sūtītu izaicinājumu, tev jāpiederas komandai.
        <NuxtLink to="/teams/create" class="underline font-medium">Izveidot komandu</NuxtLink>
        vai pievienojies esošai komandai.
      </p>
    </div>

    <!-- Success message -->
    <div v-if="savedOk" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-6">
      ✅ Izaicinājums nosūtīts! Gaidi otras komandas apstiprinājumu.
      <NuxtLink to="/games" class="font-medium underline ml-1">Skatīt izaicinājumus</NuxtLink>
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
      {{ errorMessage }}
    </div>

    <!-- Challenge form (only if user has a team) -->
    <form v-if="myTeamId" @submit.prevent="handleChallenge" class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6 space-y-6">

      <!-- ── Opponent Team ──────────────────────────────────────────────── -->
      <div>
        <label class="block text-sm font-medium mb-1">
          Pretinieka komanda <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.opponentTeamId"
          required
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        >
          <option value="">Izvēlies komandu</option>
          <option
            v-for="team in opponentTeams"
            :key="team.team_id"
            :value="team.team_id"
          >
            {{ team.name }} {{ team.city ? '· ' + team.city : '' }}
          </option>
        </select>
      </div>

      <!-- ── Court ─────────────────────────────────────────────────────── -->
      <div>
        <label class="block text-sm font-medium mb-1">
          Laukums <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.courtId"
          required
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        >
          <option value="">Izvēlies laukumu</option>
          <option
            v-for="court in courts"
            :key="court.court_id"
            :value="court.court_id"
          >
            {{ court.name }} ({{ court.outdoor ? 'Ārtelpas' : 'Iekštelpas' }})
          </option>
        </select>
      </div>

      <!-- ── Date and Time ─────────────────────────────────────────────── -->
      <div>
        <label class="block text-sm font-medium mb-1">
          Datums un laiks <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.timestamp"
          type="datetime-local"
          required
          :min="minDateTime"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- ── My Lineup (player selection) ─────────────────────────────── -->
      <div>
        <label class="block text-sm font-medium mb-2">
          Mans sākumsastāvs <span class="text-red-500">*</span>
        </label>
        <p class="text-xs text-secondary mb-3">
          Izvēlies spēlētājus, kas piedalīsies šajā spēlē (min. 1):
        </p>

        <!-- Loading state for team members -->
        <div v-if="loadingMembers" class="text-secondary text-sm">Ielādē spēlētājus...</div>

        <!-- No members state -->
        <div v-else-if="myTeamMembers.length === 0" class="text-secondary text-sm">
          Jūsu komandā nav spēlētāju. Uzaiciniet spēlētājus.
        </div>

        <!-- Player checkboxes -->
        <div v-else class="space-y-2 max-h-48 overflow-y-auto border border-secondary/20 rounded-xl p-3">
          <label
            v-for="member in myTeamMembers"
            :key="member.profile_id"
            class="flex items-center gap-3 cursor-pointer hover:bg-secondary/5 rounded-lg p-1.5 transition"
          >
            <input
              type="checkbox"
              :value="member.profile_id"
              v-model="form.selectedPlayers"
              class="rounded text-primary"
            />
            <span>
              {{ member.name }} {{ member.surname }}
              <span v-if="member.nickname" class="text-secondary text-sm">„{{ member.nickname }}"</span>
              <span v-if="member.number !== null" class="text-secondary text-xs ml-1">#{{ member.number }}</span>
            </span>
          </label>
        </div>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="saving || form.selectedPlayers.length === 0"
        class="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <span v-if="saving">Sūta...</span>
        <span v-else>Sūtīt izaicinājumu ⚔️</span>
      </button>

    </form>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { supabase } from '~/utils/supabase'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

// ─── State ────────────────────────────────────────────────────────────────
const saving        = ref(false)
const savedOk       = ref(false)
const errorMessage  = ref('')
const loadingMembers = ref(false)

const opponentTeams  = ref([])  // all teams except the user's own team
const courts         = ref([])  // all available courts
const myTeamMembers  = ref([])  // members of the user's team

// The current user's team ID
const myTeamId = computed(() => authStore.profile?.current_team)

// Minimum datetime for the picker — must be at least 1 hour from now
const minDateTime = computed(() => {
  const d = new Date()
  d.setHours(d.getHours() + 1)
  // Format for datetime-local input: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16)
})

// Form data
const form = reactive({
  opponentTeamId:  '',
  courtId:         '',
  timestamp:       '',
  selectedPlayers: [], // array of profile_id UUIDs
})

// ─── Data Fetching ────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([fetchOpponentTeams(), fetchCourts(), fetchMyTeamMembers()])
})

// fetchOpponentTeams: all teams except the user's own
async function fetchOpponentTeams() {
  const { data } = await supabase
    .from('teams')
    .select('team_id, name, city')
    .neq('team_id', myTeamId.value || '')
    .order('name')

  opponentTeams.value = data || []
}

// fetchCourts: all courts for the dropdown
async function fetchCourts() {
  const { data } = await supabase
    .from('courts')
    .select('court_id, name, outdoor')
    .order('name')

  courts.value = data || []
}

// fetchMyTeamMembers: the players in the user's current team
async function fetchMyTeamMembers() {
  if (!myTeamId.value) return

  loadingMembers.value = true

  const { data } = await supabase
    .from('team_members')
    .select(`
      profile:profiles (
        profile_id, name, surname, nickname, number
      )
    `)
    .eq('team_id', myTeamId.value)

  // Flatten the nested profile objects into a simple array
  myTeamMembers.value = (data || []).map(m => m.profile).filter(Boolean)

  loadingMembers.value = false
}

// ─── Submit ───────────────────────────────────────────────────────────────

async function handleChallenge() {
  if (!form.opponentTeamId || !form.courtId || !form.timestamp) {
    errorMessage.value = 'Lūdzu aizpildi visus obligātos laukus.'
    return
  }
  if (form.selectedPlayers.length === 0) {
    errorMessage.value = 'Izvēlies vismaz vienu spēlētāju sākumsastāvam.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    // ── Step 1: Create a lineup for MY team ─────────────────────────────
    const { data: myLineup, error: lineupError } = await supabase
      .from('lineups')
      .insert({ team_id: myTeamId.value })
      .select()
      .single()

    if (lineupError) throw new Error('Neizdevās izveidot sākumsastāvu.')

    // ── Step 2: Add selected players to the lineup ───────────────────────
    const lineupPlayers = form.selectedPlayers.map(profileId => ({
      lineup_id:  myLineup.lineup_id,
      profile_id: profileId,
      role:       'player',
    }))

    const { error: playersError } = await supabase
      .from('lineup_players')
      .insert(lineupPlayers)

    if (playersError) throw new Error('Neizdevās pievienot spēlētājus sākumsastāvam.')

    // ── Step 3: Create a "placeholder" lineup for the opponent team ──────
    // The opponent team will confirm with their own lineup when they accept,
    // but we need lineup_02 to exist in the game_request.
    const { data: opponentLineup, error: oppLineupError } = await supabase
      .from('lineups')
      .insert({ team_id: form.opponentTeamId })
      .select()
      .single()

    if (oppLineupError) throw new Error('Neizdevās izveidot pretinieka sākumsastāvu.')

    // ── Step 4: Create the game_request ─────────────────────────────────
    const { error: reqError } = await supabase
      .from('game_requests')
      .insert({
        lineup_01:  myLineup.lineup_id,
        lineup_02:  opponentLineup.lineup_id,
        court_id:   form.courtId,
        status:     'pending',
        timestamp:  new Date(form.timestamp).toISOString(),
      })

    if (reqError) throw new Error('Neizdevās nosūtīt izaicinājumu.')

    savedOk.value = true

    // Reset form
    Object.assign(form, { opponentTeamId: '', courtId: '', timestamp: '', selectedPlayers: [] })

  } catch (error) {
    errorMessage.value = error.message || 'Kļūda. Mēģiniet vēlreiz.'
  } finally {
    saving.value = false
  }
}
</script>
