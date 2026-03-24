<template>
  <!--
    pages/teams/index.vue
    The teams catalog — lists all teams with filters for city and age group.
    This page is public (no login required).
  -->
  <div class="max-w-6xl mx-auto px-4 py-10">

    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold">Komandas</h1>
        <p class="text-secondary text-sm mt-1">{{ filteredTeams.length }} komandas</p>
      </div>

      <!-- Create team button (only for logged-in users) -->
      <NuxtLink
        v-if="authStore.isLoggedIn"
        to="/teams/create"
        class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition"
      >
        + Izveidot komandu
      </NuxtLink>
    </div>

    <!-- ── Filters ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row gap-3 mb-8">

      <!-- City filter -->
      <select
        v-model="filterCity"
        class="px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      >
        <option value="">Visas pilsētas</option>
        <option v-for="city in availableCities" :key="city" :value="city">
          {{ city }}
        </option>
      </select>

      <!-- Age group filter -->
      <select
        v-model="filterAgeGroup"
        class="px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      >
        <option value="">Visas vecuma grupas</option>
        <option v-for="ag in availableAgeGroups" :key="ag" :value="ag">
          {{ ag }}
        </option>
      </select>

      <!-- Clear filters button -->
      <button
        v-if="filterCity || filterAgeGroup"
        @click="clearFilters"
        class="px-4 py-2 text-sm text-secondary border border-secondary/30 rounded-lg hover:bg-secondary/10 transition"
      >
        Notīrīt filtrus
      </button>
    </div>

    <!-- ── Loading state ──────────────────────────────────────────────── -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <div class="text-4xl mb-3">⏳</div>
      <p>Ielādē komandas...</p>
    </div>

    <!-- ── Empty state ────────────────────────────────────────────────── -->
    <div v-else-if="filteredTeams.length === 0" class="text-center py-16 text-secondary">
      <div class="text-5xl mb-4">🏀</div>
      <p class="font-medium">Komandas nav atrastas</p>
      <p class="text-sm mt-1">Mēģiniet mainīt filtrus vai izveidojiet pirmo komandu!</p>
    </div>

    <!-- ── Teams grid ─────────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <TeamCard
        v-for="item in filteredTeams"
        :key="item.team.team_id"
        :team="item.team"
        :player-count="item.playerCount"
      />
    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { supabase } from '~/utils/supabase'

const authStore = useAuthStore()

// ─── Data ────────────────────────────────────────────────────────────────

// All teams with their player counts
const teamsWithCounts = ref([])
const loading = ref(true)

// ─── Filters ─────────────────────────────────────────────────────────────

const filterCity = ref('')
const filterAgeGroup = ref('')

// availableCities: unique list of cities extracted from the loaded teams
const availableCities = computed(() => {
  const cities = teamsWithCounts.value
    .map(item => item.team.city)
    .filter(Boolean)
  return [...new Set(cities)].sort()
})

// availableAgeGroups: unique list of age groups
const availableAgeGroups = computed(() => {
  const groups = teamsWithCounts.value
    .map(item => item.team.age_group)
    .filter(Boolean)
  return [...new Set(groups)].sort()
})

// filteredTeams: applies the active filters to the full list
const filteredTeams = computed(() => {
  return teamsWithCounts.value.filter(item => {
    const matchCity = !filterCity.value || item.team.city === filterCity.value
    const matchAge  = !filterAgeGroup.value || item.team.age_group === filterAgeGroup.value
    return matchCity && matchAge
  })
})

// clearFilters: resets both filter dropdowns
function clearFilters() {
  filterCity.value = ''
  filterAgeGroup.value = ''
}

// ─── Data Fetching ────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true

  // Fetch all teams from the database, ordered by creation date (newest first)
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load teams:', error)
    loading.value = false
    return
  }

  // For each team, count how many members it has
  // We query team_members and count rows matching each team_id
  const withCounts = await Promise.all(
    (teams || []).map(async (team) => {
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.team_id)

      return { team, playerCount: count || 0 }
    })
  )

  teamsWithCounts.value = withCounts
  loading.value = false
})
</script>
