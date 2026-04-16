<template>
  <!--
    pages/games/challenge.vue
    Captain-only form to send a game challenge.
    Fields: opponent team search (dropdown, ≥3 players), court picker (mini-map),
    date + time, optional comment.
  -->
  <div class="max-w-2xl mx-auto px-4 py-10">

    <h1 class="text-2xl font-bold mb-6">Sūtīt izaicinājumu</h1>

    <!-- No team -->
    <div v-if="!myTeamId" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-xl px-4 py-4">
      <p class="font-semibold">Nav komandas</p>
      <p class="text-sm mt-1">
        Lai sūtītu izaicinājumu, tev jāpiederas komandai.
        <NuxtLink to="/teams" class="underline font-medium">Doties uz komandām</NuxtLink>
      </p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="text-center py-10 text-secondary">
      <Icon name="ph:hourglass" class="w-10 h-10 mx-auto mb-2" />
      <p>Ielādē...</p>
    </div>

    <template v-else>
      <!-- Not captain -->
      <div v-if="!isCaptain" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-xl px-4 py-4">
        <p class="font-semibold">Tikai kapteinis var sūtīt izaicinājumus</p>
        <p class="text-sm mt-1">Šī darbība ir pieejama tikai komandas kapteinim.</p>
      </div>

      <!-- Not enough players -->
      <div v-else-if="myTeamSize < 3" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-xl px-4 py-4">
        <p class="font-semibold">Nepietiek spēlētāju</p>
        <p class="text-sm mt-1">Komandā jābūt vismaz 3 spēlētājiem (pašlaik: {{ myTeamSize }}).</p>
      </div>

      <!-- Success -->
      <div v-if="savedOk" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-6">
        <Icon name="ph:check-circle" class="w-4 h-4 inline-block align-middle mr-1" />Izaicinājums nosūtīts!
        <NuxtLink to="/games" class="font-medium underline ml-1">Skatīt Spēles</NuxtLink>
      </div>

      <!-- Error -->
      <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
        {{ errorMessage }}
      </div>

      <!-- Form -->
      <form
        v-if="isCaptain && myTeamSize >= 3 && !savedOk"
        @submit.prevent="handleChallenge"
        class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6 space-y-6"
      >

        <!-- ── 1. Opponent team search ──────────────────────────────── -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Pretinieka komanda <span class="text-red-500">*</span>
          </label>

          <!-- Selected chip -->
          <div v-if="form.opponentTeamId" class="flex items-center gap-2 mb-2">
            <span class="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full">
              {{ form.opponentTeamName }}
              <button type="button" @click="clearTeam" class="hover:text-red-500 transition text-xs leading-none">✕</button>
            </span>
          </div>

          <!-- Search input + dropdown -->
          <div v-if="!form.opponentTeamId" class="relative">
            <input
              v-model="teamSearch"
              type="text"
              placeholder="Meklēt komandu pēc nosaukuma..."
              autocomplete="off"
              class="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              @focus="showTeamDropdown = true"
              @blur="onTeamBlur"
            />
            <div
              v-if="showTeamDropdown && teamSearch.trim()"
              class="absolute top-full left-0 right-0 mt-1 bg-surface border border-secondary/20 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
            >
              <div v-if="teamSearching" class="px-4 py-3 text-sm text-secondary">Meklē...</div>
              <div v-else-if="teamResults.length === 0" class="px-4 py-3 text-sm text-secondary">
                Nav atrasta neviena piemērota komanda (nepieciešami min. 3 spēlētāji)
              </div>
              <button
                v-for="team in teamResults"
                :key="team.team_id"
                type="button"
                @mousedown.prevent="selectTeam(team)"
                class="w-full text-left px-4 py-3 hover:bg-primary/5 transition flex items-center justify-between border-b border-secondary/10 last:border-0"
              >
                <span class="font-medium">{{ team.name }}</span>
                <span v-if="team.city" class="text-xs text-secondary">{{ team.city }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── 2. Court picker ──────────────────────────────────────── -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Laukums <span class="text-red-500">*</span>
          </label>

          <!-- Selected court chip -->
          <div v-if="form.courtId" class="flex items-center gap-2 mb-3">
            <span class="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full">
              {{ form.courtName }}
              <button type="button" @click="clearCourt" class="hover:text-red-500 transition text-xs leading-none">✕</button>
            </span>
          </div>

          <!-- Court search bar -->
          <input
            v-model="courtSearch"
            type="text"
            placeholder="Meklēt laukumu pēc nosaukuma..."
            class="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition mb-3"
          />

          <!-- Mini Leaflet map -->
          <div
            id="challenge-court-map"
            class="w-full rounded-xl overflow-hidden border border-secondary/20 shadow"
            style="height: 280px;"
          ></div>

          <!-- Court list -->
          <div class="mt-2 max-h-36 overflow-y-auto space-y-1">
            <div v-if="filteredCourts.length === 0" class="text-sm text-secondary px-2 py-2">
              Nav atrasts neviens laukums
            </div>
            <button
              v-for="court in filteredCourts"
              :key="court.court_id"
              type="button"
              @click="selectCourt(court)"
              class="w-full text-left px-4 py-2 rounded-lg text-sm transition flex items-center justify-between"
              :class="form.courtId === court.court_id
                ? 'bg-primary text-white'
                : 'hover:bg-secondary/10'"
            >
              <span class="truncate">{{ court.name }}</span>
              <Icon :name="court.outdoor ? 'ph:sun' : 'ph:building'" class="ml-2 w-3.5 h-3.5 shrink-0 opacity-70" />
            </button>
          </div>
        </div>

        <!-- ── 3. Date + Time ───────────────────────────────────────── -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Datums un laiks <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-3">
            <!-- Date with calendar button -->
            <div class="flex-1 relative">
              <input
                ref="dateInput"
                v-model="form.date"
                type="date"
                :min="minDate"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              <button
                type="button"
                @click="dateInput?.click()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition pointer-events-none"
                tabindex="-1"
              >
                <Icon name="ph:calendar" class="w-4 h-4" />
              </button>
            </div>
            <!-- Time -->
            <div class="w-32">
              <input
                v-model="form.time"
                type="time"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
          </div>
        </div>

        <!-- ── 4. Comment ───────────────────────────────────────────── -->
        <div>
          <label class="block text-sm font-medium mb-1">
            Komentārs
            <span class="text-secondary text-xs font-normal">(pēc izvēles)</span>
          </label>
          <textarea
            v-model="form.comment"
            maxlength="500"
            rows="3"
            placeholder="Papildu informācija par spēli (vieta, noteikumi u.c.)..."
            class="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
          />
          <p class="text-xs text-secondary text-right mt-0.5">{{ form.comment.length }}/500</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="saving"
          class="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span v-if="saving">Sūta...</span>
          <span v-else class="flex items-center justify-center gap-2"><Icon name="ph:sword" class="w-4 h-4" /> Sūtīt izaicinājumu</span>
        </button>

      </form>
    </template>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

useHead({
  link: [{ rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }],
})

const supabase   = useSupabase()
const authStore  = useAuthStore()

// ─── State ─────────────────────────────────────────────────────────────────

const loading      = ref(true)
const saving       = ref(false)
const savedOk      = ref(false)
const errorMessage = ref('')

const isCaptain    = ref(false)
const myTeamSize   = ref(0)
const myTeamName   = ref('')

const teamSearch       = ref('')
const teamResults      = ref([])
const teamSearching    = ref(false)
const showTeamDropdown = ref(false)

const courts      = ref([])
const courtSearch = ref('')

const dateInput = ref(null)

const form = reactive({
  opponentTeamId:   '',
  opponentTeamName: '',
  courtId:          '',
  courtName:        '',
  date:             '',
  time:             '',
  comment:          '',
})

// Leaflet (managed imperatively — not reactive)
let map          = null
let markers      = []
let L            = null
let tileLayer    = null
let darkObserver = null

// ─── Computed ──────────────────────────────────────────────────────────────

const myTeamId = computed(() => authStore.profile?.current_team)

const minDate = computed(() => new Date().toISOString().slice(0, 10))

const filteredCourts = computed(() => {
  const q = courtSearch.value.trim().toLowerCase()
  if (!q) return courts.value
  return courts.value.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.address?.toLowerCase().includes(q)
  )
})

