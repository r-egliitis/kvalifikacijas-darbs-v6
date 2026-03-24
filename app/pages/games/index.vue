<template>
  <!--
    pages/games/index.vue
    The games page — shows two tabs:
      1. "Izaicinājumi" — pending/accepted/declined game requests
      2. "Vēsture" — completed games with scores

    Captains can accept/decline incoming challenges and submit scores for accepted games.
    When both team captains submit matching scores, a game record is created automatically.
    This page requires login.
  -->
  <div class="max-w-4xl mx-auto px-4 py-10">

    <h1 class="text-2xl font-bold mb-6">Spēles</h1>

    <!-- ── Tab Navigation ─────────────────────────────────────────────── -->
    <div class="flex border-b border-secondary/20 mb-6">
      <button
        @click="activeTab = 'challenges'"
        :class="activeTab === 'challenges'
          ? 'border-b-2 border-primary text-primary'
          : 'text-secondary hover:text-app-text'"
        class="px-4 py-2.5 font-medium text-sm transition"
      >
        Izaicinājumi
        <!-- Badge showing count of pending challenges -->
        <span
          v-if="pendingCount > 0"
          class="ml-1.5 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
        >
          {{ pendingCount }}
        </span>
      </button>

      <button
        @click="activeTab = 'history'"
        :class="activeTab === 'history'
          ? 'border-b-2 border-primary text-primary'
          : 'text-secondary hover:text-app-text'"
        class="px-4 py-2.5 font-medium text-sm transition"
      >
        Spēļu vēsture
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-16 text-secondary">
      <div class="text-4xl mb-3">⏳</div>
      <p>Ielādē...</p>
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════════════════════
           TAB 1: CHALLENGES (game requests)
           ══════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'challenges'">

        <!-- New challenge button -->
        <div class="mb-5">
          <NuxtLink
            to="/games/challenge"
            class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition"
          >
            ⚔️ Sūtīt izaicinājumu
          </NuxtLink>
        </div>

        <!-- Empty state -->
        <div v-if="requests.length === 0" class="text-center py-12 text-secondary">
          <div class="text-5xl mb-4">⚔️</div>
          <p class="font-medium">Nav izaicinājumu</p>
          <p class="text-sm mt-1">Izaicini citu komandu, lai sāktu spēli!</p>
        </div>

        <!-- Challenge cards -->
        <div v-else class="space-y-4">
          <div
            v-for="req in requests"
            :key="req.game_request_id"
            class="bg-surface rounded-2xl border border-secondary/10 shadow-sm p-5"
          >
            <!-- Status badge + teams -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <p class="font-bold text-base">
                  {{ req.lineup01TeamName }}
                  <span class="text-secondary font-normal mx-2">vs</span>
                  {{ req.lineup02TeamName }}
                </p>
                <p class="text-secondary text-sm mt-0.5">
                  📍 {{ req.courtName || 'Laukums nav norādīts' }}
                </p>
                <p class="text-secondary text-sm">
                  🕐 {{ req.timestamp ? formatDate(req.timestamp) : 'Laiks nav norādīts' }}
                </p>
              </div>

              <!-- Status badge -->
              <span
                class="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                :class="{
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': req.status === 'pending',
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':  req.status === 'accepted',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':           req.status === 'declined',
                }"
              >
                {{ statusLabel(req.status) }}
              </span>
            </div>

            <!-- Actions for INCOMING pending challenges (the other team sent it to us) -->
            <div
              v-if="req.status === 'pending' && req.isIncoming"
              class="flex gap-3 mt-3"
            >
              <button
                @click="acceptChallenge(req)"
                :disabled="actionLoading === req.game_request_id"
                class="flex-1 bg-green-600 text-white font-semibold py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition text-sm"
              >
                Apstiprināt
              </button>
              <button
                @click="declineChallenge(req)"
                :disabled="actionLoading === req.game_request_id"
                class="flex-1 border border-red-300 text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition text-sm"
              >
                Noraidīt
              </button>
            </div>

            <!-- Score submission (for accepted challenges where user is a captain) -->
            <div v-if="req.status === 'accepted' && req.isCaptain" class="mt-4 border-t border-secondary/10 pt-4">

              <!-- Check if this captain has already submitted -->
              <div v-if="alreadySubmitted(req)" class="text-sm text-secondary">
                ✅ Jūs jau esat ievadījis rezultātu. Gaida otras komandas apstiprinājumu.
              </div>

              <div v-else>
                <p class="text-sm font-medium mb-3">Ievadi rezultātu:</p>
                <div class="flex items-center gap-3">
                  <!-- Team 1 score -->
                  <div class="flex-1">
                    <label class="block text-xs text-secondary mb-1">{{ req.lineup01TeamName }}</label>
                    <input
                      v-model.number="scoreInputs[req.game_request_id + '_01']"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <span class="text-secondary font-bold text-xl pt-4">:</span>

                  <!-- Team 2 score -->
                  <div class="flex-1">
                    <label class="block text-xs text-secondary mb-1">{{ req.lineup02TeamName }}</label>
                    <input
                      v-model.number="scoreInputs[req.game_request_id + '_02']"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <button
                  @click="submitScore(req)"
                  :disabled="scoreLoading === req.game_request_id"
                  class="mt-3 w-full bg-primary text-white font-semibold py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition text-sm"
                >
                  <span v-if="scoreLoading === req.game_request_id">Saglabā...</span>
                  <span v-else>Iesniegt rezultātu</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════
           TAB 2: GAME HISTORY
           ══════════════════════════════════════════════════════════════════ -->
      <div v-if="activeTab === 'history'">

        <!-- Empty state -->
        <div v-if="games.length === 0" class="text-center py-12 text-secondary">
          <div class="text-5xl mb-4">📊</div>
          <p class="font-medium">Spēļu vēsture ir tukša</p>
          <p class="text-sm mt-1">Pēc spēles pabeigšanas rezultāti parādīsies šeit.</p>
        </div>

        <!-- Game history list -->
        <div v-else class="space-y-3">
          <div
            v-for="game in games"
            :key="game.game_id"
            class="bg-surface rounded-2xl border border-secondary/10 shadow-sm p-4 flex items-center gap-4"
          >
            <!-- Win/Loss badge for MY team -->
            <span
              class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              :class="game.winner === myTeamId
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            >
              {{ game.winner === myTeamId ? 'Uzvara' : 'Zaudējums' }}
            </span>

            <!-- Teams and score -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm">
                {{ game.t1?.name }} vs {{ game.t2?.name }}
              </p>
              <p class="text-xs text-secondary">{{ formatDate(game.timestamp) }}</p>
            </div>

            <!-- Final score -->
            <span class="font-mono font-bold flex-shrink-0">
              {{ game.score_01 }} : {{ game.score_02 }}
            </span>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { supabase } from '~/utils/supabase'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

