<template>
  <!--
    pages/teams/[id].vue
    Team profile page. Public view: team details, player list, game history.
    Team members see a 3-dot (⋮) menu next to each player row.
    Captains additionally see options to remove players and assign the captain role,
    plus a button to invite new players by their visual_id.
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

        <!-- Banner / logo area -->
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
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-2xl font-bold">{{ team.name }}</h1>
            <!-- Edit button — captain or admin -->
            <button
              v-if="isCaptain || authStore.isAdmin"
              @click="openEditModal"
              class="flex-shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              ✏️ Rediģēt
            </button>
          </div>

          <!-- City and age group badges -->
          <div class="flex flex-wrap gap-2 mt-2">
            <span v-if="team.city" class="text-sm bg-secondary/10 text-secondary px-3 py-1 rounded-full">
              📍 {{ team.city }}
            </span>
            <span v-if="team.age_group" class="text-sm bg-accent/10 text-accent font-medium px-3 py-1 rounded-full">
              {{ team.age_group }}
            </span>
          </div>

          <!-- Bio -->
          <p v-if="team.bio" class="text-secondary text-sm mt-4 leading-relaxed">
            {{ team.bio }}
          </p>
        </div>
      </div>

      <!-- ── Players List ───────────────────────────────────────────────── -->
      <div class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6">
        <h2 class="text-lg font-bold mb-4">Spēlētāji ({{ members.length }})</h2>

        <!-- Action error (shown when a captain action fails, e.g. due to missing DB policy) -->
        <p v-if="actionError" class="text-red-500 text-sm mb-3">{{ actionError }}</p>

        <p v-if="members.length === 0" class="text-secondary text-sm">
          Šajā komandā vēl nav spēlētāju.
        </p>

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

            <!-- Name, nickname, captain badge -->
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ member.profile?.name }} {{ member.profile?.surname }}
                <span v-if="member.profile?.nickname" class="text-secondary font-normal text-sm">
                  „{{ member.profile.nickname }}"
                </span>
              </p>
              <span
                v-if="member.role === 'captain'"
                class="text-xs bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full"
              >
                Kapteinis
              </span>
            </div>

            <!-- Jersey number -->
            <span
              v-if="member.profile?.number !== null && member.profile?.number !== undefined"
              class="text-secondary text-sm font-mono"
            >
              #{{ member.profile.number }}
            </span>

            <!-- ── 3-dot menu ─────────────────────────────────────────── -->
            <!--
              Visible to:
              - Captains: see ⋮ on every row (manage all players)
              - Non-captain members: see ⋮ only on their own row (to leave team)
            -->
            <div
              v-if="(isMember || authStore.isAdmin) && (isCaptain || authStore.isAdmin || member.profile?.profile_id === authStore.user?.id)"
              class="relative flex-shrink-0"
            >
              <button
                @click.stop="toggleMenu(member.team_member_id)"
                class="p-1.5 rounded-lg hover:bg-secondary/10 transition text-secondary text-xl leading-none"
                title="Darbības"
              >
                ⋮
              </button>

              <!-- Dropdown menu -->
              <div
                v-if="openMenuId === member.team_member_id"
                class="absolute right-0 top-full mt-1 w-52 bg-surface border border-secondary/10 rounded-xl shadow-lg z-20 overflow-hidden"
              >
                <!-- Captain/admin options for OTHER players' rows -->
                <template v-if="(isCaptain || authStore.isAdmin) && member.profile?.profile_id !== authStore.user?.id">
                  <button
                    @click="confirmAssignCaptain(member)"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/5 transition"
                  >
                    Iecelt par kapteiņi
                  </button>
                  <button
                    @click="confirmRemovePlayer(member)"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/5 text-red-500 transition"
                  >
                    Noņemt no komandas
                  </button>
                </template>

                <!-- "Leave team" — shown on the viewer's own row -->
                <button
                  v-if="member.profile?.profile_id === authStore.user?.id"
                  @click="handleLeaveTeam"
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/5 text-red-500 transition"
                >
                  Pamest komandu
                </button>
              </div>
            </div>
            <!-- ── End 3-dot menu ─────────────────────────────────────── -->

          </div>
        </div>

        <!-- Captain actions: add player + delete team (sole member only) -->
        <div v-if="isCaptain" class="mt-4 pt-4 border-t border-secondary/10 flex items-center justify-between gap-3">
          <button
            @click="addPlayerModal.show = true"
            class="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            + Pievienot spēlētāju
          </button>
          <button
            v-if="(isCaptain && members.length === 1) || authStore.isAdmin"
            @click="deleteModal.show = true; deleteModal.input = ''; deleteModal.errorMessage = ''"
            class="text-sm font-semibold text-red-500 hover:underline"
          >
            🗑️ Dzēst komandu
          </button>
        </div>
      </div>

      <!-- ── Game History ───────────────────────────────────────────────── -->
      <div class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6">
        <h2 class="text-lg font-bold mb-4">Spēļu vēsture</h2>

        <p v-if="games.length === 0" class="text-secondary text-sm">
          Šī komanda vēl nav spēlējusi nevienu spēli.
        </p>

        <div v-else class="divide-y divide-secondary/10">
          <div
            v-for="game in games"
            :key="game.game_id"
            class="py-3 flex items-center gap-3"
          >
            <!-- Win / Loss badge -->
            <span
              class="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
              :class="game.winner === team.team_id
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            >
              {{ game.winner === team.team_id ? 'U' : 'Z' }}
            </span>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">pret {{ game.opponentName }}</p>
              <p class="text-xs text-secondary">{{ formatDate(game.timestamp) }}</p>
            </div>

            <span class="font-mono font-bold text-sm flex-shrink-0">
              {{ game.score_01 }} : {{ game.score_02 }}
            </span>
          </div>
        </div>
      </div>

    </div>
    <!-- End team content -->

    <!-- Transparent full-screen backdrop — closes any open 3-dot menu when clicking elsewhere -->
    <div v-if="openMenuId" class="fixed inset-0 z-10" @click="openMenuId = null" />

    <!-- ── Confirmation / Info modal ──────────────────────────────────────── -->
    <div
      v-if="confirmModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="confirmModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 relative">
        <!-- Close (X) -->
        <button
          @click="confirmModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text transition text-xl leading-none"
        >
          ✕
        </button>

        <p class="text-sm font-medium mb-6 pr-6 leading-relaxed">{{ confirmModal.message }}</p>

        <!-- Info modal: just a close button (no destructive action) -->
        <div v-if="confirmModal.isInfo" class="flex justify-center">
          <button
            @click="confirmModal.show = false"
            class="px-8 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition"
          >
            Labi
          </button>
        </div>

        <!-- Confirmation modal: Jā / Nē -->
        <div v-else class="flex gap-3">
          <button
            @click="executeConfirm"
            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition"
          >
            Jā
          </button>
          <button
            @click="confirmModal.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
          >
            Nē
          </button>
        </div>
      </div>
    </div>

    <!-- ── Edit Team modal (captain only) ────────────────────────────────── -->
    <div
      v-if="editModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="editModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          @click="editModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text transition text-xl leading-none"
        >
          ✕
        </button>

        <h3 class="font-bold text-lg mb-5">Rediģēt komandu</h3>

        <!-- Error -->
        <p v-if="editModal.errorMessage" class="text-red-500 text-sm mb-4">{{ editModal.errorMessage }}</p>

        <div class="space-y-4">

          <!-- Logo -->
          <div>
            <label class="block text-sm font-medium mb-2">Logo</label>
            <div class="flex items-center gap-4">
              <img
                v-if="editModal.previewUrl || editModal.currentPicture"
                :src="editModal.previewUrl || editModal.currentPicture"
                class="w-16 h-16 rounded-xl object-cover border border-secondary/20 flex-shrink-0"
              />
              <div v-else class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center text-2xl flex-shrink-0">
                🏀
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="cursor-pointer text-sm text-primary font-medium hover:underline">
                  Mainīt attēlu
                  <input type="file" accept="image/*" class="hidden" @change="handleEditLogoSelect" />
                </label>
                <button
                  v-if="editModal.currentPicture || editModal.newFile"
                  @click="removeEditLogo"
                  class="text-sm text-red-500 font-medium hover:underline text-left"
                >
                  Noņemt attēlu
                </button>
              </div>
            </div>
          </div>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium mb-1">
              Komandas nosaukums <span class="text-red-500">*</span>
            </label>
            <input
              v-model="editModal.name"
              type="text"
              maxlength="50"
              placeholder="Rīgas Lāči"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            <p class="text-xs text-secondary mt-1">{{ editModal.name.length }}/50</p>
          </div>

          <!-- City -->
          <div>
            <label class="block text-sm font-medium mb-1">Pilsēta</label>
            <input
              v-model="editModal.city"
              type="text"
              placeholder="Rīga"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <!-- Age group -->
          <div>
            <label class="block text-sm font-medium mb-1">Vecuma grupa</label>
            <select
              v-model="editModal.age_group"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            >
              <option value="">Izvēlies vecuma grupu</option>
              <option value="U14">U14</option>
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="U20">U20</option>
              <option value="Seniori">Seniori</option>
              <option value="Jaukta">Jaukta</option>
            </select>
          </div>

          <!-- Bio -->
          <div>
            <label class="block text-sm font-medium mb-1">Apraksts</label>
            <textarea
              v-model="editModal.bio"
              rows="3"
              placeholder="Pastāsti par savu komandu..."
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-6">
          <button
            @click="saveTeamEdit"
            :disabled="editModal.saving"
            class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
          >
            <span v-if="editModal.saving">Saglabā...</span>
            <span v-else>Saglabāt</span>
          </button>
          <button
            @click="editModal.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
          >
            Atcelt
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete Team modal (sole captain only) ───────────────────────────── -->
    <div
      v-if="deleteModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="deleteModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 relative">
        <button
          @click="deleteModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text transition text-xl leading-none"
        >
          ✕
        </button>

        <h3 class="font-bold text-lg mb-2">Dzēst komandu</h3>
        <p class="text-sm text-secondary mb-4 leading-relaxed">
          Šī darbība ir neatgriezeniska. Lai apstiprinātu, ieraksti komandas nosaukumu:
        </p>

        <p v-if="deleteModal.errorMessage" class="text-red-500 text-sm mb-3">{{ deleteModal.errorMessage }}</p>

        <input
          v-model="deleteModal.input"
          type="text"
          :placeholder="team.name"
          class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 transition mb-4"
        />

        <button
          @click="confirmDeleteTeam"
          :disabled="deleteModal.input.trim() !== team.name || deleteModal.deleting"
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <span v-if="deleteModal.deleting">Dzēš...</span>
          <span v-else>Dzēst komandu</span>
        </button>
      </div>
    </div>

    <!-- ── Add Player modal (captain only) ───────────────────────────────── -->
    <div
      v-if="addPlayerModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="closeAddPlayerModal"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <!-- Close -->
        <button
          @click="closeAddPlayerModal"
          class="absolute top-4 right-4 text-secondary hover:text-app-text transition text-xl leading-none"
        >
          ✕
        </button>

        <h3 class="font-bold text-lg mb-4">Pievienot spēlētāju</h3>

        <!-- Visual ID search input -->
        <div class="flex gap-2 mb-4">
          <input
            v-model="addPlayerModal.visualId"
            type="text"
            placeholder="Vizuālais ID (piem. PV00001)"
            class="flex-1 px-3 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            @keyup.enter="searchPlayer"
          />
          <button
            @click="searchPlayer"
            :disabled="addPlayerModal.searching || !addPlayerModal.visualId.trim()"
            class="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            Meklēt
          </button>
        </div>

        <!-- Not found -->
        <p v-if="addPlayerModal.notFound" class="text-secondary text-sm mb-4">
          Spēlētājs ar šādu ID nav atrasts.
        </p>

        <!-- Found player card -->
        <div
          v-if="addPlayerModal.foundPlayer"
          class="bg-secondary/5 rounded-xl p-3 flex items-center gap-3 mb-4"
        >
          <img
            v-if="addPlayerModal.foundPlayer.picture"
            :src="addPlayerModal.foundPlayer.picture"
            class="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div v-else class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
            🙋
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">
              {{ addPlayerModal.foundPlayer.name }} {{ addPlayerModal.foundPlayer.surname }}
            </p>
            <p v-if="addPlayerModal.foundPlayer.nickname" class="text-xs text-secondary truncate">
              „{{ addPlayerModal.foundPlayer.nickname }}"
            </p>
          </div>

          <button
            @click="invitePlayer(addPlayerModal.foundPlayer)"
            :disabled="addPlayerModal.inviting || addPlayerModal.alreadyInvited"
            class="px-3 py-1.5 text-xs bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex-shrink-0"
          >
            {{ addPlayerModal.alreadyInvited ? 'Uzaicināts ✓' : 'Uzaicināt' }}
          </button>
        </div>

        <!-- Success / error messages -->
        <p v-if="addPlayerModal.successMessage" class="text-sm text-green-600 dark:text-green-400">
          {{ addPlayerModal.successMessage }}
        </p>
        <p v-if="addPlayerModal.errorMessage" class="text-sm text-red-500">
          {{ addPlayerModal.errorMessage }}
        </p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const supabase  = useSupabase()
