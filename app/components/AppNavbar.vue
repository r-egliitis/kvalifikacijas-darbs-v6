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
        <Icon name="ph:basketball" class="w-7 h-7" />
        <span class="hidden sm:inline">Basketbols</span>
      </NuxtLink>

      <!-- ── Nav Links ──────────────────────────────────────────────── -->
      <div class="flex items-center gap-1 sm:gap-4">
        <NuxtLink
          to="/"
          class="text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
          active-class="text-primary font-semibold"
        >
          Sākums
        </NuxtLink>

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
            <Icon name="ph:bell" class="w-5 h-5" />
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

              <!-- Pending team invites -->
              <template v-if="pendingInvites.length > 0">
                <div class="px-4 py-2 bg-accent/5 border-b border-secondary/10">
                  <span class="text-xs font-semibold text-accent uppercase tracking-wide">Komandas uzaicinājumi</span>
                </div>
                <div
                  v-for="invite in pendingInvites"
                  :key="invite.invitation_id"
                  class="px-4 py-3 border-b border-secondary/10"
                >
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <NuxtLink
                      :to="`/teams/${invite.team_id}`"
                      @click="bellOpen = false"
                      class="font-semibold text-primary hover:underline text-sm"
                    >
                      {{ invite.team?.name || '—' }}
                    </NuxtLink>
                    <span
                      v-if="invite.team?.age_group"
                      class="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full"
                    >
                      {{ invite.team.age_group }}
                    </span>
                  </div>
                  <p v-if="inviteErrors[invite.invitation_id]" class="text-red-500 text-xs mb-2">
                    {{ inviteErrors[invite.invitation_id] }}
                  </p>
                  <div class="flex gap-2">
                    <button
                      @click="acceptInvite(invite)"
                      class="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 rounded-lg transition"
                    >
                      Pieņemt
                    </button>
                    <button
                      @click="declineInvite(invite)"
                      class="flex-1 text-xs bg-secondary/10 hover:bg-secondary/20 font-semibold py-1.5 rounded-lg transition"
                    >
                      Noraidīt
                    </button>
                  </div>
                </div>
              </template>

              <!-- Regular notifications -->
              <div v-if="notifications.length === 0 && pendingInvites.length === 0" class="px-4 py-6 text-center text-sm text-secondary">
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
          <Icon v-if="isDark" name="ph:sun" class="w-5 h-5" />
          <Icon v-else name="ph:moon" class="w-5 h-5" />
        </button>

        <!-- Auth buttons -->
        <template v-if="!authStore.loading">
          <!-- Logged-in: avatar button with dropdown -->
          <div v-if="authStore.isLoggedIn" ref="profileRef" class="relative" @mouseenter="openProfileMenu" @mouseleave="closeProfileMenu">
            <button
              @click="toggleProfileMenu"
              class="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-colors focus:outline-none"
              aria-label="Profila izvēlne"
            >
              <img
                v-if="authStore.profile?.avatar_url"
                :src="authStore.profile.avatar_url"
                class="w-full h-full object-cover"
                alt="Profils"
              />
              <div
                v-else
                class="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
              >
                {{ authStore.profile?.full_name?.charAt(0)?.toUpperCase() || authStore.user?.email?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </button>

            <!-- Profile dropdown (pt-2 bridges the gap so mouseleave doesn't fire mid-transit) -->
            <div v-if="profileMenuOpen" class="absolute right-0 top-full pt-2 w-44 z-[1000]">
            <div class="bg-surface border border-secondary/20 rounded-2xl shadow-xl overflow-hidden">
              <NuxtLink
                to="/profile"
                @click="profileMenuOpen = false"
                class="flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Icon name="ph:user" class="w-4 h-4" /> Profils
              </NuxtLink>
              <hr class="border-secondary/10" />
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Icon name="ph:door" class="w-4 h-4" /> Izrakstīties
              </button>
            </div>
            </div>
          </div>

          <!-- Guest: login button -->
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

  isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches

  if (authStore.isLoggedIn) {
    fetchNotifications()
    fetchInvites()
  }
})

function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('darkMode', String(isDark.value))
}

