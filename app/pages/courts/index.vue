<template>
  <!--
    pages/courts/index.vue
    Courts catalog with Leaflet map, search bar, court details card,
    and distance-sorted list. Public page (no login required).
    Admin users see the "Add Court" button.
  -->
  <div class="max-w-6xl mx-auto px-4 py-8">

    <!-- ── Top bar: search + add button ─────────────────────────────── -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Meklēt pēc nosaukuma vai adreses..."
        class="flex-1 px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
      />
      <NuxtLink
        v-if="authStore.isAdmin"
        to="/courts/add"
        class="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition whitespace-nowrap"
      >
        + Pievienot laukumu
      </NuxtLink>
    </div>

    <!-- ── Leaflet map ───────────────────────────────────────────────── -->
    <div
      id="courts-map"
      class="w-full rounded-2xl overflow-hidden border border-secondary/20 shadow mb-6"
      style="height: 420px;"
    ></div>

    <!-- ── Selected court details card ──────────────────────────────── -->
    <div
      v-if="selectedCourt"
      class="bg-surface rounded-2xl border border-secondary/20 shadow p-5 mb-6"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold mb-1">{{ selectedCourt.name }}</h2>
          <p class="text-secondary text-sm mb-3">{{ selectedCourt.address }}</p>
          <div class="flex flex-wrap gap-2">
            <span
              :class="selectedCourt.outdoor
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'"
              class="text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              <Icon :name="selectedCourt.outdoor ? 'ph:sun' : 'ph:building'" class="w-3.5 h-3.5 inline-block align-middle mr-1" />{{ selectedCourt.outdoor ? 'Ārtelpas' : 'Iekštelpas' }}
            </span>
          </div>
        </div>
        <a
          v-if="selectedCourt.latitude && selectedCourt.longitude"
          :href="`https://www.openstreetmap.org/?mlat=${selectedCourt.latitude}&mlon=${selectedCourt.longitude}&zoom=16`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-primary hover:underline whitespace-nowrap"
        >
          Atvērt kartē ↗
        </a>
      </div>
    </div>

    <!-- ── Loading state ─────────────────────────────────────────────── -->
    <div v-if="loading" class="text-center py-10 text-secondary">
      <Icon name="ph:hourglass" class="w-12 h-12 mx-auto mb-3" />
      <p>Ielādē laukumus...</p>
    </div>

    <!-- ── Empty state ───────────────────────────────────────────────── -->
    <div v-else-if="filteredCourts.length === 0" class="text-center py-10 text-secondary">
      <Icon name="ph:court-basketball" class="w-16 h-16 mx-auto mb-4" />
      <p class="font-medium">Laukumi nav atrasti</p>
      <p v-if="authStore.isAdmin" class="text-sm mt-1">
        <NuxtLink to="/courts/add" class="text-primary hover:underline">Pievienot pirmo laukumu</NuxtLink>
      </p>
    </div>

    <!-- ── Courts list (sorted by distance) ─────────────────────────── -->
    <div v-else class="space-y-3">
      <!-- List header -->
      <div class="flex items-center justify-between text-sm text-secondary mb-1">
        <span>{{ filteredCourts.length }} laukumi</span>
        <span v-if="referencePoint" class="text-xs">
          {{ selectedCourt ? 'Attālums no izvēlētā laukuma' : 'Attālums no jūsu atrašanās vietas' }}
        </span>
      </div>

      <div
        v-for="court in sortedCourts"
        :key="court.court_id"
        class="w-full bg-surface rounded-xl border transition flex items-center gap-2 pr-2"
        :class="selectedCourt?.court_id === court.court_id
          ? 'border-primary ring-1 ring-primary/30'
          : 'border-secondary/20'"
      >
        <!-- Clickable area -->
        <button
          @click="selectCourt(court)"
          class="flex-1 text-left px-5 py-4 flex items-center justify-between gap-4 min-w-0 hover:bg-primary/5 rounded-xl transition"
        >
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ court.name }}</p>
            <p class="text-sm text-secondary truncate">{{ court.address }}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span
              :class="court.outdoor
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'"
              class="text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              <Icon :name="court.outdoor ? 'ph:sun' : 'ph:building'" class="w-3.5 h-3.5" />
            </span>
            <span
              v-if="court._distance != null"
              class="text-xs font-mono bg-secondary/10 text-secondary px-2 py-0.5 rounded-full"
            >
              {{ court._distance < 1 ? (court._distance * 1000).toFixed(0) + ' m' : court._distance.toFixed(1) + ' km' }}
            </span>
            <span v-else class="text-xs text-secondary/50">—</span>
          </div>
        </button>

        <!-- Admin edit/delete buttons -->
        <div v-if="authStore.isAdmin" class="flex items-center gap-1 shrink-0">
          <button
            @click.stop="openEditModal(court)"
            class="p-2 rounded-lg hover:bg-secondary/10 text-secondary hover:text-primary transition"
            title="Rediģēt"
          >
            <Icon name="ph:pencil" class="w-4 h-4" />
          </button>
          <button
            @click.stop="openDeleteConfirm(court)"
            class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary hover:text-red-500 transition"
            title="Dzēst"
          >
            <Icon name="ph:trash" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Edit modal ─────────────────────────────────────────────────── -->
    <div
      v-if="editModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
      @click.self="editModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button @click="editModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>

        <h2 class="font-bold text-lg mb-5">Rediģēt laukumu</h2>

        <div v-if="editModal.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-xl px-3 py-2 text-sm mb-4">
          {{ editModal.error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nosaukums <span class="text-red-500">*</span></label>
            <input v-model="editModal.form.name" type="text" required
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Adrese</label>
            <input v-model="editModal.form.address" type="text"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Veids</label>
            <div class="flex gap-3">
              <button type="button" @click="editModal.form.outdoor = false"
                :class="!editModal.form.outdoor ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300' : 'border-secondary/30 text-secondary'"
                class="inline-flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl border text-sm font-medium transition"><Icon name="ph:building" class="w-4 h-4" /> Iekštelpas</button>
              <button type="button" @click="editModal.form.outdoor = true"
                :class="editModal.form.outdoor ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300' : 'border-secondary/30 text-secondary'"
                class="inline-flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl border text-sm font-medium transition"><Icon name="ph:sun" class="w-4 h-4" /> Ārtelpas</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1">Platuma grādi</label>
              <input v-model.number="editModal.form.latitude" type="number" step="any" placeholder="56.9496"
                class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Garuma grādi</label>
              <input v-model.number="editModal.form.longitude" type="number" step="any" placeholder="24.1052"
                class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Kartes saite <span class="text-secondary text-xs">(pēc izvēles)</span></label>
            <input v-model="editModal.form.url" type="url"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="saveCourtEdit" :disabled="editModal.saving"
            class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition">
            <span v-if="editModal.saving">Saglabā...</span>
            <span v-else>Saglabāt</span>
          </button>
          <button @click="editModal.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">
            Atcelt
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete confirmation modal ──────────────────────────────────── -->
    <div
      v-if="deleteConfirm.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
      @click.self="deleteConfirm.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 relative">
        <button @click="deleteConfirm.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>
        <p class="font-semibold mb-1">Dzēst laukumu?</p>
        <p class="text-sm text-secondary mb-5">„{{ deleteConfirm.court?.name }}" tiks neatgriezeniski dzēsts.</p>
        <div class="flex gap-3">
          <button @click="deleteCourt" :disabled="deleteConfirm.loading"
            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition">
            <span v-if="deleteConfirm.loading">Dzēš...</span>
            <span v-else>Dzēst</span>
          </button>
          <button @click="deleteConfirm.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">
            Atcelt
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

// Load Leaflet CSS from CDN — avoids a hard build-time dependency on the npm package
useHead({
  link: [{ rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }],
})

const supabase = useSupabase()
const authStore = useAuthStore()

// ─── State ─────────────────────────────────────────────────────────────────

const courts = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCourt = ref(null)
const userLocation = ref(null)   // { lat, lng } from GPS
const referencePoint = ref(null) // { lat, lng } used for distance sorting

// Leaflet map instance and markers (not reactive — managed imperatively)
let map         = null
let markers     = []
let L           = null
let tileLayer   = null
let darkObserver = null

// ─── Computed ──────────────────────────────────────────────────────────────

const filteredCourts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return courts.value
  return courts.value.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.address?.toLowerCase().includes(q)
  )
})

