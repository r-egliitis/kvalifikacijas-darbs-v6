<template>
  <!--
    pages/courts/add.vue
    Admin-only form to add a new basketball court to the catalog.
    Access is blocked at the page level if the user is not an admin.
  -->
  <div class="max-w-2xl mx-auto px-4 py-10">

    <h1 class="text-2xl font-bold mb-6">Pievienot laukumu</h1>

    <!-- Access denied message (shown if not admin) -->
    <div v-if="!authStore.isAdmin" class="text-center py-16 text-secondary">
      <div class="text-5xl mb-4">🔒</div>
      <p class="font-medium">Nav piekļuves</p>
      <p class="text-sm mt-1">Tikai administratori var pievienot laukumus.</p>
      <NuxtLink to="/courts" class="text-primary hover:underline text-sm mt-3 block">
        ← Atpakaļ uz laukumiem
      </NuxtLink>
    </div>

    <!-- Add court form (only shown to admins) -->
    <template v-else>

      <!-- Success message -->
      <div v-if="savedOk" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm mb-6">
        ✅ Laukums pievienots veiksmīgi!
        <NuxtLink to="/courts" class="font-medium underline ml-1">Skatīt laukumus</NuxtLink>
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleAdd" class="bg-surface rounded-2xl shadow-sm border border-secondary/10 p-6 space-y-5">

        <!-- Court name -->
        <div>
          <label class="block text-sm font-medium mb-1">
            Laukuma nosaukums <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Rīgas Sporta pils"
            class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
        </div>

        <!-- Address -->
        <div>
          <label class="block text-sm font-medium mb-1">Adrese</label>
          <input
            v-model="form.address"
            type="text"
            placeholder="Krišjāņa Valdemāra iela 10, Rīga"
            class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
        </div>

        <!-- Indoor / Outdoor toggle -->
        <div>
          <label class="block text-sm font-medium mb-2">Veids</label>
          <div class="flex gap-3">
            <button
              type="button"
              @click="form.outdoor = false"
              :class="!form.outdoor ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300' : 'border-secondary/30 text-secondary'"
              class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition"
            >
              🏢 Iekštelpas
            </button>
            <button
              type="button"
              @click="form.outdoor = true"
              :class="form.outdoor ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300' : 'border-secondary/30 text-secondary'"
              class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition"
            >
              ☀️ Ārtelpas
            </button>
          </div>
        </div>

        <!-- Coordinates (optional, for map link) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Platuma grādi</label>
            <input
              v-model.number="form.latitude"
              type="number"
              step="any"
              placeholder="56.9496"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Garuma grādi</label>
            <input
              v-model.number="form.longitude"
              type="number"
              step="any"
              placeholder="24.1052"
              class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>
        </div>

        <!-- Map URL (optional override) -->
        <div>
          <label class="block text-sm font-medium mb-1">Kartes saite (pēc izvēles)</label>
          <input
            v-model="form.url"
            type="url"
            placeholder="https://maps.google.com/..."
            class="w-full px-4 py-2 rounded-lg border border-secondary/30 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <span v-if="saving">Pievieno...</span>
            <span v-else>Pievienot laukumu</span>
          </button>

          <NuxtLink
            to="/courts"
            class="flex-1 text-center border border-secondary/30 font-semibold py-2.5 rounded-xl hover:bg-secondary/10 transition"
          >
            Atcelt
          </NuxtLink>
        </div>

      </form>
    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { supabase } from '~/utils/supabase'

// Require login (admin check is done in the template)
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

const saving = ref(false)
const savedOk = ref(false)
const errorMessage = ref('')

const form = reactive({
  name:      '',
  address:   '',
  outdoor:   false,
  latitude:  null,
  longitude: null,
  url:       '',
})

// handleAdd: inserts a new court row into the database
async function handleAdd() {
  if (!form.name.trim()) {
    errorMessage.value = 'Laukuma nosaukums ir obligāts.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('courts')
      .insert({
        name:      form.name.trim(),
        address:   form.address.trim()  || null,
        outdoor:   form.outdoor,
        latitude:  form.latitude        || null,
        longitude: form.longitude       || null,
        url:       form.url.trim()      || null,
      })

    if (error) throw new Error('Neizdevās pievienot laukumu.')

    savedOk.value = true

    // Reset the form for adding another court
    Object.assign(form, { name: '', address: '', outdoor: false, latitude: null, longitude: null, url: '' })

  } catch (error) {
    errorMessage.value = error.message || 'Kļūda. Mēģiniet vēlreiz.'
  } finally {
    saving.value = false
  }
}
</script>
