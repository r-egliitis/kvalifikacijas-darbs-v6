<template>
  <!--
    pages/teams/create.vue
    Form to create a new basketball team.
    The creator is automatically assigned as 'captain' in the team_members table.
    This page requires login.
  -->
  <div class="max-w-2xl mx-auto px-4 py-10">

    <h1 class="text-2xl font-bold mb-6">Izveidot komandu</h1>

    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleCreate" class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6 space-y-5">

      <!-- Team name (required) -->
      <div>
        <label class="block text-sm font-medium mb-1">
          Komandas nosaukums <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Rīgas Lāči"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- City -->
      <div>
        <label class="block text-sm font-medium mb-1">Pilsēta</label>
        <input
          v-model="form.city"
          type="text"
          placeholder="Rīga"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>

      <!-- Age group -->
      <div>
        <label class="block text-sm font-medium mb-1">Vecuma grupa</label>
        <select
          v-model="form.age_group"
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
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

      <!-- Bio / description -->
      <div>
        <label class="block text-sm font-medium mb-1">Apraksts</label>
        <textarea
          v-model="form.bio"
          rows="3"
          placeholder="Pastāsti par savu komandu..."
          class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
        />
      </div>

      <!-- Team logo upload -->
      <div>
        <label class="block text-sm font-medium mb-1">Komandas logo (pēc izvēles)</label>

        <!-- Preview -->
        <div class="flex items-center gap-4 mb-2">
          <img
            v-if="logoPreview"
            :src="logoPreview"
            alt="Logo priekšskatījums"
            class="w-16 h-16 rounded-xl object-cover border border-secondary/20"
          />
          <div v-else class="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center text-2xl">
            🏀
          </div>

          <label class="cursor-pointer text-sm text-primary font-medium hover:underline">
            Ielādēt attēlu
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleLogoSelect"
            />
          </label>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span v-if="saving">Izveido...</span>
          <span v-else>Izveidot komandu</span>
        </button>

        <NuxtLink
          to="/teams"
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

// Require login
definePageMeta({ middleware: 'auth' })

const supabase = useSupabase()

const authStore = useAuthStore()
const router = useRouter()

// Form data
const form = reactive({
  name:      '',
  city:      '',
  age_group: '',
  bio:       '',
})

// UI state
const saving = ref(false)
const errorMessage = ref('')
const selectedLogo = ref(null)
const logoPreview = ref(null)

// handleLogoSelect: preview the selected logo file
function handleLogoSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  selectedLogo.value = file
  logoPreview.value = URL.createObjectURL(file)
}

// handleCreate: submits the form, creates the team and captain membership
async function handleCreate() {
  if (!form.name.trim()) {
    errorMessage.value = 'Komandas nosaukums ir obligāts.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    let pictureUrl = null

    // ── Step 1: Upload team logo if provided ────────────────────────────
    if (selectedLogo.value) {
      const fileName = `team-${Date.now()}.${selectedLogo.value.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedLogo.value, { upsert: true })

      if (uploadError) throw new Error('Neizdevās augšupielādēt logo.')

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      pictureUrl = urlData.publicUrl
    }

    // ── Step 2: Insert the new team row ─────────────────────────────────
    // The team_id is auto-generated by the database sequence (e.g. T000001)
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        name:      form.name.trim(),
        city:      form.city.trim()      || null,
        age_group: form.age_group        || null,
        bio:       form.bio.trim()       || null,
        picture:   pictureUrl,
      })
      .select()
      .single()

    if (teamError) throw new Error('Neizdevās izveidot komandu.')

    // ── Step 3: Add the creator as captain in team_members ──────────────
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id:    newTeam.team_id,
        profile_id: authStore.user.id,
        role:       'captain',
      })

    if (memberError) throw new Error('Komanda izveidota, bet neizdevās pievienot kā kapteinim.')

    // ── Step 4: Update the user's current_team in their profile ─────────
    await supabase
      .from('profiles')
      .update({ current_team: newTeam.team_id })
      .eq('profile_id', authStore.user.id)

    // Refresh profile in the auth store
    await authStore.fetchProfile()

    // Redirect to the new team's profile page
    router.push(`/teams/${newTeam.team_id}`)

  } catch (error) {
    errorMessage.value = error.message || 'Kļūda. Mēģiniet vēlreiz.'
  } finally {
    saving.value = false
  }
}
</script>
