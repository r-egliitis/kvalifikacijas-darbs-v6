<template>
  <!--
    pages/courts/index.vue
    The courts catalog — lists all basketball courts.
    Public page (no login required).
    Admin users see an "Add Court" button.
  -->
  <div class="max-w-5xl mx-auto px-4 py-10">

    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold">Laukumi</h1>
        <p class="text-secondary text-sm mt-1">{{ courts.length }} laukumi katalogā</p>
      </div>

      <!-- Add court button — only visible to admins -->
      <NuxtLink
        v-if="authStore.isAdmin"
        to="/courts/add"
        class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition"
      >
        + Pievienot laukumu
      </NuxtLink>
    </div>

    <!-- Filter: indoor / outdoor -->
    <div class="flex flex-wrap gap-3 mb-6">
      <button
        @click="filterType = ''"
        :class="filterType === '' ? 'bg-primary text-white' : 'border border-secondary/30 text-secondary hover:bg-secondary/10'"
        class="text-sm font-medium px-4 py-1.5 rounded-full transition"
      >
        Visi
      </button>
      <button
        @click="filterType = 'outdoor'"
        :class="filterType === 'outdoor' ? 'bg-primary text-white' : 'border border-secondary/30 text-secondary hover:bg-secondary/10'"
        class="text-sm font-medium px-4 py-1.5 rounded-full transition"
      >
        ☀️ Ārtelpas
      </button>
      <button
        @click="filterType = 'indoor'"
        :class="filterType === 'indoor' ? 'bg-primary text-white' : 'border border-secondary/30 text-secondary hover:bg-secondary/10'"
        class="text-sm font-medium px-4 py-1.5 rounded-full transition"
      >
        🏢 Iekštelpas
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <div class="text-4xl mb-3">⏳</div>
      <p>Ielādē laukumus...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredCourts.length === 0" class="text-center py-16 text-secondary">
      <div class="text-5xl mb-4">🏟️</div>
      <p class="font-medium">Laukumi nav atrasti</p>
      <p v-if="authStore.isAdmin" class="text-sm mt-1">
        <NuxtLink to="/courts/add" class="text-primary hover:underline">Pievienot pirmo laukumu</NuxtLink>
      </p>
    </div>

    <!-- Courts grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <CourtCard
        v-for="court in filteredCourts"
        :key="court.court_id"
        :court="court"
      />
    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const supabase = useSupabase()

const authStore = useAuthStore()

const courts = ref([])
const loading = ref(true)
const filterType = ref('') // '' | 'outdoor' | 'indoor'

// filteredCourts: apply the active type filter
const filteredCourts = computed(() => {
  if (filterType.value === 'outdoor') return courts.value.filter(c => c.outdoor)
  if (filterType.value === 'indoor')  return courts.value.filter(c => !c.outdoor)
  return courts.value
})

onMounted(async () => {
  loading.value = true

  // Load all courts ordered by name
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true })

  if (!error) courts.value = data || []

  loading.value = false
})
</script>