const authStore = useAuthStore()
const router    = useRouter()

// teamId comes from the URL: /teams/[id]
const route  = useRoute()
const teamId = route.params.id

// ─── State ────────────────────────────────────────────────────────────────

const loading     = ref(true)
const team        = ref(null)
const members     = ref([])   // team_members rows with joined profile data
const games       = ref([])   // completed games involving this team
const actionError = ref('')   // shown when a team management action fails

// ─── Member role detection ─────────────────────────────────────────────────

// myMembership: the team_member row for the logged-in viewer (null if not a member)
const myMembership = computed(() =>
  members.value.find(m => m.profile?.profile_id === authStore.user?.id) || null
)

// isMember: viewer is a member of this team
const isMember = computed(() => !!myMembership.value)

// isCaptain: viewer is the captain of this team
const isCaptain = computed(() => myMembership.value?.role === 'captain')

// ─── 3-dot menus ─────────────────────────────────────────────────────────

// openMenuId: which player row's menu is currently open (null = all closed)
const openMenuId = ref(null)

function toggleMenu(teamMemberId) {
  openMenuId.value = openMenuId.value === teamMemberId ? null : teamMemberId
}

// ─── Confirmation / Info modal ────────────────────────────────────────────

const confirmModal = reactive({
  show:      false,
  message:   '',
  onConfirm: null,
  isInfo:    false,  // when true: shows a single "Labi" button instead of Jā/Nē
})