// ─── Team search (debounced 300ms) ─────────────────────────────────────────

let searchTimer = null
watch(teamSearch, (val) => {
  clearTimeout(searchTimer)
  if (!val.trim()) { teamResults.value = []; teamSearching.value = false; return }
  teamSearching.value = true
  searchTimer = setTimeout(() => doSearchTeams(val.trim()), 300)
})

async function doSearchTeams(q) {
  const { data } = await supabase
    .from('teams')
    .select('team_id, name, city, team_members(count)')
    .ilike('name', `%${q}%`)
    .neq('team_id', myTeamId.value || '')
    .limit(20)

  // Only show teams with ≥3 members
  teamResults.value = (data || []).filter(t => (t.team_members?.[0]?.count ?? 0) >= 3)
  teamSearching.value = false
}

function selectTeam(team) {
  form.opponentTeamId   = team.team_id
  form.opponentTeamName = team.name
  teamSearch.value       = ''
  showTeamDropdown.value = false
}

function clearTeam() {
  form.opponentTeamId   = ''
  form.opponentTeamName = ''
}

function onTeamBlur() {
  // Delay hiding so mousedown on a result fires first
  setTimeout(() => { showTeamDropdown.value = false }, 200)
}

// ─── Court selection ───────────────────────────────────────────────────────

