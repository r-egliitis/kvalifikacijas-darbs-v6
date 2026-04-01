<template>
  <!--
    pages/games/index.vue
    Three tabs:
      1. Gaidošie   — pending challenges, per-player vote (accept/deny)
      2. Pieņemtās  — accepted challenges, captain score submission
      3. Vēsture    — completed games
  -->
  <div class="max-w-4xl mx-auto px-4 py-10">

    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Spēles</h1>
      <!-- New challenge button (captains only) -->
      <NuxtLink
        v-if="isCaptain && myTeamSize >= 3"
        to="/games/challenge"
        class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition text-sm"
      >
        ⚔️ Sūtīt izaicinājumu
      </NuxtLink>
    </div>

    <!-- ── Tab navigation ─────────────────────────────────────────────── -->
    <div class="flex border-b border-secondary/20 mb-6 gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2.5 font-medium text-sm transition relative"
        :class="activeTab === tab.id
          ? 'border-b-2 border-primary text-primary'
          : 'text-secondary hover:text-app-text'"
      >
        {{ tab.label }}
        <span
          v-if="tab.id === 'pending' && pendingForMe > 0"
          class="ml-1.5 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
        >
          {{ pendingForMe }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <div class="text-4xl mb-3">⏳</div>
      <p>Ielādē...</p>
    </div>

    <!-- No team -->
    <div v-else-if="!myTeamId" class="text-center py-16 text-secondary">
      <div class="text-5xl mb-4">🏀</div>
      <p class="font-medium">Nav komandas</p>
      <p class="text-sm mt-1">
        <NuxtLink to="/teams" class="text-primary hover:underline">Pievienojies komandai</NuxtLink>
        , lai redzētu spēles.
      </p>
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════════════════
           TAB 1: GAIDOŠIE (pending challenges)
           ══════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'pending'">

        <div v-if="pendingChallenges.length === 0" class="text-center py-12 text-secondary">
          <div class="text-5xl mb-4">⚔️</div>
          <p class="font-medium">Nav gaidošo izaicinājumu</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="ch in pendingChallenges"
            :key="ch.challenge_id"
            class="bg-surface rounded-2xl border border-secondary/10 shadow-sm p-5"
          >
            <!-- Teams -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <p class="font-bold text-base">
                  {{ ch.challengerName }}
                  <span class="text-secondary font-normal mx-2">vs</span>
                  {{ ch.challengedName }}
                </p>
                <p class="text-secondary text-sm mt-0.5">📍 {{ ch.courtName }}</p>
                <p class="text-secondary text-sm">🕐 {{ formatDate(ch.scheduled_at) }}</p>
                <p v-if="ch.comment" class="text-secondary text-sm mt-1 italic">„{{ ch.comment }}"</p>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 shrink-0">
                Gaida balsojumu
              </span>
            </div>

            <!-- Vote counts per team -->
            <div class="flex gap-4 mb-4 text-sm">
              <div class="flex-1 bg-secondary/5 rounded-xl px-3 py-2">
                <p class="font-medium text-xs text-secondary mb-1">{{ ch.challengerName }}</p>
                <p>
                  <span class="text-green-600 font-semibold">{{ voteCount(ch, ch.challenger_team_id, 'accept') }}</span>
                  <span class="text-secondary"> / {{ ch.challengerSize }} piekrituši</span>
                </p>
                <p class="text-xs text-secondary mt-0.5">
                  {{ voteCount(ch, ch.challenger_team_id, 'deny') }} noraidīja
                </p>
              </div>
              <div class="flex-1 bg-secondary/5 rounded-xl px-3 py-2">
                <p class="font-medium text-xs text-secondary mb-1">{{ ch.challengedName }}</p>
                <p>
                  <span class="text-green-600 font-semibold">{{ voteCount(ch, ch.challenged_team_id, 'accept') }}</span>
                  <span class="text-secondary"> / {{ ch.challengedSize }} piekrituši</span>
                </p>
                <p class="text-xs text-secondary mt-0.5">
                  {{ voteCount(ch, ch.challenged_team_id, 'deny') }} noraidīja
                </p>
              </div>
            </div>

            <!-- User's vote status -->
            <div v-if="myVote(ch)" class="text-sm mb-3">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                :class="myVote(ch) === 'accept'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
              >
                {{ myVote(ch) === 'accept' ? '✓ Jūs piekritāt' : '✕ Jūs noraidījāt' }}
              </span>
            </div>

            <!-- Vote buttons (if user hasn't voted yet) -->
            <div v-if="!myVote(ch)" class="flex gap-3">
              <button
                @click="castVote(ch, 'accept')"
                :disabled="voteLoading === ch.challenge_id"
                class="flex-1 bg-green-600 text-white font-semibold py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition text-sm"
              >
                <span v-if="voteLoading === ch.challenge_id">...</span>
                <span v-else>✓ Piekrist</span>
              </button>
              <button
                @click="castVote(ch, 'deny')"
                :disabled="voteLoading === ch.challenge_id"
                class="flex-1 border border-red-300 text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition text-sm"
              >
                <span v-if="voteLoading === ch.challenge_id">...</span>
                <span v-else>✕ Noraidīt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════
           TAB 2: PIEŅEMTĀS (accepted challenges)
           ══════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'accepted'">

        <div v-if="acceptedChallenges.length === 0" class="text-center py-12 text-secondary">
          <div class="text-5xl mb-4">🏆</div>
          <p class="font-medium">Nav pieņemtu izaicinājumu</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="ch in acceptedChallenges"
            :key="ch.challenge_id"
            class="bg-surface rounded-2xl border border-secondary/10 shadow-sm p-5"
          >
            <!-- Teams + info -->
            <div class="mb-4">
              <p class="font-bold text-base">
                {{ ch.challengerName }}
                <span class="text-secondary font-normal mx-2">vs</span>
                {{ ch.challengedName }}
              </p>
              <p class="text-secondary text-sm mt-0.5">📍 {{ ch.courtName }}</p>
              <p class="text-secondary text-sm">🕐 {{ formatDate(ch.scheduled_at) }}</p>
              <p v-if="ch.comment" class="text-secondary text-sm mt-1 italic">„{{ ch.comment }}"</p>
            </div>

            <!-- ── Attendance section (all players) ───────────────── -->
            <div class="border-t border-secondary/10 pt-4 mb-4">
              <p class="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">Dalība</p>

              <!-- Counts per team -->
              <div class="flex gap-3 mb-3 text-sm">
                <div class="flex-1 bg-secondary/5 rounded-xl px-3 py-2">
                  <p class="font-medium text-xs text-secondary mb-1">{{ ch.challengerName }}</p>
                  <p>
                    <span class="text-green-600 font-semibold">{{ voteCount(ch, ch.challenger_team_id, 'accept') }}</span>
                    <span class="text-secondary"> iet · </span>
                    <span class="text-red-500 font-semibold">{{ voteCount(ch, ch.challenger_team_id, 'deny') }}</span>
                    <span class="text-secondary"> neiet</span>
                  </p>
                </div>
                <div class="flex-1 bg-secondary/5 rounded-xl px-3 py-2">
                  <p class="font-medium text-xs text-secondary mb-1">{{ ch.challengedName }}</p>
                  <p>
                    <span class="text-green-600 font-semibold">{{ voteCount(ch, ch.challenged_team_id, 'accept') }}</span>
                    <span class="text-secondary"> iet · </span>
                    <span class="text-red-500 font-semibold">{{ voteCount(ch, ch.challenged_team_id, 'deny') }}</span>
                    <span class="text-secondary"> neiet</span>
                  </p>
                </div>
              </div>

              <!-- Attendance error -->
              <div
                v-if="attendanceError[ch.challenge_id]"
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-xl px-3 py-2 text-sm mb-2"
              >
                {{ attendanceError[ch.challenge_id] }}
              </div>

              <!-- Current status + change buttons -->
              <div class="flex items-center gap-3">
                <span
                  class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  :class="myVote(ch) === 'accept'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : myVote(ch) === 'deny'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-secondary/10 text-secondary'"
                >
                  {{ myVote(ch) === 'accept' ? '✓ Iešu' : myVote(ch) === 'deny' ? '✕ Neiešu' : '— Nav atbildēts' }}
                </span>

                <!-- Going button (show if not already going) -->
                <button
                  v-if="myVote(ch) !== 'accept'"
                  @click="changeAttendance(ch, 'accept')"
                  :disabled="attendanceLoading === ch.challenge_id"
                  class="text-sm font-medium px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  Iešu
                </button>

                <!-- Not going button (show if currently going or not voted) -->
                <button
                  v-if="myVote(ch) !== 'deny'"
                  @click="changeAttendance(ch, 'deny')"
                  :disabled="attendanceLoading === ch.challenge_id"
                  class="text-sm font-medium px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
                >
                  Neiešu
                </button>
              </div>
            </div>

            <!-- Score section (captains only) -->
            <div v-if="isCaptain" class="border-t border-secondary/10 pt-4">

              <!-- Too early to score -->
              <div v-if="!canSubmitScore(ch)" class="text-sm text-secondary">
                ⏳ Rezultātu var ievadīt pēc spēles laika ({{ formatDate(ch.scheduled_at) }}).
              </div>

              <template v-else>

                <!-- Mismatch warning -->
                <div
                  v-if="mismatchIds.includes(ch.challenge_id)"
                  class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl px-3 py-2 text-sm mb-3"
                >
                  ⚠️ Rezultāti nesakrita. Lūdzu ievadiet rezultātu no jauna.
                </div>

                <!-- Other captain already submitted (and I haven't yet) -->
                <div
                  v-if="otherCaptainSubmitted(ch) && !myCaptainSubmitted(ch)"
                  class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl px-3 py-2 text-sm mb-3"
                >
                  ℹ️ Otra komanda iesniedza:
                  <span class="font-mono font-bold">
                    {{ otherScore(ch).t1 }} : {{ otherScore(ch).t2 }}
                  </span>
                  — lūdzu apstipriniet vai ievadiet pareizo rezultātu.
                </div>

                <!-- I already submitted, waiting for other captain -->
                <div
                  v-if="myCaptainSubmitted(ch) && !otherCaptainSubmitted(ch)"
                  class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-3 py-2 text-sm"
                >
                  ✅ Jūs iesniedzāt
                  <span class="font-mono font-bold">{{ myScore(ch).t1 }} : {{ myScore(ch).t2 }}</span>
                  — gaida otras komandas apstiprinājumu.
                </div>

                <!-- Score input form (if I haven't submitted or mismatch) -->
                <div v-if="!myCaptainSubmitted(ch) || mismatchIds.includes(ch.challenge_id)">
                  <p class="text-sm font-medium mb-3">
                    {{ ch.challengerName }} : {{ ch.challengedName }}
                  </p>
                  <div class="flex items-center gap-3 mb-3">
                    <div class="flex-1">
                      <label class="block text-xs text-secondary mb-1">{{ ch.challengerName }}</label>
                      <input
                        v-model.number="getScoreInput(ch.challenge_id).t1"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-center font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <span class="text-secondary font-bold text-xl pt-4">:</span>
                    <div class="flex-1">
                      <label class="block text-xs text-secondary mb-1">{{ ch.challengedName }}</label>
                      <input
                        v-model.number="getScoreInput(ch.challenge_id).t2"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-center font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <button
                    @click="submitScore(ch)"
                    :disabled="scoreLoading === ch.challenge_id"
                    class="w-full bg-primary text-white font-semibold py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition text-sm"
                  >
                    <span v-if="scoreLoading === ch.challenge_id">Saglabā...</span>
                    <span v-else>Iesniegt rezultātu</span>
                  </button>
                </div>

              </template>

            </div>

            <!-- Non-captain: just show "game confirmed" message -->
            <div v-else class="border-t border-secondary/10 pt-3 text-sm text-secondary">
              ✅ Izaicinājums apstiprināts — gaida spēles laiku
            </div>

          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════
           TAB 3: VĒSTURE (completed games)
           ══════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'history'">

        <div v-if="completedChallenges.length === 0" class="text-center py-12 text-secondary">
          <div class="text-5xl mb-4">📊</div>
          <p class="font-medium">Spēļu vēsture ir tukša</p>
          <p class="text-sm mt-1">Pabeigtās spēles parādīsies šeit.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="ch in completedChallenges"
            :key="ch.challenge_id"
            class="bg-surface rounded-2xl border border-secondary/10 shadow-sm p-4 flex items-center gap-4"
          >
            <!-- Win / Loss badge -->
            <span
              class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              :class="ch.final_score_team1 != null
                ? (ch.challenger_team_id === myTeamId
                    ? (ch.final_score_team1 > ch.final_score_team2 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')
                    : (ch.final_score_team2 > ch.final_score_team1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'))
                : 'bg-secondary/10 text-secondary'"
            >
              {{ resultLabel(ch) }}
            </span>

            <!-- Teams + date -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">
                {{ ch.challengerName }} vs {{ ch.challengedName }}
              </p>
              <p class="text-xs text-secondary">{{ formatDate(ch.scheduled_at) }}</p>
            </div>

            <!-- Final score -->
            <span class="font-mono font-bold flex-shrink-0 text-lg">
              {{ ch.final_score_team1 }} : {{ ch.final_score_team2 }}
            </span>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const supabase  = useSupabase()
const authStore = useAuthStore()

// ─── State ─────────────────────────────────────────────────────────────────

const activeTab = ref('pending')
const loading   = ref(true)

const pendingChallenges   = ref([])
const acceptedChallenges  = ref([])
const completedChallenges = ref([])

const isCaptain    = ref(false)
const myTeamSize   = ref(0)
const voteLoading  = ref(null)
const scoreLoading = ref(null)
const mismatchIds      = ref([])       // challenge_ids where last score submission mismatched
const scoreInputs      = reactive({}) // { [challenge_id]: { t1: '', t2: '' } }
const attendanceLoading = ref(null)   // challenge_id currently being updated
const attendanceError   = reactive({}) // { [challenge_id]: string }

const tabs = [
  { id: 'pending',  label: 'Gaidošie' },
  { id: 'accepted', label: 'Pieņemtās' },
  { id: 'history',  label: 'Vēsture' },
]

// ─── Computed ──────────────────────────────────────────────────────────────

const myTeamId = computed(() => authStore.profile?.current_team)

// Count of pending challenges where the current user is on the challenged team and hasn't voted
const pendingForMe = computed(() =>
  pendingChallenges.value.filter(ch =>
    ch.challenged_team_id === myTeamId.value && !myVote(ch)
  ).length
)

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('lv-LV', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function voteCount(ch, teamId, type) {
  return (ch.votes || []).filter(v => v.team_id === teamId && v.vote === type).length
}

function myVote(ch) {
  const v = (ch.votes || []).find(v => v.profile_id === authStore.user?.id)
  return v?.vote || null
}

function canSubmitScore(ch) {
  return new Date() >= new Date(ch.scheduled_at)
}

// Is the current user's captain slot already filled?
function myCaptainSubmitted(ch) {
  const isChallenger = ch.challenger_team_id === myTeamId.value
  return isChallenger ? ch.cap1_score_team1 != null : ch.cap2_score_team1 != null
}

// Has the OTHER team's captain submitted?
function otherCaptainSubmitted(ch) {
  const isChallenger = ch.challenger_team_id === myTeamId.value
  return isChallenger ? ch.cap2_score_team1 != null : ch.cap1_score_team1 != null
}

// What score did the other captain submit?
function otherScore(ch) {
  const isChallenger = ch.challenger_team_id === myTeamId.value
  return isChallenger
    ? { t1: ch.cap2_score_team1, t2: ch.cap2_score_team2 }
    : { t1: ch.cap1_score_team1, t2: ch.cap1_score_team2 }
}

// What score did I submit?
function myScore(ch) {
  const isChallenger = ch.challenger_team_id === myTeamId.value
  return isChallenger
    ? { t1: ch.cap1_score_team1, t2: ch.cap1_score_team2 }
    : { t1: ch.cap2_score_team1, t2: ch.cap2_score_team2 }
}

function resultLabel(ch) {
  if (ch.final_score_team1 == null) return '—'
  const iAmChallenger = ch.challenger_team_id === myTeamId.value
  const iWon = iAmChallenger
    ? ch.final_score_team1 > ch.final_score_team2
    : ch.final_score_team2 > ch.final_score_team1
  return iWon ? 'Uzvara' : 'Zaudējums'
}

function getScoreInput(challengeId) {
  if (!scoreInputs[challengeId]) scoreInputs[challengeId] = { t1: '', t2: '' }
  return scoreInputs[challengeId]
}

// ─── Data fetching ─────────────────────────────────────────────────────────

async function fetchAll() {
  if (!myTeamId.value) { loading.value = false; return }

  // 1. All challenges involving my team
  const { data: rawChallenges } = await supabase
    .from('game_challenges')
    .select('*')
    .or(`challenger_team_id.eq.${myTeamId.value},challenged_team_id.eq.${myTeamId.value}`)
    .order('created_at', { ascending: false })

  const all = rawChallenges || []
  if (!all.length) {
    pendingChallenges.value   = []
    acceptedChallenges.value  = []
    completedChallenges.value = []
    return
  }

  // 2. Parallel: team names, court names, votes, team member counts
  const teamIds      = [...new Set(all.flatMap(c => [c.challenger_team_id, c.challenged_team_id]))]
  const courtIds     = [...new Set(all.map(c => c.court_id).filter(Boolean))]
  const challengeIds = all.map(c => c.challenge_id)

  const [teamsRes, courtsRes, votesRes, membersRes] = await Promise.all([
    supabase.from('teams').select('team_id, name').in('team_id', teamIds),
    courtIds.length
      ? supabase.from('courts').select('court_id, name').in('court_id', courtIds)
      : { data: [] },
    supabase.from('challenge_votes').select('*').in('challenge_id', challengeIds),
    supabase.from('team_members').select('team_id, profile_id').in('team_id', teamIds),
  ])

  // Build lookup maps
  const teamNameMap = Object.fromEntries((teamsRes.data || []).map(t => [t.team_id, t.name]))
  const courtNameMap = Object.fromEntries((courtsRes.data || []).map(c => [c.court_id, c.name]))

  const votesMap = {}
  for (const v of votesRes.data || []) {
    if (!votesMap[v.challenge_id]) votesMap[v.challenge_id] = []
    votesMap[v.challenge_id].push(v)
  }

  const sizeMap = {}
  for (const m of membersRes.data || []) {
    sizeMap[m.team_id] = (sizeMap[m.team_id] || 0) + 1
  }

  // Enrich
  const enriched = all.map(c => ({
    ...c,
    challengerName: teamNameMap[c.challenger_team_id] || '?',
    challengedName: teamNameMap[c.challenged_team_id] || '?',
    courtName:      courtNameMap[c.court_id] || 'Nav norādīts',
    votes:          votesMap[c.challenge_id] || [],
    challengerSize: sizeMap[c.challenger_team_id] || 0,
    challengedSize: sizeMap[c.challenged_team_id] || 0,
  }))

  pendingChallenges.value   = enriched.filter(c => c.status === 'pending')
  acceptedChallenges.value  = enriched.filter(c => c.status === 'accepted')
  completedChallenges.value = enriched.filter(c => c.status === 'completed')
}

// ─── Voting ────────────────────────────────────────────────────────────────

async function castVote(ch, vote) {
  voteLoading.value = ch.challenge_id

  const { error } = await supabase.from('challenge_votes').upsert({
    challenge_id: ch.challenge_id,
    profile_id:   authStore.user.id,
    team_id:      myTeamId.value,
    vote,
  }, { onConflict: 'challenge_id,profile_id' })

  if (!error) {
    await checkVoteOutcome(ch.challenge_id, ch.challenger_team_id, ch.challenged_team_id)
  }

  await fetchAll()
  voteLoading.value = null
}

// changeAttendance: update attendance on an already-accepted challenge.
// "not going" is only allowed if the team still has ≥3 going players without this user.
async function changeAttendance(ch, vote) {
  delete attendanceError[ch.challenge_id]
  attendanceLoading.value = ch.challenge_id

  if (vote === 'deny') {
    // Count how many in my team are going EXCLUDING me
    const goingWithoutMe = (ch.votes || []).filter(v =>
      v.team_id === myTeamId.value &&
      v.vote === 'accept' &&
      v.profile_id !== authStore.user.id
    ).length

    if (goingWithoutMe < 3) {
      attendanceError[ch.challenge_id] = 'Nevar atzīmēt "Neiešu" — komandā nepietiktu 3 spēlētāji.'
      attendanceLoading.value = null
      return
    }
  }

  await supabase.from('challenge_votes').upsert({
    challenge_id: ch.challenge_id,
    profile_id:   authStore.user.id,
    team_id:      myTeamId.value,
    vote,
  }, { onConflict: 'challenge_id,profile_id' })

  await fetchAll()
  attendanceLoading.value = null
}

async function checkVoteOutcome(challengeId, challengerTeamId, challengedTeamId) {
  const [{ data: votes }, { data: t1m }, { data: t2m }] = await Promise.all([
    supabase.from('challenge_votes').select('profile_id, team_id, vote').eq('challenge_id', challengeId),
    supabase.from('team_members').select('profile_id').eq('team_id', challengerTeamId),
    supabase.from('team_members').select('profile_id').eq('team_id', challengedTeamId),
  ])

  const allVotes = votes || []

  // Check cancellation: if any team cannot reach 3 accepts
  for (const [teamId, members] of [[challengerTeamId, t1m || []], [challengedTeamId, t2m || []]]) {
    const denies = allVotes.filter(v => v.team_id === teamId && v.vote === 'deny').length
    const total  = members.length
    if ((total - denies) < 3) {
      await supabase.from('game_challenges').update({ status: 'canceled' }).eq('challenge_id', challengeId)
      await notifyBothTeams(challengeId, challengerTeamId, challengedTeamId, 'challenge_canceled', {})
      return
    }
  }

  // Check acceptance: both teams have ≥3 accepts
  const t1accepts = allVotes.filter(v => v.team_id === challengerTeamId && v.vote === 'accept').length
  const t2accepts = allVotes.filter(v => v.team_id === challengedTeamId && v.vote === 'accept').length
  if (t1accepts >= 3 && t2accepts >= 3) {
    await supabase.from('game_challenges').update({ status: 'accepted' }).eq('challenge_id', challengeId)
    await notifyBothTeams(challengeId, challengerTeamId, challengedTeamId, 'challenge_accepted', {})
  }
}

// ─── Score submission ──────────────────────────────────────────────────────

async function submitScore(ch) {
  const inp = scoreInputs[ch.challenge_id]
  if (!inp || inp.t1 === '' || inp.t2 === '' || inp.t1 == null || inp.t2 == null) return

  scoreLoading.value = ch.challenge_id
  // Clear any previous mismatch flag for this challenge
  mismatchIds.value = mismatchIds.value.filter(id => id !== ch.challenge_id)

  const isChallenger = ch.challenger_team_id === myTeamId.value
  const update = isChallenger
    ? { cap1_score_team1: Number(inp.t1), cap1_score_team2: Number(inp.t2) }
    : { cap2_score_team1: Number(inp.t1), cap2_score_team2: Number(inp.t2) }

  const { data: updated, error } = await supabase
    .from('game_challenges')
    .update(update)
    .eq('challenge_id', ch.challenge_id)
    .select()
    .single()

  if (error) { scoreLoading.value = null; return }

  const c = updated
  const cap1Done = c.cap1_score_team1 != null
  const cap2Done = c.cap2_score_team1 != null

  if (cap1Done && cap2Done) {
    const match = c.cap1_score_team1 === c.cap2_score_team1 &&
                  c.cap1_score_team2 === c.cap2_score_team2

    if (match) {
      // Scores agree — finalize
      await supabase.from('game_challenges').update({
        final_score_team1: c.cap1_score_team1,
        final_score_team2: c.cap1_score_team2,
        status: 'completed',
      }).eq('challenge_id', ch.challenge_id)

      await notifyBothTeams(ch.challenge_id, ch.challenger_team_id, ch.challenged_team_id, 'game_completed', {
        score: `${c.cap1_score_team1}:${c.cap1_score_team2}`,
      })

    } else {
      // Mismatch — clear all score slots
      await supabase.from('game_challenges').update({
        cap1_score_team1: null, cap1_score_team2: null,
        cap2_score_team1: null, cap2_score_team2: null,
      }).eq('challenge_id', ch.challenge_id)

      mismatchIds.value = [...mismatchIds.value, ch.challenge_id]
      delete scoreInputs[ch.challenge_id]

      // Notify both captains
      const { data: captains } = await supabase
        .from('team_members')
        .select('profile_id')
        .in('team_id', [ch.challenger_team_id, ch.challenged_team_id])
        .eq('role', 'captain')

      if (captains?.length) {
        await supabase.from('notifications').insert(
          captains.map(cap => ({
            profile_id: cap.profile_id,
            type:       'score_mismatch',
            payload:    { challenge_id: ch.challenge_id },
          }))
        )
      }
    }
  }

  await fetchAll()
  scoreLoading.value = null
}

// ─── Notification helpers ──────────────────────────────────────────────────

async function notifyBothTeams(challengeId, t1Id, t2Id, type, payload) {
  const { data: members } = await supabase
    .from('team_members')
    .select('profile_id')
    .in('team_id', [t1Id, t2Id])

  if (!members?.length) return

  await supabase.from('notifications').insert(
    members.map(m => ({
      profile_id: m.profile_id,
      type,
      payload:    { challenge_id: challengeId, ...payload },
    }))
  )
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true

  if (myTeamId.value) {
    const [captainRes, membersRes] = await Promise.all([
      supabase.from('team_members').select('role')
        .eq('team_id', myTeamId.value)
        .eq('profile_id', authStore.user.id)
        .maybeSingle(),
      supabase.from('team_members').select('profile_id')
        .eq('team_id', myTeamId.value),
    ])
    isCaptain.value  = captainRes.data?.role === 'captain'
    myTeamSize.value = membersRes.data?.length ?? 0
  }

  await fetchAll()
  loading.value = false
})
</script>
