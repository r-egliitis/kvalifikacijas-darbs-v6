<template>
  <!--
    pages/admin/users.vue
    Admin-only page for managing all user profiles.
    Allows editing profile info, deleting accounts, and granting/revoking admin role.
  -->
  <div class="max-w-5xl mx-auto px-4 py-10">

    <!-- Access denied -->
    <div v-if="!authStore.isAdmin" class="text-center py-16 text-secondary">
      <Icon name="ph:lock" class="w-16 h-16 mx-auto mb-4" />
      <p class="font-medium">Piekļuve liegta</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Lietotāji</h1>
        <span class="text-sm text-secondary">{{ filteredProfiles.length }} / {{ profiles.length }}</span>
      </div>

      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Meklēt pēc vārda, ID..."
        class="w-full px-4 py-2.5 rounded-xl border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition mb-6"
      />

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16 text-secondary">
        <Icon name="ph:hourglass" class="w-12 h-12 mx-auto mb-3" />
        <p>Ielādē...</p>
      </div>

      <!-- User list -->
      <div v-else class="space-y-2">
        <div
          v-for="p in filteredProfiles"
          :key="p.profile_id"
          class="bg-surface rounded-2xl border border-secondary/10 shadow-sm px-4 py-3 flex items-center gap-3"
        >
          <!-- Avatar -->
          <img v-if="p.picture" :src="p.picture"
            class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div v-else class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon name="ph:user" class="w-5 h-5 text-primary/50" /></div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">
              {{ p.name }} {{ p.surname }}
              <span v-if="p.nickname" class="text-secondary font-normal">„{{ p.nickname }}"</span>
              <span v-if="p.is_admin" class="ml-1.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-semibold px-1.5 py-0.5 rounded-full">Admin</span>
            </p>
            <p class="text-xs text-secondary">{{ p.visual_id || '—' }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <!-- Edit -->
            <button @click="openEditProfile(p)"
              class="p-2 rounded-lg hover:bg-secondary/10 text-secondary hover:text-primary transition text-sm"
              title="Rediģēt"><Icon name="ph:pencil" class="w-4 h-4" /></button>
            <!-- Grant/revoke admin -->
            <button
              @click="openAdminConfirm(p)"
              :disabled="adminToggleLoading === p.profile_id"
              class="p-2 rounded-lg hover:bg-secondary/10 transition text-sm"
              :class="p.is_admin ? 'text-red-500 hover:text-red-600' : 'text-secondary hover:text-amber-500'"
              :title="p.is_admin ? 'Atņemt admina tiesības' : 'Piešķirt admina tiesības'"
            ><Icon name="ph:crown" class="w-4 h-4" /></button>
            <!-- Delete -->
            <button @click="openDeleteProfile(p)"
              class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary hover:text-red-500 transition"
              title="Dzēst"><Icon name="ph:trash" class="w-4 h-4" /></button>
          </div>
        </div>

        <p v-if="filteredProfiles.length === 0 && !loading" class="text-center text-secondary py-8">
          Nav atrasts neviens lietotājs.
        </p>
      </div>
    </template>

    <!-- ── Edit Profile modal ────────────────────────────────────────────── -->
    <div
      v-if="editModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="editModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button @click="editModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>
        <h3 class="font-bold text-lg mb-5">Rediģēt profilu</h3>
        <p v-if="editModal.error" class="text-red-500 text-sm mb-4">{{ editModal.error }}</p>

        <div class="space-y-4">
          <!-- Picture -->
          <div>
            <label class="block text-sm font-medium mb-2">Foto</label>
            <div class="flex items-center gap-4">
              <img v-if="editModal.previewUrl || editModal.currentPicture"
                :src="editModal.previewUrl || editModal.currentPicture"
                class="w-14 h-14 rounded-full object-cover border border-secondary/20 flex-shrink-0" />
              <div v-else class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon name="ph:user" class="w-7 h-7 text-primary/50" /></div>
              <div class="flex flex-col gap-1.5">
                <label class="cursor-pointer text-sm text-primary font-medium hover:underline">
                  Mainīt foto
                  <input type="file" accept="image/*" class="hidden" @change="handleEditPicSelect" />
                </label>
                <button v-if="editModal.currentPicture || editModal.newFile"
                  @click="editModal.newFile = null; editModal.previewUrl = null; editModal.currentPicture = null; editModal.removePicture = true"
                  class="text-sm text-red-500 font-medium hover:underline text-left">Noņemt foto</button>
              </div>
            </div>
          </div>
          <!-- Name fields -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium mb-1">Vārds</label>
              <input v-model="editModal.name" type="text"
                class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Uzvārds</label>
              <input v-model="editModal.surname" type="text"
                class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Segvārds</label>
            <input v-model="editModal.nickname" type="text"
              class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Numurs</label>
            <input v-model.number="editModal.number" type="number" min="0" max="99"
              class="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition" />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="saveEditProfile" :disabled="editModal.saving"
            class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition">
            <span v-if="editModal.saving">Saglabā...</span><span v-else>Saglabāt</span>
          </button>
          <button @click="editModal.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">Atcelt</button>
        </div>
      </div>
    </div>

    <!-- ── Admin toggle confirm modal ──────────────────────────────────── -->
    <div
      v-if="adminConfirm.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="adminConfirm.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 relative">
        <button @click="adminConfirm.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>
        <p class="font-semibold mb-2">
          {{ adminConfirm.profile?.is_admin ? 'Atņemt admina tiesības?' : 'Piešķirt admina tiesības?' }}
        </p>
        <p class="text-sm text-secondary mb-5">
          {{ adminConfirm.profile?.name }} {{ adminConfirm.profile?.surname }}
          ({{ adminConfirm.profile?.visual_id }})
        </p>
        <p v-if="adminConfirm.error" class="text-red-500 text-sm mb-3">{{ adminConfirm.error }}</p>
        <div class="flex gap-3">
          <button
            @click="confirmToggleAdmin"
            :disabled="adminToggleLoading === adminConfirm.profile?.profile_id"
            class="flex-1 font-semibold py-2.5 rounded-xl disabled:opacity-50 transition text-white"
            :class="adminConfirm.profile?.is_admin ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'"
          >
            <span v-if="adminToggleLoading === adminConfirm.profile?.profile_id">...</span>
            <span v-else>{{ adminConfirm.profile?.is_admin ? 'Atņemt' : 'Piešķirt' }}</span>
          </button>
          <button @click="adminConfirm.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">Atcelt</button>
        </div>
      </div>
    </div>

    <!-- ── Delete Profile modal ──────────────────────────────────────────── -->
    <div
      v-if="deleteModal.show"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      @click.self="deleteModal.show = false"
    >
      <div class="bg-surface rounded-2xl shadow-xl w-full max-w-xs p-6 relative">
        <button @click="deleteModal.show = false"
          class="absolute top-4 right-4 text-secondary hover:text-app-text text-xl leading-none">✕</button>
        <p class="font-semibold mb-1">Dzēst kontu?</p>
        <p class="text-sm text-secondary mb-5">
          {{ deleteModal.profile?.name }} {{ deleteModal.profile?.surname }} ({{ deleteModal.profile?.visual_id }}) tiks neatgriezeniski dzēsts.
        </p>
        <p v-if="deleteModal.error" class="text-red-500 text-sm mb-3">{{ deleteModal.error }}</p>
        <div class="flex gap-3">
          <button @click="confirmDeleteProfile" :disabled="deleteModal.loading"
            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition">
            <span v-if="deleteModal.loading">Dzēš...</span><span v-else>Dzēst</span>
          </button>
          <button @click="deleteModal.show = false"
            class="flex-1 border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition">Atcelt</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const supabase  = useSupabase()
const authStore = useAuthStore()

// ─── State ─────────────────────────────────────────────────────────────────

const profiles   = ref([])
const loading    = ref(true)
const searchQuery = ref('')

const adminToggleLoading = ref(null) // profile_id currently being toggled

// ─── Computed ──────────────────────────────────────────────────────────────

const filteredProfiles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return profiles.value
  return profiles.value.filter(p =>
    [p.name, p.surname, p.nickname, p.visual_id]
      .filter(Boolean).some(v => v.toLowerCase().includes(q))
  )
})