function openConfirm(message, onConfirm, isInfo = false) {
  confirmModal.message   = message
  confirmModal.onConfirm = onConfirm
  confirmModal.isInfo    = isInfo
  confirmModal.show      = true
  openMenuId.value       = null  // close any open 3-dot menu
}

async function executeConfirm() {
  if (confirmModal.onConfirm) await confirmModal.onConfirm()
  confirmModal.show = false
}

// ─── Team actions ─────────────────────────────────────────────────────────

// handleLeaveTeam: decides which leave path to take based on role and member count
function handleLeaveTeam() {
  openMenuId.value = null

  // Captain still has the captain role and is NOT the only member — must transfer first
  if (isCaptain.value && members.value.length > 1) {
    openConfirm(
      'Lai atstātu komandu, vispirms ieceli jaunu kapteiņi.',
      null,
      true  // isInfo — shows just "Labi" button
    )
    return
  }

  if (members.value.length === 1) {
    // Sole member: leaving deletes the entire team — use type-name confirmation
    deleteModal.show         = true
    deleteModal.input        = ''
    deleteModal.errorMessage = ''
  } else {
    // Regular leave (non-captain player)
    openConfirm('Vai tiešām vēlaties atstāt komandu?', leaveTeam)
  }
}

// leaveTeam: removes self from team_members and clears current_team on profile
async function leaveTeam() {
  const membership = myMembership.value
  if (!membership) return

  await supabase.from('team_members').delete().eq('team_member_id', membership.team_member_id)
  await supabase.from('profiles').update({ current_team: null }).eq('profile_id', authStore.user.id)
  await authStore.fetchProfile()
  router.push('/teams')
}

