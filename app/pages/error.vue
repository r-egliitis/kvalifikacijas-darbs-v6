<template>
  <!--
    error.vue — Shown when a page is not found (404) or another error occurs.
    Nuxt 4 uses this as the global error page.
  -->
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="text-center">
      <Icon
        :name="error?.statusCode === 404 ? 'ph:basketball' : 'ph:warning'"
        class="w-24 h-24 mx-auto mb-6"
        :class="error?.statusCode === 404 ? 'text-primary' : 'text-amber-500'"
      />
      <h1 class="text-3xl font-bold mb-2">
        {{ error?.statusCode === 404 ? 'Lapa nav atrasta' : 'Kaut kas nogāja greizi' }}
      </h1>
      <p class="text-secondary mb-6">
        {{ error?.statusCode === 404
          ? 'Atvainojiet, šāda lapa neeksistē.'
          : 'Lūdzu mēģiniet vēlreiz vai atgriezieties sākumlapā.' }}
      </p>
      <NuxtLink
        to="/"
        class="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition"
      >
        ← Uz sākumlapu
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// Receive the error object from Nuxt's error handling system
defineProps({
  error: Object,
})
</script>
