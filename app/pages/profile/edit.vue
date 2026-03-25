<template>
  <!--
    pages/profile/edit.vue
    Profile edit page — the user can update all their personal details
    and upload a profile photo to Supabase Storage.
    This page is protected (requires login).
  -->
  <div class="max-w-2xl mx-auto px-4 py-10">

    <h1 class="text-2xl font-bold mb-6">Rediģēt profilu</h1>

    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSave" class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6 space-y-5">

      <!-- ── Profile Photo Upload ──────────────────────────────────────── -->
      <div class="flex flex-col items-center gap-3">

        <!-- Current photo preview -->
        <img
          v-if="photoPreview || form.picture"
          :src="photoPreview || form.picture"
          alt="Profilbilde"
          class="w-24 h-24 rounded-full object-cover border-4 border-surface shadow"
        />
        <div
          v-else
          class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl border-4 border-surface shadow"
        >
          🙋
        </div>

        <!-- File input for photo upload -->
        <label class="cursor-pointer text-sm text-primary font-medium hover:underline">
          Ielādēt attēlu
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="handlePhotoSelect"
          />
        </label>
        <p class="text-xs text-secondary">JPG, PNG, vai WebP · maks. 5 MB</p>
      </div>

      <!-- Divider -->
      <hr class="border-secondary/10" />

      <!-- ── Personal Details ──────────────────────────────────────────── -->

      <!-- First name -->
      <div>
        <label class="block text-sm font-medium mb-1">Vārds</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Jānis"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- Last name -->
      <div>
        <label class="block text-sm font-medium mb-1">Uzvārds</label>
        <input
          v-model="form.surname"
          type="text"
          placeholder="Bērziņš"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- Nickname -->
      <div>
        <label class="block text-sm font-medium mb-1">Segvārds</label>
        <input
          v-model="form.nickname"
          type="text"
          placeholder="BK23"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- Birthday -->
      <div>
        <label class="block text-sm font-medium mb-1">Dzimšanas datums</label>
        <input
          v-model="form.birthday"
          type="date"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- Jersey number -->
      <div>
        <label class="block text-sm font-medium mb-1">Krekla numurs</label>
        <input
          v-model.number="form.number"
          type="number"
          min="0"
          max="99"
          placeholder="23"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- ── Action Buttons ────────────────────────────────────────────── -->
      <div class="flex gap-3 pt-2">

        <!-- Save button -->
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span v-if="saving">Saglabā...</span>
          <span v-else>Saglabāt</span>
        </button>

        <!-- Cancel button — go back to profile view -->
        <NuxtLink
          to="/profile"
          class="flex-1 text-center border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
        >
          Atcelt
        </NuxtLink>

      </div>

    </form>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// Require login to view this page
definePageMeta({ middleware: 'auth' })

const supabase = useSupabase()

const authStore = useAuthStore()
const router = useRouter()

// UI state
const saving = ref(false)
const errorMessage = ref('')

// The selected photo file (before upload)
const selectedPhoto = ref(null)
// A local preview URL for the photo (shown before upload)
const photoPreview = ref(null)

// form: reactive object that mirrors the profile table columns
// Pre-filled from the current profile in the auth store
const form = reactive({
  name:     authStore.profile?.name     || '',
  surname:  authStore.profile?.surname  || '',
  nickname: authStore.profile?.nickname || '',
  birthday: authStore.profile?.birthday || '',
  number:   authStore.profile?.number   ?? '',
  picture:  authStore.profile?.picture  || '',
})

// handlePhotoSelect: called when the user picks a photo file
function handlePhotoSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Attēls ir pārāk liels. Maksimālais izmērs ir 5 MB.'
    return
  }

  selectedPhoto.value = file

  // Create a local preview URL so the user sees the new photo immediately
  photoPreview.value = URL.createObjectURL(file)
}

// handleSave: saves the profile to the database (and uploads photo if selected)
async function handleSave() {
  saving.value = true
  errorMessage.value = ''

  try {
    let pictureUrl = form.picture

    // ── Step 1: Upload photo to Supabase Storage if a new one was selected ──
    if (selectedPhoto.value) {
      const userId = authStore.user.id
      // Create a unique filename using the user's ID + timestamp
      const fileName = `${userId}-${Date.now()}.${selectedPhoto.value.name.split('.').pop()}`

      // Upload the file to the 'avatars' bucket in Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedPhoto.value, {
          upsert: true, // overwrite if a file with this name already exists
        })

      if (uploadError) throw new Error('Neizdevās augšupielādēt attēlu.')

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      pictureUrl = urlData.publicUrl
    }

    // ── Step 2: Save the profile row in the database ────────────────────
    // We use upsert() instead of update() because:
    // - update() silently does nothing (no error) if the row doesn't exist
    // - upsert() creates the row if missing, or updates it if it exists
    // profile_id must be included in the payload so Supabase knows which row to match.
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        profile_id: authStore.user.id,
        name:       form.name     || null,
        surname:    form.surname  || null,
        nickname:   form.nickname || null,
        birthday:   form.birthday || null,
        number:     form.number   !== '' ? form.number : null,
        picture:    pictureUrl    || null,
      }, { onConflict: 'profile_id' })

    if (updateError) throw new Error('Neizdevās saglabāt profilu.')

    // ── Step 3: Refresh the profile in the auth store ───────────────────
    await authStore.fetchProfile()

    // Redirect to the profile page with a ?saved=true query param
    // The profile page reads this param and shows a success banner
    router.push('/profile?saved=true')

  } catch (error) {
    errorMessage.value = error.message || 'Kļūda. Mēģiniet vēlreiz.'
  } finally {
    saving.value = false
  }
}
</script>
