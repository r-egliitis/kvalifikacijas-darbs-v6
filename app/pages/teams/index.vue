<template>
  <!--
    pages/teams/index.vue
    Teams catalog page.
    - Logged-in team members see two tabs: "Mana komanda" and "Visas komandas".
    - Logged-in users without a team see only the catalog with a "create team" prompt.
    - A notification bell (visible to all logged-in users) shows pending team invites.
    - Each invite can be accepted or declined; team name is clickable for a quick info popup.
  -->
  <div class="max-w-6xl mx-auto px-4 py-10">

    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold">Komandas</h1>

      <div class="flex items-center gap-3">

        <!-- Create team button (only for logged-in users not yet in a team) -->
        <NuxtLink
          v-if="authStore.isLoggedIn && !authStore.profile?.current_team"
          to="/teams/create"
          class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition"
        >
          + Izveidot komandu
        </NuxtLink>
      </div>
    </div>

    <!-- ── Tabs (logged-in users who belong to a team) ─────────────────── -->
    <div
      v-if="authStore.isLoggedIn && authStore.profile?.current_team"
      class="flex gap-1 mb-8 bg-secondary/10 p-1 rounded-xl w-fit"
    >
      <button
        @click="activeTab = 'my'"
        :class="[
          'px-5 py-2 rounded-lg text-sm font-semibold transition',
          activeTab === 'my'
            ? 'bg-surface shadow text-primary'
            : 'text-secondary hover:text-app-text',
        ]"
      >
        Mana komanda
      </button>
      <button
        @click="activeTab = 'all'"
        :class="[
          'px-5 py-2 rounded-lg text-sm font-semibold transition',
          activeTab === 'all'
            ? 'bg-surface shadow text-primary'
            : 'text-secondary hover:text-app-text',
        ]"
      >
        Visas komandas
      </button>
    </div>

    <!-- ── My Team tab ────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'my' && authStore.isLoggedIn && authStore.profile?.current_team">
      <div v-if="loading" class="text-center py-16 text-secondary">
        <Icon name="ph:hourglass" class="w-12 h-12 mx-auto mb-3" />
        <p>Ielādē komandu...</p>
      </div>
      <TeamCard
        v-else-if="myTeam"
        :team="myTeam.team"
        :player-count="myTeam.playerCount"
      />
    </template>

    <!-- ── All Teams tab / non-member view ───────────────────────────────── -->
    <template v-if="activeTab === 'all' || !authStore.isLoggedIn || !authStore.profile?.current_team">

      <!-- Team count -->
      <p class="text-secondary text-sm mb-4">{{ filteredTeams.length }} komandas</p>

      <!-- Search box -->
      <div class="relative mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Meklēt komandu pēc nosaukuma..."
          class="w-full px-4 py-2.5 pr-10 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-secondary transition"
          aria-label="Notīrīt meklēšanu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 mb-8">
        <select
          v-model="filterCity"
          class="px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        >
          <option value="">Visas pilsētas</option>
          <option v-for="city in availableCities" :key="city" :value="city">{{ city }}</option>
        </select>

        <select
          v-model="filterAgeGroup"
          class="px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        >
          <option value="">Visas vecuma grupas</option>
          <option v-for="ag in availableAgeGroups" :key="ag" :value="ag">{{ ag }}</option>
        </select>

        <button
          v-if="filterCity || filterAgeGroup"
          @click="clearFilters"
          class="px-4 py-2 text-sm text-secondary border border-secondary/30 rounded-lg hover:bg-secondary/10 transition"
        >
          Notīrīt filtrus
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16 text-secondary">
        <Icon name="ph:hourglass" class="w-12 h-12 mx-auto mb-3" />
        <p>Ielādē komandas...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredTeams.length === 0" class="text-center py-16 text-secondary">
        <Icon name="ph:basketball" class="w-16 h-16 mx-auto mb-4" />
        <p class="font-medium">Komandas nav atrastas</p>
        <p class="text-sm mt-1">Mēģiniet mainīt filtrus vai izveidojiet pirmo komandu!</p>
      </div>

      <!-- Teams grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="item in filteredTeams"
          :key="item.team.team_id"
          class="relative group"
        >
          <TeamCard :team="item.team" :player-count="item.playerCount" />
          <!-- Admin overlay buttons -->
          <div
            v-if="authStore.isAdmin"
            class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <button
              @click.prevent="openAdminTeamEdit(item.team)"
              class="p-1.5 bg-surface border border-secondary/20 rounded-lg shadow hover:bg-primary/10 hover:text-primary transition"
              title="Rediģēt"
            ><Icon name="ph:pencil" class="w-4 h-4" /></button>
            <button
              @click.prevent="openAdminTeamDelete(item.team)"
              class="p-1.5 bg-surface border border-secondary/20 rounded-lg shadow hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
              title="Dzēst"
            ><Icon name="ph:trash" class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Admin: Edit Team modal ─────────────────────────────────────────── -->
    <div
      v-if="adminTeamEdit.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="adminTeamEdit.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button @click="adminTeamEdit.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>
        <h3 class="font-bold text-lg mb-5">Rediģēt komandu</h3>
        <p v-if="adminTeamEdit.error" class="text-red-500 text-sm mb-4">{{ adminTeamEdit.error }}</p>
        <div class="space-y-4">
          <!-- Logo -->
          <div>
            <label class="block text-sm font-medium mb-2">Logo</label>
            <div class="flex items-center gap-4">
              <img v-if="adminTeamEdit.previewUrl || adminTeamEdit.currentPicture"
                :src="adminTeamEdit.previewUrl || adminTeamEdit.currentPicture"
                class="w-16 h-16 rounded-xl object-cover border border-secondary/20 flex-shrink-0" />
              <div v-else class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0"><Icon name="ph:basketball" class="w-8 h-8 text-primary/40" /></div>
              <div class="flex flex-col gap-1.5">
                <label class="cursor-pointer text-sm text-primary font-medium hover:underline">
                  Mainīt attēlu
                  <input type="file" accept="image/*" class="hidden" @change="handleAdminTeamLogoSelect" />
                </label>
                <button v-if="adminTeamEdit.currentPicture || adminTeamEdit.newFile"
                  @click="adminTeamEdit.newFile = null; adminTeamEdit.previewUrl = null; adminTeamEdit.currentPicture = null; adminTeamEdit.removePicture = true"
                  class="text-sm text-red-500 font-medium hover:underline text-left">Noņemt attēlu</button>
              </div>
            </div>
          </div>
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium mb-1">Nosaukums <span class="text-red-500">*</span></label>
            <input v-model="adminTeamEdit.name" type="text" maxlength="50"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <!-- City -->
          <div>
            <label class="block text-sm font-medium mb-1">Pilsēta</label>
            <input v-model="adminTeamEdit.city" type="text"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <!-- Age group -->
          <div>
            <label class="block text-sm font-medium mb-1">Vecuma grupa</label>
            <select v-model="adminTeamEdit.age_group"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition">
              <option value="">Izvēlies vecuma grupu</option>
              <option value="U14">U14</option><option value="U16">U16</option>
              <option value="U18">U18</option><option value="U20">U20</option>
              <option value="Seniori">Seniori</option><option value="Jaukta">Jaukta</option>
            </select>
          </div>
          <!-- Bio -->
          <div>
            <label class="block text-sm font-medium mb-1">Apraksts</label>
            <textarea v-model="adminTeamEdit.bio" rows="3"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="saveAdminTeamEdit" :disabled="adminTeamEdit.saving"
            class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition">
            <span v-if="adminTeamEdit.saving">Saglabā...</span><span v-else>Saglabāt</span>
          </button>
          <button @click="adminTeamEdit.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">Atcelt</button>
        </div>
      </div>
    </div>

    <!-- ── Admin: Delete Team confirm ────────────────────────────────────── -->
    <div
      v-if="adminTeamDelete.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="adminTeamDelete.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 relative">
        <button @click="adminTeamDelete.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>
        <p class="font-semibold mb-1">Dzēst komandu?</p>
        <p class="text-sm text-secondary mb-5">„{{ adminTeamDelete.team?.name }}" tiks neatgriezeniski dzēsta.</p>
        <p v-if="adminTeamDelete.error" class="text-red-500 text-sm mb-3">{{ adminTeamDelete.error }}</p>
        <div class="flex gap-3">
          <button @click="confirmAdminTeamDelete" :disabled="adminTeamDelete.loading"
            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition">
            <span v-if="adminTeamDelete.loading">Dzēš...</span><span v-else>Dzēst</span>
          </button>
          <button @click="adminTeamDelete.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">Atcelt</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const supabase   = useSupabase()