// leaveAndDeleteTeam: sole member leaves — deletes the team row first (while
// the captain is still in team_members so RLS policies pass), then the cascade
// removes team_members / team_invitations automatically.
async function leaveAndDeleteTeam() {
  // Clear the FK on profiles first — otherwise the teams DELETE gets a 409
  await supabase.from('profiles').update({ current_team: null }).eq('profile_id', authStore.user.id)

  const { error } = await supabase.from('teams').delete().eq('team_id', teamId)
  if (error) {
    deleteModal.errorMessage = 'Neizdevās dzēst komandu.'
    deleteModal.deleting     = false
    return
  }
  await authStore.fetchProfile()
  router.push('/teams')
}

// confirmRemovePlayer: captain removes another player from the team
function confirmRemovePlayer(member) {
  const name = [member.profile?.name, member.profile?.surname].filter(Boolean).join(' ')
  openConfirm(
    `Vai tiešām vēlaties noņemt ${name} no komandas?`,
    () => removePlayer(member)
  )
}

async function removePlayer(member) {
  actionError.value = ''
  const { error } = await supabase.from('team_members').delete().eq('team_member_id', member.team_member_id)
  if (error) { actionError.value = 'Neizdevās noņemt spēlētāju.'; return }
  await supabase.from('profiles').update({ current_team: null }).eq('profile_id', member.profile.profile_id)
  await fetchMembers()
}