function selectCourt(court) {
  form.courtId   = court.court_id
  form.courtName = court.name
  if (map && court.latitude != null && court.longitude != null) {
    map.setView([court.latitude, court.longitude], 15)
    const marker = markers.find(m => m._courtId === court.court_id)
    if (marker) marker.openPopup()
  }
  drawMarkers()
}

function clearCourt() {
  form.courtId   = ''
  form.courtName = ''
  drawMarkers()
}

function drawMarkers() {
  if (!map || !L) return
  markers.forEach(m => m.remove())
  markers = []

  filteredCourts.value.forEach(court => {
    if (court.latitude == null || court.longitude == null) return

    const isSelected = form.courtId === court.court_id
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:${isSelected ? '#f97316' : '#3b82f6'};
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      "></div>`,
      iconSize:   [14, 14],
      iconAnchor: [7, 7],
    })

    const marker = L.marker([court.latitude, court.longitude], { icon })
      .addTo(map)
      .bindPopup(`<strong>${court.name}</strong>`)
    marker._courtId = court.court_id
    marker.on('click', () => selectCourt(court))
    markers.push(marker)
  })
}

// Redraw markers when court search filter changes
watch(filteredCourts, () => drawMarkers())

// ─── Submit ────────────────────────────────────────────────────────────────

async function handleChallenge() {
  errorMessage.value = ''

  if (!form.opponentTeamId) { errorMessage.value = 'Izvēlies pretinieka komandu.'; return }
  if (!form.courtId)         { errorMessage.value = 'Izvēlies laukumu.'; return }
  if (!form.date || !form.time) { errorMessage.value = 'Norādi datumu un laiku.'; return }

  const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
  if (new Date(scheduledAt) <= new Date()) {
    errorMessage.value = 'Spēles laikam jābūt nākotnē.'
    return
  }

  saving.value = true
  try {
    // 1. Create the challenge record
    const { data: challenge, error: challengeErr } = await supabase
      .from('game_challenges')
      .insert({
        challenger_team_id: myTeamId.value,
        challenged_team_id: form.opponentTeamId,
        court_id:           form.courtId,
        scheduled_at:       scheduledAt,
        comment:            form.comment.trim() || null,
        created_by:         authStore.user.id,
        status:             'pending',
      })
      .select()
      .single()

    if (challengeErr) throw new Error(challengeErr.message || 'Neizdevās izveidot izaicinājumu.')

    // 2. Notify every member of the challenged team
    const { data: members } = await supabase
      .from('team_members')
      .select('profile_id')
      .eq('team_id', form.opponentTeamId)

    if (members?.length) {
      await supabase.from('notifications').insert(
        members.map(m => ({
          profile_id: m.profile_id,
          type:       'challenge_received',
          payload: {
            challenge_id:         challenge.challenge_id,
            challenger_team_name: myTeamName.value,
            scheduled_at:         scheduledAt,
          },
        }))
      )
    }

    savedOk.value = true
    Object.assign(form, {
      opponentTeamId: '', opponentTeamName: '',
      courtId: '', courtName: '',
      date: '', time: '', comment: '',
    })

  } catch (err) {
    errorMessage.value = err.message || 'Kļūda. Mēģiniet vēlreiz.'
  } finally {
    saving.value = false
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!myTeamId.value) { loading.value = false; return }

  const [membersRes, captainRes, courtsRes, teamRes] = await Promise.all([
    supabase.from('team_members').select('profile_id').eq('team_id', myTeamId.value),
    supabase.from('team_members').select('role')
      .eq('team_id', myTeamId.value)
      .eq('profile_id', authStore.user.id)
      .maybeSingle(),
    supabase.from('courts').select('*').order('name'),
    supabase.from('teams').select('name').eq('team_id', myTeamId.value).maybeSingle(),
  ])

  myTeamSize.value = membersRes.data?.length ?? 0
  isCaptain.value  = captainRes.data?.role === 'captain'
  courts.value     = courtsRes.data || []
  myTeamName.value = teamRes.data?.name || ''

  loading.value = false

  // Only init map if the form will be shown
  if (!isCaptain.value || myTeamSize.value < 3) return

  await nextTick()

  L = (await import('leaflet')).default
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  map = L.map('challenge-court-map').setView([56.95, 24.11], 7)

  function getCartoDBoUrl() {
    return document.documentElement.classList.contains('dark')
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  }

  const cartoAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

  tileLayer = L.tileLayer(getCartoDBoUrl(), { attribution: cartoAttribution, maxZoom: 19 }).addTo(map)

  // Swap tiles when the user toggles dark mode
  darkObserver = new MutationObserver(() => {
    if (!map) return
    tileLayer.remove()
    tileLayer = L.tileLayer(getCartoDBoUrl(), { attribution: cartoAttribution, maxZoom: 19 }).addTo(map)
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  drawMarkers()
})

onUnmounted(() => {
  darkObserver?.disconnect()
  map?.remove()
})
</script>