const authStore  = useAuthStore()

// ─── Tabs ─────────────────────────────────────────────────────────────────

// Default to 'my' tab when user is in a team; otherwise show 'all'
const activeTab = ref(authStore.profile?.current_team ? 'my' : 'all')

// ─── All Teams Data ───────────────────────────────────────────────────────

const teamsWithCounts = ref([])
const loading = ref(true)

// myTeam: the entry in teamsWithCounts that belongs to the current user
const myTeam = computed(() => {
  if (!authStore.profile?.current_team) return null
  return teamsWithCounts.value.find(
    item => item.team.team_id === authStore.profile.current_team
  ) || null
})

// ─── Filters ─────────────────────────────────────────────────────────────

const filterCity     = ref('')
const filterAgeGroup = ref('')
const searchQuery    = ref('')

const availableCities = computed(() =>
  [...new Set(teamsWithCounts.value.map(i => i.team.city).filter(Boolean))].sort()
)

const availableAgeGroups = computed(() =>
  [...new Set(teamsWithCounts.value.map(i => i.team.age_group).filter(Boolean))].sort()
)

function similarityScore(name, query) {
  const n = name?.toLowerCase() ?? ''
  const q = query.toLowerCase()
  if (n === q) return 3
  if (n.startsWith(q)) return 2
  if (n.includes(q)) return 1
  return 0
}

