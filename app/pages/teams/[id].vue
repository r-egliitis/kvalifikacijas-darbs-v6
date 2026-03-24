<template>
  <!--
    pages/teams/[id].vue
    The team profile page — shows full details about one team:
    name, city, age group, bio, list of players (with roles), and game history.
    [id] is a dynamic route — the team_id comes from the URL, e.g. /teams/T000001
    This page is public (no login required).
  -->
  <div class="max-w-4xl mx-auto px-4 py-10">

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <div class="text-4xl mb-3">⏳</div>
      <p>Ielādē komandu...</p>
    </div>

    <!-- Team not found -->
    <div v-else-if="!team" class="text-center py-16 text-secondary">
      <div class="text-5xl mb-4">❓</div>
      <p class="font-medium">Komanda nav atrasta</p>
      <NuxtLink to="/teams" class="text-primary hover:underline text-sm mt-2 block">
        ← Atpakaļ uz komandām
      </NuxtLink>
    </div>

    <!-- Team profile content -->
    <div v-else class="space-y-6">

      <!-- ── Team Header ────────────────────────────────────────────────── -->
      <div class="bg-surface rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">

        <!-- Banner -->
        <div class="h-28 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
          <img
            v-if="team.picture"
            :src="team.picture"
            :alt="team.name"
            class="h-20 w-20 rounded-full object-cover border-4 border-surface shadow"
          />
          <span v-else class="text-6xl">🏀</span>
        </div>

        <div class="p-6">
          <h1 class="text-2xl font-bold">{{ team.name }}</h1>

          <!-- Badges: city, age group -->
          <div class="flex flex-wrap gap-2 mt-2">
            <span v-if="team.city" class="text-sm bg-secondary/10 text-secondary px-3 py-1 rounded-full">
              📍 {{ team.city }}
            </span>
            <span v-if="team.age_group" class="text-sm bg-accent/10 text-accent font-medium px-3 py-1 rounded-full">
              {{ team.age_group }}
            </span>
          </div>

          <!-- Bio / description -->
          <p v-if="team.bio" class="text-secondary text-sm mt-4 leading-relaxed">
            {{ team.bio }}
          </p>
        </div>
      </div>

      <!-- ── Players List ───────────────────────────────────────────────── -->
      <div class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6">
        <h2 class="text-lg font-bold mb-4">Spēlētāji ({{ members.length }})</h2>

        <!-- Empty state -->
        <p v-if="members.length === 0" class="text-secondary text-sm">
          Šajā komandā vēl nav spēlētāju.
        </p>

        <!-- Player rows -->
        <div v-else class="divide-y divide-secondary/10">
          <div
            v-for="member in members"
            :key="member.team_member_id"
            class="flex items-center gap-4 py-3"
          >
            <!-- Player photo -->
            <img
              v-if="member.profile?.picture"
              :src="member.profile.picture"
              :alt="member.profile.name"
              class="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div v-else class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
              🙋
            </div>

            <!-- Name and role -->
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ member.profile?.name }} {{ member.profile?.surname }}
                <span v-if="member.profile?.nickname" class="text-secondary font-normal text-sm">
                  „{{ member.profile.nickname }}"
                </span>
              </p>
              <!-- Show Kapteinis badge if role is captain -->
              <span
                v-if="member.role === 'captain'"
                class="text-xs bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full"
              >
                Kapteinis
              </span>
            </div>

            <!-- Jersey number -->
            <span v-if="member.profile?.number !== null && member.profile?.number !== undefined" class="text-secondary text-sm font-mono">
              #{{ member.profile.number }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Game History ───────────────────────────────────────────────── -->
      <div class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6">
        <h2 class="text-lg font-bold mb-4">Spēļu vēsture</h2>

        <!-- Empty state -->
        <p v-if="games.length === 0" class="text-secondary text-sm">
          Šī komanda vēl nav spēlējusi nevienu spēli.
        </p>

        <!-- Game rows -->
        <div v-else class="divide-y divide-secondary/10">
          <div
            v-for="game in games"
            :key="game.game_id"
            class="py-3 flex items-center gap-3"
          >
            <!-- Win/Loss indicator -->
            <span
              class="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
              :class="game.winner === team.team_id
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            >
              {{ game.winner === team.team_id ? 'U' : 'Z' }}
            </span>

            <!-- Opponent and score -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">
                pret {{ game.opponentName }}
              </p>
              <p class="text-xs text-secondary">
                {{ formatDate(game.timestamp) }}
              </p>
            </div>

            <!-- Score -->
            <span class="font-mono font-bold text-sm flex-shrink-0">
              {{ game.score_01 }} : {{ game.score_02 }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const supabase = useSupabase()

// Get the team ID from the URL (the [id] part of the route)
const route = useRoute()
const teamId = route.params.id

// ─── State ────────────────────────────────────────────────────────────────
const loading = ref(true)
const team = ref(null)
const members = ref([])   // list of team_members with joined profile data
const games = ref([])     // list of completed games involving this team

// ─── Data Fetching ────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchTeam(), fetchMembers(), fetchGames()])
  loading.value = false
})

// fetchTeam: loads the team row from the database
async function fetchTeam() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (!error) team.value = data
}

// fetchMembers: loads all members of this team, including their profile data
async function fetchMembers() {
  // Join team_members with profiles to get player details in one query
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      team_member_id,
      role,
      joined_at,
      profile:profiles (
        profile_id,
        name,
        surname,
        nickname,
        number,
        picture
      )
    `)
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (!error) members.value = data || []
}

// fetchGames: loads all completed games where this team participated
async function fetchGames() {
  // Fetch games where this team is either team_01 or team_02
  const { data, error } = await supabase
    .from('games')
    .select(`
      game_id,
      score_01,
      score_02,
      winner,
      timestamp,
      team_01,
      team_02,
      t1:teams!games_team_01_fkey (name),
      t2:teams!games_team_02_fkey (name)
    `)
    .or(`team_01.eq.${teamId},team_02.eq.${teamId}`)
    .order('timestamp', { ascending: false })

  if (!error && data) {
    // For each game, determine the opponent's name
    games.value = data.map(game => ({
      ...game,
      opponentName: game.team_01 === teamId ? game.t2?.name : game.t1?.name,
    }))
  }
}

// formatDate: converts an ISO timestamp to a human-readable Latvian date
function formatDate(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('lv-LV', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// Set the page title dynamically using the team name
useHead({
  title: computed(() => team.value ? `${team.value.name} · Basketbols` : 'Komanda · Basketbols'),
})
</script>