// Haversine formula — returns distance in km between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const sortedCourts = computed(() => {
  const ref = referencePoint.value
  return [...filteredCourts.value]
    .map(c => {
      const hasCoords = c.latitude != null && c.longitude != null
      const dist = (ref && hasCoords)
        ? haversine(ref.lat, ref.lng, c.latitude, c.longitude)
        : null
      return { ...c, _distance: dist }
    })
    .sort((a, b) => {
      if (a._distance == null && b._distance == null) return a.name.localeCompare(b.name)
      if (a._distance == null) return 1
      if (b._distance == null) return -1
      return a._distance - b._distance
    })
})

// ─── Actions ───────────────────────────────────────────────────────────────

// ─── Admin Edit / Delete ────────────────────────────────────────────────────

const editModal = reactive({
  show: false, saving: false, error: '',
  courtId: null,
  form: { name: '', address: '', outdoor: false, latitude: null, longitude: null, url: '' },
})

const deleteConfirm = reactive({ show: false, loading: false, court: null })

function openEditModal(court) {
  editModal.courtId = court.court_id
  editModal.form = {
    name:      court.name || '',
    address:   court.address || '',
    outdoor:   court.outdoor ?? false,
    latitude:  court.latitude ?? null,
    longitude: court.longitude ?? null,
    url:       court.url || '',
  }
  editModal.error = ''
  editModal.show = true
}

