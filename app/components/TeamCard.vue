<template>
  <!--
    TeamCard.vue
    A reusable card component for displaying a team's summary information.
    Used in the teams catalog page and anywhere else a team is listed.

    Props:
      - team: the team object from the database
      - playerCount: number of players in this team
  -->
  <NuxtLink
    :to="`/teams/${team.team_id}`"
    class="block bg-surface rounded-2xl border border-secondary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden"
  >
    <!-- Team logo / banner area -->
    <div class="h-20 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
      <img
        v-if="team.picture"
        :src="team.picture"
        :alt="team.name"
        class="h-16 w-16 object-cover rounded-full border-2 border-surface shadow"
      />
      <!-- Default icon when no logo is set -->
      <Icon v-else name="ph:basketball" class="w-12 h-12 text-primary/40" />
    </div>

    <!-- Card body -->
    <div class="p-4">

      <!-- Team name -->
      <h3 class="font-bold text-base truncate">{{ team.name }}</h3>

      <!-- City and age group badges -->
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span
          v-if="team.city"
          class="inline-flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full"
        >
          <Icon name="ph:map-pin" class="w-3 h-3" /> {{ team.city }}
        </span>
        <span
          v-if="team.age_group"
          class="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium"
        >
          {{ team.age_group }}
        </span>
      </div>

      <!-- Player count -->
      <p class="flex items-center gap-1 text-xs text-secondary mt-3">
        <Icon name="ph:users" class="w-3.5 h-3.5" /> {{ playerCount }} {{ playerCountLabel }}
      </p>

    </div>
  </NuxtLink>
</template>

<script setup>
// Props this component receives from its parent
const props = defineProps({
  // team: a row from the 'teams' table
  team: {
    type: Object,
    required: true,
  },
  // playerCount: the number of members in this team
  playerCount: {
    type: Number,
    default: 0,
  },
})

// playerCountLabel: Latvian noun for "players" with correct declension
// Latvian uses different word forms depending on the count
const playerCountLabel = computed(() => {
  const n = props.playerCount
  if (n === 1) return 'spēlētājs'
  if (n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 10 || n % 100 >= 20)) return 'spēlētāji'
  return 'spēlētāju'
})
</script>