// ─── Logout ─────────────────────────────────────────────────────────────────

async function handleLogout() {
  profileMenuOpen.value = false
  await authStore.logout()
  router.push('/')
}

// ─── Profile dropdown ───────────────────────────────────────────────────────

const profileMenuOpen = ref(false)
const profileRef      = ref(null)
const isTouchDevice   = ref(false)

// Desktop: hover opens/closes
function openProfileMenu()  { if (!isTouchDevice.value) profileMenuOpen.value = true }
function closeProfileMenu() { if (!isTouchDevice.value) profileMenuOpen.value = false }

// Mobile: click toggles
function toggleProfileMenu() {
  if (isTouchDevice.value) profileMenuOpen.value = !profileMenuOpen.value
}

function handleProfileOutsideClick(e) {
  if (profileRef.value && !profileRef.value.contains(e.target)) {
    profileMenuOpen.value = false
  }
}

// Click-outside only needed on touch (hover handles close on desktop)
watch(profileMenuOpen, (val) => {
  if (!isTouchDevice.value) return
  if (val) document.addEventListener('click', handleProfileOutsideClick)
  else     document.removeEventListener('click', handleProfileOutsideClick)
})

// ─── Notifications ──────────────────────────────────────────────────────────

const notifications  = ref([])
const pendingInvites = ref([])
const inviteErrors   = reactive({})
const bellOpen       = ref(false)
const bellRef        = ref(null)

const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length + pendingInvites.value.length
)

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

async function fetchInvites() {
  if (!authStore.user?.id) return
  const { data } = await supabase
    .from('team_invitations')
    .select('invitation_id, team_id, status, team:teams(name, age_group)')
    .eq('invitee_profile_id', authStore.user.id)
    .eq('status', 'pending')
  pendingInvites.value = data || []
}

async function acceptInvite(invite) {
  delete inviteErrors[invite.invitation_id]
  if (authStore.profile?.current_team) {
    inviteErrors[invite.invitation_id] = 'Vispirms atstājiet esošo komandu.'
    return
  }
  // Enforce 10-player roster limit at accept time
  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', invite.team_id)
  if (memberCount >= 10) {
    inviteErrors[invite.invitation_id] = 'Komanda ir pilna (maks. 10 spēlētāji).'
    return
  }

  const { error } = await supabase
    .from('team_members')
    .insert({ team_id: invite.team_id, profile_id: authStore.user.id, role: 'player' })
  if (error) { inviteErrors[invite.invitation_id] = 'Neizdevās pievienoties.'; return }
  await supabase.from('profiles').update({ current_team: invite.team_id }).eq('profile_id', authStore.user.id)
  await supabase.from('team_invitations').update({ status: 'accepted' }).eq('invitation_id', invite.invitation_id)
  await authStore.fetchProfile()
  await fetchInvites()
  bellOpen.value = false
}

async function declineInvite(invite) {
  await supabase
    .from('team_invitations')
    .update({ status: 'declined' })
    .eq('invitation_id', invite.invitation_id)
  await fetchInvites()
}

function toggleBell() {
  bellOpen.value = !bellOpen.value
  if (bellOpen.value) {
    fetchNotifications()
    fetchInvites()
  }
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
      return `Jauns izaicinājums no ${p.challenger_team_name || 'komandas'}`
    case 'challenge_canceled':
      return `Izaicinājums atcelts — nepietiek spēlētāju`
    case 'challenge_accepted':
      return `Izaicinājums apstiprināts — spēle ${p.scheduled_at ? formatShortDate(p.scheduled_at) : ''}`
    case 'score_mismatch':
      return `Rezultāti nesakrita — ievadiet no jauna`
    case 'game_completed':
      return `Spēle pabeigta: ${p.score || ''}`
    default:
      return `Jauns paziņojums`
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