async function saveCourtEdit() {
  if (!editModal.form.name.trim()) { editModal.error = 'Nosaukums ir obligāts.'; return }
  editModal.saving = true
  editModal.error = ''
  const { error } = await supabase.from('courts').update({
    name:      editModal.form.name.trim(),
    address:   editModal.form.address.trim() || null,
    outdoor:   editModal.form.outdoor,
    latitude:  editModal.form.latitude || null,
    longitude: editModal.form.longitude || null,
    url:       editModal.form.url.trim() || null,
  }).eq('court_id', editModal.courtId)

  if (error) { editModal.error = error.message; editModal.saving = false; return }

  // Refresh local list
  const idx = courts.value.findIndex(c => c.court_id === editModal.courtId)
  if (idx !== -1) {
    courts.value[idx] = { ...courts.value[idx], ...editModal.form }
    if (selectedCourt.value?.court_id === editModal.courtId) {
      selectedCourt.value = courts.value[idx]
    }
  }
  editModal.saving = false
  editModal.show = false
  drawMarkers()
}

function openDeleteConfirm(court) {
  deleteConfirm.court = court
  deleteConfirm.loading = false
  deleteConfirm.show = true
}

async function deleteCourt() {
  deleteConfirm.loading = true
  await supabase.from('courts').delete().eq('court_id', deleteConfirm.court.court_id)
  courts.value = courts.value.filter(c => c.court_id !== deleteConfirm.court.court_id)
  if (selectedCourt.value?.court_id === deleteConfirm.court.court_id) selectedCourt.value = null
  deleteConfirm.show = false
  deleteConfirm.loading = false
  drawMarkers()
}

function selectCourt(court) {
  selectedCourt.value = court
  if (court.latitude != null && court.longitude != null) {
    referencePoint.value = { lat: court.latitude, lng: court.longitude }
    // Pan the map to this court and open its popup
    if (map) {
      map.setView([court.latitude, court.longitude], 14)
      const marker = markers.find(m => m._courtId === court.court_id)
      if (marker) marker.openPopup()
    }
  }
}

function drawMarkers() {
  if (!map || !L) return
  // Remove existing markers
  markers.forEach(m => m.remove())
  markers = []

  filteredCourts.value.forEach(court => {
    if (court.latitude == null || court.longitude == null) return

    const marker = L.marker([court.latitude, court.longitude])
      .addTo(map)
      .bindPopup(`<strong>${court.name}</strong>`)

    marker._courtId = court.court_id
    marker.on('click', () => selectCourt(court))
    markers.push(marker)
  })
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

onMounted(async () => {
  // 1. Load courts from Supabase
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .order('name', { ascending: true })

  if (!error) courts.value = data || []
  loading.value = false

  // 2. Initialize Leaflet (dynamic import — avoids SSR crash)
  L = (await import('leaflet')).default

  // Fix default marker icon URLs broken by Vite's asset bundling
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  // 3. Create map centered on Latvia
  map = L.map('courts-map').setView([56.95, 24.11], 7)

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

  // 4. Request GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        // Only use GPS as reference if the user hasn't clicked a court yet
        if (!referencePoint.value) {
          referencePoint.value = userLocation.value
        }
      },
      () => { /* GPS denied or unavailable — sort alphabetically */ }
    )
  }
})

onUnmounted(() => {
  darkObserver?.disconnect()
  map?.remove()
})

// Redraw markers whenever the search filter changes
watch(filteredCourts, () => {
  drawMarkers()
})
</script>