// confirmAssignCaptain: captain hands their role to another player
function confirmAssignCaptain(member) {
  const name = [member.profile?.name, member.profile?.surname].filter(Boolean).join(' ')
  openConfirm(
    `Vai tiešām vēlaties iecelt ${name} par kapteiņi? Jūs kļūsiet par parastu spēlētāju.`,
    () => assignCaptain(member)
  )
}

async function assignCaptain(member) {
  const myMem = myMembership.value
  if (!myMem) return
  actionError.value = ''

  // Promote target to captain, demote self to player
  const { error: e1 } = await supabase.from('team_members').update({ role: 'captain' }).eq('team_member_id', member.team_member_id)
  const { error: e2 } = await supabase.from('team_members').update({ role: 'player' }).eq('team_member_id', myMem.team_member_id)

  if (e1 || e2) { actionError.value = 'Neizdevās mainīt kapteiņa lomu.'; return }
  await fetchMembers()
}

// ─── Edit Team modal ──────────────────────────────────────────────────────

const editModal = reactive({
  show:           false,
  saving:         false,
  errorMessage:   '',
  name:           '',
  bio:            '',
  city:           '',
  age_group:      '',
  currentPicture: null,
  removePicture:  false,
  newFile:        null,
  previewUrl:     null,
})

function openEditModal() {
  const t = team.value
  Object.assign(editModal, {
    show:           true,
    saving:         false,
    errorMessage:   '',
    name:           t.name,
    bio:            t.bio || '',
    city:           t.city || '',
    age_group:      t.age_group || '',
    currentPicture: t.picture || null,
    removePicture:  false,
    newFile:        null,
    previewUrl:     null,
  })
}

function handleEditLogoSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  editModal.newFile       = file
  editModal.removePicture = false
  editModal.previewUrl    = URL.createObjectURL(file)
}

function removeEditLogo() {
  editModal.newFile       = null
  editModal.previewUrl    = null
  editModal.currentPicture = null
  editModal.removePicture  = true
}