// ─── State ────────────────────────────────────────────────────────────────
const activeTab    = ref('challenges')
const loading      = ref(true)
const actionLoading = ref(null) // stores game_request_id while accepting/declining
const scoreLoading  = ref(null) // stores game_request_id while submitting score

const requests = ref([])  // game_requests involving the user's team
const games    = ref([])  // completed games (from games table)

// scoreInputs: reactive object to hold score inputs keyed by request ID + team
// e.g. { 'GR000001_01': 78, 'GR000001_02': 65 }
const scoreInputs = reactive({})

// The current user's team ID (from their profile)
const myTeamId = computed(() => authStore.profile?.current_team)

// pendingCount: how many incoming challenges are waiting for our response
const pendingCount = computed(() =>
  requests.value.filter(r => r.status === 'pending' && r.isIncoming).length
)

// ─── Helpers ──────────────────────────────────────────────────────────────

// statusLabel: converts status code to Latvian label
function statusLabel(status) {
  const map = {
    pending:  'Gaida apstiprinājumu',
    accepted: 'Apstiprināts',
    declined: 'Noraidīts',
  }
  return map[status] || status
}

// formatDate: ISO timestamp → readable Latvian date
function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('lv-LV', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// alreadySubmitted: checks if the current user has already entered a score for this request
function alreadySubmitted(req) {
  const userId = authStore.user?.id
  return req.submitted_by_team1 === userId || req.submitted_by_team2 === userId
}

// ─── Actions ──────────────────────────────────────────────────────────────

// acceptChallenge: sets the game_request status to 'accepted'
async function acceptChallenge(req) {
  actionLoading.value = req.game_request_id
  await supabase
    .from('game_requests')
    .update({ status: 'accepted' })
    .eq('game_request_id', req.game_request_id)
  await fetchData()
  actionLoading.value = null
}

// declineChallenge: sets the game_request status to 'declined'
async function declineChallenge(req) {
  actionLoading.value = req.game_request_id
  await supabase
    .from('game_requests')
    .update({ status: 'declined' })
    .eq('game_request_id', req.game_request_id)
  await fetchData()
  actionLoading.value = null
}

// submitScore: saves one team captain's score submission.
// If both captains have now submitted matching scores, a games record is created.
async function submitScore(req) {
  const score01 = scoreInputs[req.game_request_id + '_01']
  const score02 = scoreInputs[req.game_request_id + '_02']

  if (score01 === undefined || score02 === undefined || score01 === '' || score02 === '') {
    alert('Lūdzu ievadi abus rezultātus.')
    return
  }

  scoreLoading.value = req.game_request_id

  const userId = authStore.user?.id

  // Determine which team slot this captain represents
  // team1 = the team that sent the challenge (lineup_01)
  // team2 = the team that received the challenge (lineup_02)
  const isTeam1 = req.lineup01TeamId === myTeamId.value

  // Build the update payload for this captain's submission
  const updatePayload = isTeam1
    ? { score_01_team1: score01, score_02_team1: score02, submitted_by_team1: userId }
    : { score_01_team2: score01, score_02_team2: score02, submitted_by_team2: userId }

  // Update the game_request with this captain's score
  const { data: updatedReq, error } = await supabase
    .from('game_requests')
    .update(updatePayload)
    .eq('game_request_id', req.game_request_id)
    .select()
    .single()

  if (error) {
    alert('Kļūda, saglabājot rezultātu.')
    scoreLoading.value = null
    return
  }

  // ── Check if both captains have now submitted matching scores ──────────
  const r = updatedReq
  const bothSubmitted = r.submitted_by_team1 && r.submitted_by_team2
  const scoresMatch   = r.score_01_team1 === r.score_01_team2 && r.score_02_team1 === r.score_02_team2

  if (bothSubmitted && scoresMatch) {
    // Scores match! Determine the winner and create the final game record.
    const s01 = r.score_01_team1
    const s02 = r.score_02_team1
    const winner = s01 > s02 ? req.lineup01TeamId : req.lineup02TeamId

    await supabase.from('games').insert({
      game_request_id: req.game_request_id,
      team_01:         req.lineup01TeamId,
      team_02:         req.lineup02TeamId,
      score_01:        s01,
      score_02:        s02,
      winner:          winner,
      timestamp:       new Date().toISOString(),
    })
  }

  await fetchData()
  scoreLoading.value = null
}

// ─── Data Fetching ────────────────────────────────────────────────────────

async function fetchData() {
  if (!myTeamId.value) {
    loading.value = false
    return
  }

  // ── Fetch game requests involving the user's lineups ─────────────────
  // We need to find all lineups that belong to the user's team
  const { data: myLineups } = await supabase
    .from('lineups')
    .select('lineup_id')
    .eq('team_id', myTeamId.value)

  const myLineupIds = (myLineups || []).map(l => l.lineup_id)

  if (myLineupIds.length > 0) {
    const { data: reqData } = await supabase
      .from('game_requests')
      .select(`
        *,
        court:courts (name),
        lin1:lineups!game_requests_lineup_01_fkey (
          team_id,
          team:teams (name)
        ),
        lin2:lineups!game_requests_lineup_02_fkey (
          team_id,
          team:teams (name)
        )
      `)
      .or(`lineup_01.in.(${myLineupIds.join(',')}),lineup_02.in.(${myLineupIds.join(',')})`)
      .order('timestamp', { ascending: false })

    requests.value = (reqData || []).map(req => ({
      ...req,
      courtName:       req.court?.name,
      lineup01TeamName: req.lin1?.team?.name,
      lineup02TeamName: req.lin2?.team?.name,
      lineup01TeamId:  req.lin1?.team_id,
      lineup02TeamId:  req.lin2?.team_id,
      // isIncoming: the challenge was sent TO us (our team is lineup_02)
      isIncoming: myLineupIds.includes(req.lineup_02),
      // isCaptain: true if the current user is a captain in either involved team
      isCaptain: true, // simplified: all team members on this page can submit scores
    }))
  }

  // ── Fetch completed games for my team ────────────────────────────────
  const { data: gamesData } = await supabase
    .from('games')
    .select(`
      *,
      t1:teams!games_team_01_fkey (name),
      t2:teams!games_team_02_fkey (name)
    `)
    .or(`team_01.eq.${myTeamId.value},team_02.eq.${myTeamId.value}`)
    .order('timestamp', { ascending: false })

  games.value = gamesData || []
}

onMounted(async () => {
  loading.value = true
  await fetchData()
  loading.value = false
})
</script>