// ─── Data fetching ─────────────────────────────────────────────────────────

onMounted(async () => {
  if (!authStore.isAdmin) { loading.value = false; return }
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  profiles.value = data || []
  loading.value  = false
})

// ─── Edit Profile modal ────────────────────────────────────────────────────

const editModal = reactive({
  show: false, saving: false, error: '',
  profileId: null,
  name: '', surname: '', nickname: '', number: null,
  currentPicture: null, removePicture: false, newFile: null, previewUrl: null,
})

function openEditProfile(p) {
  Object.assign(editModal, {
    show: true, saving: false, error: '',
    profileId:      p.profile_id,
    name:     p.name     || '',
    surname:  p.surname  || '',
    nickname: p.nickname || '',
    number:   p.number   ?? null,
    currentPicture: p.picture  || null,
    removePicture: false, newFile: null, previewUrl: null,
  })
}

function handleEditPicSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  editModal.newFile       = file
  editModal.removePicture = false
  editModal.previewUrl    = URL.createObjectURL(file)
}

async function saveEditProfile() {
  editModal.error = ''
  if (!editModal.name.trim()) { editModal.error = 'Vārds ir obligāts.'; return }
  editModal.saving = true
  try {
    const payload = {
      name:     editModal.name.trim()     || null,
      surname:  editModal.surname.trim()  || null,
      nickname: editModal.nickname.trim() || null,
      number:   Number.isFinite(editModal.number) ? editModal.number : null,
    }
    if (editModal.removePicture && !editModal.newFile) {
      payload.picture = null
    } else if (editModal.newFile) {
      const file = editModal.newFile
      const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadErr) throw new Error('Neizdevās augšupielādēt foto.')
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      payload.picture = urlData.publicUrl
    }
    const { error } = await supabase.from('profiles').update(payload).eq('profile_id', editModal.profileId)
    if (error) throw new Error(error.message)
    const idx = profiles.value.findIndex(p => p.profile_id === editModal.profileId)
    if (idx !== -1) profiles.value[idx] = { ...profiles.value[idx], ...payload }
    editModal.show = false
  } catch (err) {
    editModal.error = err.message || 'Kļūda.'
  } finally {
    editModal.saving = false
  }
}