const filteredTeams = computed(() => {
  const base = teamsWithCounts.value.filter(item => {
    const matchCity = !filterCity.value || item.team.city === filterCity.value
    const matchAge  = !filterAgeGroup.value || item.team.age_group === filterAgeGroup.value
    return matchCity && matchAge
  })

  const q = searchQuery.value.trim()
  if (!q) return base

  return [...base].sort((a, b) => {
    const scoreA = similarityScore(a.team.name, q)
    const scoreB = similarityScore(b.team.name, q)
    return scoreB - scoreA
  })
})

function clearFilters() {
  filterCity.value = ''
  filterAgeGroup.value = ''
}

// ─── Admin: Team Edit / Delete ───────────────────────────────────────────

const ADMIN_NAME_RE = /^[a-zA-ZāčēģīķļņōŗšūžĀČĒĢĪĶĻŅŌŖŠŪŽ0-9 \-]+$/

const adminTeamEdit = reactive({
  show: false, saving: false, error: '',
  teamId: null,
  name: '', bio: '', city: '', age_group: '',
  currentPicture: null, removePicture: false, newFile: null, previewUrl: null,
})

const adminTeamDelete = reactive({
  show: false, loading: false, error: '',
  team: null,
})

function openAdminTeamEdit(team) {
  Object.assign(adminTeamEdit, {
    show: true, saving: false, error: '',
    teamId: team.team_id,
    name: team.name || '', bio: team.bio || '',
    city: team.city || '', age_group: team.age_group || '',
    currentPicture: team.picture || null,
    removePicture: false, newFile: null, previewUrl: null,
  })
}

function handleAdminTeamLogoSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  adminTeamEdit.newFile       = file
  adminTeamEdit.removePicture = false
  adminTeamEdit.previewUrl    = URL.createObjectURL(file)
}

async function saveAdminTeamEdit() {
  adminTeamEdit.error = ''
  const name = adminTeamEdit.name.trim()
  if (!name) { adminTeamEdit.error = 'Nosaukums ir obligāts.'; return }
  if (name.length < 3 || name.length > 50) { adminTeamEdit.error = 'Nosaukumam jābūt 3–50 simboliem.'; return }
  if (!ADMIN_NAME_RE.test(name)) { adminTeamEdit.error = 'Nosaukumā drīkst izmantot tikai burtus, ciparus, atstarpes un defises.'; return }

  // Uniqueness check
  const { data: existing } = await supabase.from('teams').select('team_id').ilike('name', name).neq('team_id', adminTeamEdit.teamId).maybeSingle()
  if (existing) { adminTeamEdit.error = 'Komanda ar šādu nosaukumu jau pastāv.'; return }

  adminTeamEdit.saving = true
  try {
    const payload = {
      name,
      bio:       adminTeamEdit.bio.trim()  || null,
      city:      adminTeamEdit.city.trim() || null,
      age_group: adminTeamEdit.age_group   || null,
    }
    if (adminTeamEdit.removePicture && !adminTeamEdit.newFile) {
      payload.picture = null
    } else if (adminTeamEdit.newFile) {
      const file = adminTeamEdit.newFile
      const fileName = `team-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw new Error('Neizdevās augšupielādēt logo.')
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      payload.picture = urlData.publicUrl
    }
    const { error } = await supabase.from('teams').update(payload).eq('team_id', adminTeamEdit.teamId)
    if (error) throw new Error('Neizdevās saglabāt izmaiņas.')
    // Update local array
    const idx = teamsWithCounts.value.findIndex(i => i.team.team_id === adminTeamEdit.teamId)
    if (idx !== -1) teamsWithCounts.value[idx].team = { ...teamsWithCounts.value[idx].team, ...payload }
    adminTeamEdit.show = false
  } catch (err) {
    adminTeamEdit.error = err.message || 'Kļūda.'
  } finally {
    adminTeamEdit.saving = false
  }
}

function openAdminTeamDelete(team) {
  Object.assign(adminTeamDelete, { show: true, loading: false, error: '', team })
}

async function confirmAdminTeamDelete() {
  adminTeamDelete.loading = true
  adminTeamDelete.error   = ''
  const id = adminTeamDelete.team.team_id
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/delete-team', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ teamId: id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message || 'Neizdevās dzēst komandu.')
    }
    teamsWithCounts.value = teamsWithCounts.value.filter(i => i.team.team_id !== id)
    adminTeamDelete.show = false
  } catch (err) {
    adminTeamDelete.error   = err.message || 'Neizdevās dzēst komandu.'
    adminTeamDelete.loading = false
  }
}

// ─── Data Fetching ────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // For each team, fetch the member count separately
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
