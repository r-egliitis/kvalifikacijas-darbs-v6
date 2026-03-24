<template>
  <!--
    CourtCard.vue
    A reusable card for displaying a basketball court's information.
    Shows name, address, indoor/outdoor badge, and a link to the map.

    Props:
      - court: a row from the 'courts' table
  -->
  <div class="bg-surface rounded-2xl border border-secondary/10 shadow-sm hover:shadow-md transition-all duration-200 p-5">

    <!-- Court name -->
    <h3 class="font-bold text-base mb-2">{{ court.name }}</h3>

    <!-- Indoor / Outdoor badge -->
    <span
      class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
      :class="court.outdoor
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
    >
      {{ court.outdoor ? '☀️ Ārtelpas' : '🏢 Iekštelpas' }}
    </span>

    <!-- Address -->
    <p v-if="court.address" class="text-secondary text-sm flex items-start gap-1.5 mb-3">
      <span class="mt-0.5">📍</span>
      <span>{{ court.address }}</span>
    </p>

    <!-- Map link (opens in new tab) -->
    <a
      v-if="court.url || (court.latitude && court.longitude)"
      :href="court.url || `https://www.google.com/maps?q=${court.latitude},${court.longitude}`"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
    >
      🗺️ Skatīt kartē
    </a>

  </div>
</template>

<script setup>
// Props this card receives
defineProps({
  // court: a row from the courts table
  court: {
    type: Object,
    required: true,
  },
})
</script>