// Latvian letters + basic latin + digits + spaces + hyphens
const NAME_RE = /^[a-zA-ZāčēģīķļņōŗšūžĀČĒĢĪĶĻŅŌŖŠŪŽ0-9 \-]+$/

async function saveTeamEdit() {
  editModal.errorMessage = ''
  const name = editModal.name.trim()

  if (!name) {
    editModal.errorMessage = 'Komandas nosaukums ir obligāts.'
    return
  }
  if (name.length < 3 || name.length > 50) {
    editModal.errorMessage = 'Nosaukumam jābūt 3–50 simboliem.'
    return
  }
  if (!NAME_RE.test(name)) {
    editModal.errorMessage = 'Nosaukumā drīkst izmantot tikai burtus, ciparus, atstarpes un defises.'
    return
  }

  const nameChanged = name !== team.value.name

  if (nameChanged) {
    // 90-day cooldown check
    const last = team.value.name_changed_at
    if (last) {
      const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 90) {
        const remaining = Math.ceil(90 - daysSince)
        editModal.errorMessage = `Nosaukumu var mainīt ne biežāk kā reizi 90 dienās. Atlikušas ${remaining} dienas.`
        return
      }
    }

    // Uniqueness check
    const { data: existing } = await supabase
      .from('teams')
      .select('team_id')
      .ilike('name', name)
      .neq('team_id', teamId)
      .maybeSingle()

    if (existing) {
      editModal.errorMessage = 'Komanda ar šādu nosaukumu jau pastāv.'
      return
    }
  }

  editModal.saving = true

  try {
    const payload = {
      name,
      bio:       editModal.bio.trim()  || null,
      city:      editModal.city.trim() || null,
      age_group: editModal.age_group   || null,
    }

    if (nameChanged) {
      payload.name_changed_at = new Date().toISOString()
    }

    if (editModal.removePicture && !editModal.newFile) {
      payload.picture = null
    } else if (editModal.newFile) {
      const file     = editModal.newFile
      const fileName = `team-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw new Error('Neizdevās augšupielādēt logo.')
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      payload.picture = urlData.publicUrl
    }

    const { error } = await supabase.from('teams').update(payload).eq('team_id', teamId)
    if (error) throw new Error('Neizdevās saglabāt izmaiņas.')

    await fetchTeam()
    editModal.show = false
  } catch (err) {
    editModal.errorMessage = err.message || 'Kļūda. Mēģiniet vēlreiz.'
  } finally {
    editModal.saving = false
  }
}

// ─── Delete Team modal ────────────────────────────────────────────────────

const deleteModal = reactive({
  show:         false,
  input:        '',
  deleting:     false,
  errorMessage: '',
})

async function confirmDeleteTeam() {
  deleteModal.deleting     = true
  deleteModal.errorMessage = ''
  try {
    if (authStore.isAdmin && !isCaptain.value) {
      await deleteTeamAsAdmin()
    } else {
      await leaveAndDeleteTeam()
    }
  } catch {
    deleteModal.errorMessage = 'Neizdevās dzēst komandu.'
    deleteModal.deleting     = false
  }
}

// deleteTeamAsAdmin: admin removes a team they are not a member of
async function deleteTeamAsAdmin() {
  // Clear current_team on all members before deleting the team row
  const memberIds = members.value.map(m => m.profile?.profile_id).filter(Boolean)
  if (memberIds.length) {
    await supabase.from('profiles').update({ current_team: null }).in('profile_id', memberIds)
  }
  const { error } = await supabase.from('teams').delete().eq('team_id', teamId)
  if (error) {
    deleteModal.errorMessage = 'Neizdevās dzēst komandu.'
    deleteModal.deleting     = false
    return
  }
  router.push('/teams')
}

// ─── Add Player modal ─────────────────────────────────────────────────────

const addPlayerModal = reactive({
  show:           false,
  visualId:       '',
  searching:      false,
  foundPlayer:    null,
  notFound:       false,
  alreadyInvited: false,
  inviting:       false,
  successMessage: '',
  errorMessage:   '',
})

function closeAddPlayerModal() {
  Object.assign(addPlayerModal, {
    show: false, visualId: '', searching: false,
    foundPlayer: null, notFound: false, alreadyInvited: false,
    inviting: false, successMessage: '', errorMessage: '',
  })
}

// searchPlayer: looks up a profile row by visual_id
async function searchPlayer() {
  // Reset result state
  addPlayerModal.foundPlayer    = null
  addPlayerModal.notFound       = false
  addPlayerModal.alreadyInvited = false
  addPlayerModal.successMessage = ''
  addPlayerModal.errorMessage   = ''

  const id = addPlayerModal.visualId.trim().toUpperCase()
  if (!id) return

  addPlayerModal.searching = true

  const { data } = await supabase
    .from('profiles')
    .select('profile_id, name, surname, nickname, picture, visual_id')
    .eq('visual_id', id)
    .maybeSingle()

  addPlayerModal.searching = false

  if (!data) {
    addPlayerModal.notFound = true
    return
  }

  addPlayerModal.foundPlayer = data

  // Check if a pending invite for this player already exists
  const { data: existing } = await supabase
    .from('team_invitations')
    .select('invitation_id')
    .eq('team_id', teamId)
    .eq('invitee_profile_id', data.profile_id)
    .eq('status', 'pending')
    .maybeSingle()

  addPlayerModal.alreadyInvited = !!existing
}

// invitePlayer: sends a team invitation to the found player
async function invitePlayer(profile) {
  addPlayerModal.inviting      = true
  addPlayerModal.errorMessage  = ''

  const { error } = await supabase
    .from('team_invitations')
    .insert({
      team_id:               teamId,
      invitee_profile_id:    profile.profile_id,
      invited_by_profile_id: authStore.user.id,
    })

  addPlayerModal.inviting = false

  if (error) {
    addPlayerModal.errorMessage = 'Neizdevās nosūtīt uzaicinājumu.'
    return
  }

  addPlayerModal.alreadyInvited  = true
  addPlayerModal.successMessage  = 'Uzaicinājums nosūtīts!'
}

// ─── Data Fetching ────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true
  await Promise.all([fetchTeam(), fetchMembers(), fetchGames()])
  loading.value = false
})

async function fetchTeam() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (!error) team.value = data
}

async function fetchMembers() {
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

async function fetchGames() {
  const { data, error } = await supabase
    .from('game_challenges')
    .select('*')
    .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })

  if (error || !data?.length) return

  // Fetch opponent team names (no FK constraints — manual join)
  const uniqueIds = [...new Set(data.map(c =>
    c.challenger_team_id === teamId ? c.challenged_team_id : c.challenger_team_id
  ))]
  const { data: teamRows } = await supabase
    .from('teams').select('team_id, name').in('team_id', uniqueIds)
  const nameMap = Object.fromEntries((teamRows || []).map(t => [t.team_id, t.name]))

  games.value = data.map(c => {
    const iChallenger = c.challenger_team_id === teamId
    const opponentId  = iChallenger ? c.challenged_team_id : c.challenger_team_id
    const winner      = c.final_score_team1 > c.final_score_team2
      ? c.challenger_team_id : c.challenged_team_id
    return {
      game_id:      c.challenge_id,
      score_01:     iChallenger ? c.final_score_team1 : c.final_score_team2,
      score_02:     iChallenger ? c.final_score_team2 : c.final_score_team1,
      winner,
      team_01:      c.challenger_team_id,
      team_02:      c.challenged_team_id,
      timestamp:    c.scheduled_at,
      opponentName: nameMap[opponentId] || '?',
    }
  })
}

// formatDate: converts ISO timestamp to a readable Latvian date
function formatDate(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('lv-LV', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

useHead({
  title: computed(() => team.value ? `${team.value.name} · Basketbols` : 'Komanda · Basketbols'),
})
</script>
