<template>
  <!--
    AppNavbar.vue
    Top navigation bar. Contains: logo, nav links, notification bell (logged-in),
    dark mode toggle, login/logout button.
  -->
  <nav class="bg-surface border-b border-secondary/20 shadow-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">

      <!-- ── Brand ──────────────────────────────────────────────────── -->
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-primary">
        <span class="text-2xl">🏀</span>
        <span class="hidden sm:inline">Basketbols</span>
      </NuxtLink>

      <!-- ── Nav Links ──────────────────────────────────────────────── -->
      <div class="flex items-center gap-1 sm:gap-4">
        <NuxtLink
          to="/teams"
          class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
        >
          Komandas
        </NuxtLink>

        <NuxtLink
          to="/courts"
          class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
        >
          Laukumi
        </NuxtLink>

        <template v-if="authStore.isLoggedIn">
          <NuxtLink
            to="/games"
            class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            active-class="text-primary font-semibold"
          >
            Spēles
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            active-class="text-primary font-semibold"
          >
            Profils
          </NuxtLink>

          <NuxtLink
            v-if="authStore.isAdmin"
            to="/admin/users"
            class="text-sm font-medium px-2 py-1 rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
            active-class="text-red-600 font-semibold"
          >
            Admins
          </NuxtLink>
        </template>
      </div>

      <!-- ── Right side ─────────────────────────────────────────────── -->
      <div class="flex items-center gap-2">

        <!-- Notification bell (logged-in users only) -->
        <div v-if="authStore.isLoggedIn" ref="bellRef" class="relative">
          <button
            @click="toggleBell"
            class="relative p-2 rounded-full hover:bg-secondary/10 transition-colors"
            aria-label="Paziņojumi"
          >
            <span class="text-xl">🔔</span>
            <!-- Unread badge -->
            <span
              v-if="unreadCount > 0"
              class="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Dropdown -->
          <div
            v-if="bellOpen"
            class="absolute right-0 top-full mt-2 w-80 bg-surface border border-secondary/20 rounded-2xl shadow-xl z-[1000] overflow-hidden"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-secondary/10">
              <span class="font-semibold text-sm">Paziņojumi</span>
              <button
                v-if="unreadCount > 0"
                @click="markAllRead"
                class="text-xs text-primary hover:underline"
              >
                Atzīmēt visas kā lasītas
              </button>
            </div>

            <!-- Notification list -->
            <div class="max-h-80 overflow-y-auto">
              <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-sm text-secondary">
                Nav jaunu paziņojumu
              </div>

              <div
                v-for="n in notifications"
                :key="n.notification_id"
                class="px-4 py-3 border-b border-secondary/10 last:border-0 transition"
                :class="n.read ? 'opacity-60' : 'bg-primary/5'"
              >
                <p class="text-sm">{{ notifMessage(n) }}</p>
                <p class="text-xs text-secondary mt-0.5">{{ timeAgo(n.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Dark mode toggle -->
        <button
          @click="toggleDarkMode"
          class="p-2 rounded-full hover:bg-secondary/10 transition-colors"
          :title="isDark ? 'Gaišais režīms' : 'Tumšais režīms'"
          aria-label="Pārslēgt tumšo režīmu"
        >
          <span v-if="isDark" class="text-xl">☀️</span>
          <span v-else class="text-xl">🌙</span>
        </button>

        <!-- Auth buttons -->
        <template v-if="!authStore.loading">
          <button
            v-if="authStore.isLoggedIn"
            @click="handleLogout"
            class="text-sm font-medium px-3 py-1.5 rounded border border-secondary/30 hover:bg-secondary/10 transition-colors"
          >
            Izrakstīties
          </button>
          <NuxtLink
            v-else
            to="/auth/login"
            class="text-sm font-medium px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Pieteikties
          </NuxtLink>
        </template>

      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router    = useRouter()
const supabase  = useSupabase()

// ─── Dark Mode ──────────────────────────────────────────────────────────────

const isDark = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }

  if (authStore.isLoggedIn) fetchNotifications()
})

function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('darkMode', String(isDark.value))
}

// ─── Logout ─────────────────────────────────────────────────────────────────

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}

// ─── Notifications ──────────────────────────────────────────────────────────

const notifications = ref([])
const bellOpen      = ref(false)
const bellRef       = ref(null)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

async function fetchNotifications() {
  if (!authStore.user?.id) return
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', authStore.user.id)
    .order('created_at', { ascending: false })
    .limit(30)
  notifications.value = data || []
}

function toggleBell() {
  bellOpen.value = !bellOpen.value
  if (bellOpen.value) fetchNotifications()
}

async function markAllRead() {
  if (!authStore.user?.id) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', authStore.user.id)
    .eq('read', false)
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
}

// Close dropdown when clicking outside
function handleOutsideClick(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    bellOpen.value = false
  }
}

watch(bellOpen, (val) => {
  if (val) document.addEventListener('click', handleOutsideClick)
  else     document.removeEventListener('click', handleOutsideClick)
})

// ─── Notification message helpers ───────────────────────────────────────────

function notifMessage(n) {
  const p = n.payload || {}
  switch (n.type) {
    case 'challenge_received':
      return `📨 Jauns izaicinājums no ${p.challenger_team_name || 'komandas'}`
    case 'challenge_canceled':
      return `❌ Izaicinājums atcelts — nepietiek spēlētāju`
    case 'challenge_accepted':
      return `✅ Izaicinājums apstiprināts — spēle ${p.scheduled_at ? formatShortDate(p.scheduled_at) : ''}`
    case 'score_mismatch':
      return `⚠️ Rezultāti nesakrita — ievadiet no jauna`
    case 'game_completed':
      return `🏆 Spēle pabeigta: ${p.score || ''}`
    default:
      return `🔔 Jauns paziņojums`
  }
}

function formatShortDate(ts) {
  return new Date(ts).toLocaleDateString('lv-LV', { day: 'numeric', month: 'short' })
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Tikko'
  if (mins < 60)  return `pirms ${mins} min.`
  if (hours < 24) return `pirms ${hours} st.`
  return `pirms ${days} d.`
}
</script>