// ─── Delete Profile modal ──────────────────────────────────────────────────

const deleteModal = reactive({
  show: false, loading: false, error: '',
  profile: null,
})

function openDeleteProfile(p) {
  Object.assign(deleteModal, { show: true, loading: false, error: '', profile: p })
}

async function confirmDeleteProfile() {
  deleteModal.loading = true
  deleteModal.error   = ''
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/delete-user', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ targetUserId: deleteModal.profile.profile_id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message || 'Neizdevās dzēst kontu.')
    }
    profiles.value = profiles.value.filter(p => p.profile_id !== deleteModal.profile.profile_id)
    deleteModal.show = false
  } catch (err) {
    deleteModal.error = err.message || 'Kļūda.'
  } finally {
    deleteModal.loading = false
  }
}

// ─── Admin toggle ──────────────────────────────────────────────────────────

const adminConfirm = reactive({ show: false, profile: null, error: '' })

function openAdminConfirm(p) {
  Object.assign(adminConfirm, { show: true, profile: p, error: '' })
}

async function confirmToggleAdmin() {
  const p = adminConfirm.profile
  adminConfirm.error = ''
  adminToggleLoading.value = p.profile_id
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/set-admin-role', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ targetUserId: p.profile_id, makeAdmin: !p.is_admin }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message || 'Neizdevās mainīt lomu.')
    }
    const idx = profiles.value.findIndex(u => u.profile_id === p.profile_id)
    if (idx !== -1) profiles.value[idx].is_admin = !p.is_admin
    adminConfirm.show = false
  } catch (err) {
    adminConfirm.error = err.message
  } finally {
    adminToggleLoading.value = null
  }
}

useHead({ title: 'Lietotāji · Admins · Basketbols' })
</script>
