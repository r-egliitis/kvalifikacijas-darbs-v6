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

        <!-- ── Notification bell ───────────────────────────────────────── -->
        <div v-if="authStore.isLoggedIn" class="relative">

          <!-- Transparent backdrop: clicking outside closes the dropdown -->
          <div
            v-if="showNotifications"
            class="fixed inset-0 z-40"
            @click="showNotifications = false"
          />

          <!-- Bell button with unread badge -->
          <button
            @click="showNotifications = !showNotifications"
            class="relative p-2.5 rounded-xl hover:bg-secondary/10 transition"
            title="Uzaicinājumi"
          >
            🔔
            <span
              v-if="pendingInvites.length > 0"
              class="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1"
            >
              {{ pendingInvites.length }}
            </span>
          </button>

          <!-- Notifications dropdown (z-50 to sit above the backdrop) -->
          <div
            v-if="showNotifications"
            class="absolute right-0 top-full mt-2 w-80 bg-surface border border-secondary/10 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div class="px-4 py-3 border-b border-secondary/10">
              <h3 class="font-semibold text-sm">Komandas uzaicinājumi</h3>
            </div>

            <!-- Empty state -->
            <div v-if="pendingInvites.length === 0" class="p-6 text-secondary text-sm text-center">
              Nav jaunu uzaicinājumu
            </div>

            <!-- Invite list -->
            <div v-else class="divide-y divide-secondary/10 max-h-72 overflow-y-auto">
              <div
                v-for="invite in pendingInvites"
                :key="invite.invitation_id"
                class="p-4"
              >
                <!-- Team name (opens mini info popup) + age group badge -->
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <button
                    @click="openTeamInfo(invite.team_id)"
                    class="font-semibold text-primary hover:underline text-sm text-left"
                  >
                    {{ invite.team?.name || '—' }}
                  </button>
                  <span
                    v-if="invite.team?.age_group"
                    class="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full"
                  >
                    {{ invite.team.age_group }}
                  </span>
                </div>

                <!-- Per-invite error message -->
                <p
                  v-if="inviteErrors[invite.invitation_id]"
                  class="text-red-500 text-xs mb-2"
                >
                  {{ inviteErrors[invite.invitation_id] }}
                </p>

                <!-- Accept / Decline buttons -->
                <div class="flex gap-2">
                  <button
                    @click="acceptInvite(invite)"
                    class="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 rounded-lg transition"
                  >
                    ✅ Pieņemt
                  </button>
                  <button
                    @click="declineInvite(invite)"
                    class="flex-1 text-xs bg-secondary/10 hover:bg-secondary/20 font-semibold py-1.5 rounded-lg transition"
                  >
                    ✗ Noraidīt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ── End notification bell ──────────────────────────────────── -->

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
        <div class="text-4xl mb-3">⏳</div>
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

      <!-- Banner for logged-in users without a team -->
      <div
        v-if="authStore.isLoggedIn && !authStore.profile?.current_team"
        class="bg-accent/5 border border-accent/20 rounded-xl px-4 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <p class="text-sm text-secondary">Jūs nepiederiet nevienai komandai.</p>
        <NuxtLink to="/teams/create" class="text-sm font-semibold text-primary hover:underline flex-shrink-0">
          Izveidot komandu →
        </NuxtLink>
      </div>

      <!-- Team count -->
      <p class="text-secondary text-sm mb-4">{{ filteredTeams.length }} komandas</p>

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
        <div class="text-4xl mb-3">⏳</div>
        <p>Ielādē komandas...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredTeams.length === 0" class="text-center py-16 text-secondary">
        <div class="text-5xl mb-4">🏀</div>
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
              class="p-1.5 bg-surface border border-secondary/20 rounded-lg shadow text-sm hover:bg-primary/10 hover:text-primary transition"
              title="Rediģēt"
            >✏️</button>
            <button
              @click.prevent="openAdminTeamDelete(item.team)"
              class="p-1.5 bg-surface border border-secondary/20 rounded-lg shadow text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
              title="Dzēst"
            >🗑️</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Mini team info popup ────────────────────────────────────────────── -->
    <div
      v-if="teamInfoPopup.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="teamInfoPopup.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <!-- Close button -->
        <button
          @click="teamInfoPopup.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text transition text-xl leading-none"
        >
          ✕
        </button>

        <div v-if="teamInfoPopup.loading" class="text-center py-8 text-secondary">
          Ielādē...
        </div>

        <div v-else-if="teamInfoPopup.team">
          <!-- Logo + name row -->
          <div class="flex items-center gap-4 mb-4">
            <img
              v-if="teamInfoPopup.team.picture"
              :src="teamInfoPopup.team.picture"
              class="w-14 h-14 rounded-full object-cover border-2 border-secondary/10"
            />
            <span v-else class="text-4xl">🏀</span>

            <div>
              <h2 class="font-bold text-lg">{{ teamInfoPopup.team.name }}</h2>
              <div class="flex gap-2 mt-1 flex-wrap">
                <span
                  v-if="teamInfoPopup.team.city"
                  class="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full"
                >
                  📍 {{ teamInfoPopup.team.city }}
                </span>
                <span
                  v-if="teamInfoPopup.team.age_group"
                  class="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full"
                >
                  {{ teamInfoPopup.team.age_group }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="teamInfoPopup.team.bio" class="text-secondary text-sm mb-3 leading-relaxed">
            {{ teamInfoPopup.team.bio }}
          </p>

          <p class="text-xs text-secondary">{{ teamInfoPopup.playerCount }} spēlētāji</p>
        </div>
      </div>
    </div>

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
              <div v-else class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center text-2xl flex-shrink-0">🏀</div>
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

const availableCities = computed(() =>
  [...new Set(teamsWithCounts.value.map(i => i.team.city).filter(Boolean))].sort()
)

const availableAgeGroups = computed(() =>
  [...new Set(teamsWithCounts.value.map(i => i.team.age_group).filter(Boolean))].sort()
)

const filteredTeams = computed(() =>
  teamsWithCounts.value.filter(item => {
    const matchCity = !filterCity.value || item.team.city === filterCity.value
    const matchAge  = !filterAgeGroup.value || item.team.age_group === filterAgeGroup.value
    return matchCity && matchAge
  })
)

function clearFilters() {
  filterCity.value = ''
  filterAgeGroup.value = ''
}

// ─── Notifications ────────────────────────────────────────────────────────

const showNotifications = ref(false)
const pendingInvites    = ref([])

// inviteErrors: per-invite error messages, keyed by invitation_id
const inviteErrors = reactive({})

// fetchInvites: loads all pending team invitations addressed to the current user
async function fetchInvites() {
  if (!authStore.isLoggedIn) return

  const { data } = await supabase
    .from('team_invitations')
    .select(`
      invitation_id,
      team_id,
      status,
      team:teams ( name, age_group, city, bio, picture )
    `)
    .eq('invitee_profile_id', authStore.user.id)
    .eq('status', 'pending')

  pendingInvites.value = data || []
}

// acceptInvite: joins the team if the user doesn't already belong to one
async function acceptInvite(invite) {
  delete inviteErrors[invite.invitation_id]

  // Block if already in a team
  if (authStore.profile?.current_team) {
    inviteErrors[invite.invitation_id] = 'Vispirms atstājiet esošo komandu.'
    return
  }

  // Insert membership row
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({ team_id: invite.team_id, profile_id: authStore.user.id, role: 'player' })

  if (memberError) {
    inviteErrors[invite.invitation_id] = 'Neizdevās pievienoties komandai.'
    return
  }

  // Update the user's current_team in their profile
  await supabase
    .from('profiles')
    .update({ current_team: invite.team_id })
    .eq('profile_id', authStore.user.id)

  // Mark the invite as accepted
  await supabase
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('invitation_id', invite.invitation_id)

  // Refresh store and invite list
  await authStore.fetchProfile()
  await fetchInvites()

  // Switch to "My team" tab after joining
  activeTab.value = 'my'
  showNotifications.value = false
}

// declineInvite: marks the invite as declined
async function declineInvite(invite) {
  await supabase
    .from('team_invitations')
    .update({ status: 'declined' })
    .eq('invitation_id', invite.invitation_id)

  await fetchInvites()
}

// ─── Mini team info popup ─────────────────────────────────────────────────

const teamInfoPopup = reactive({
  show: false,
  loading: false,
  team: null,
  playerCount: 0,
})

// openTeamInfo: loads team details and opens the info popup
async function openTeamInfo(teamId) {
  teamInfoPopup.show      = true
  teamInfoPopup.loading   = true
  teamInfoPopup.team      = null
  teamInfoPopup.playerCount = 0

  const [{ data: teamData }, { count }] = await Promise.all([
    supabase.from('teams').select('*').eq('team_id', teamId).single(),
    supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
  ])

  teamInfoPopup.team       = teamData
  teamInfoPopup.playerCount = count || 0
  teamInfoPopup.loading    = false
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

  // Load pending invites for logged-in users
  if (authStore.isLoggedIn) {
    await fetchInvites()
  }
})
</script>
