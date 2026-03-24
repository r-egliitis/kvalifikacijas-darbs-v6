<template>
  <!--
    PlayerCard.vue
    A reusable card for displaying a player's information.
    Used in team profiles and lineup displays.

    Props:
      - player: a profile object (name, surname, nickname, number, picture)
      - role: the player's role in the team ('player' or 'captain')
      - compact: if true, shows a smaller version of the card
  -->
  <div
    class="bg-surface rounded-xl border border-secondary/10 flex items-center gap-3 p-3 hover:shadow-sm transition"
    :class="compact ? 'p-2' : 'p-3'"
  >

    <!-- Player photo -->
    <img
      v-if="player.picture"
      :src="player.picture"
      :alt="`${player.name} ${player.surname}`"
      class="rounded-full object-cover flex-shrink-0 border-2 border-surface shadow"
      :class="compact ? 'w-8 h-8' : 'w-12 h-12'"
    />
    <div
      v-else
      class="rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-surface shadow"
      :class="compact ? 'w-8 h-8 text-base' : 'w-12 h-12 text-xl'"
    >
      🙋
    </div>

    <!-- Name and badges -->
    <div class="flex-1 min-w-0">
      <p class="font-semibold truncate" :class="compact ? 'text-xs' : 'text-sm'">
        {{ player.name }} {{ player.surname }}
      </p>
      <p v-if="player.nickname && !compact" class="text-secondary text-xs truncate">
        „{{ player.nickname }}"
      </p>

      <!-- Captain badge -->
      <span
        v-if="role === 'captain'"
        class="text-xs bg-accent/15 text-accent font-semibold px-1.5 py-0.5 rounded-full"
      >
        Kapteinis
      </span>
    </div>

    <!-- Jersey number -->
    <span
      v-if="player.number !== null && player.number !== undefined"
      class="font-mono font-bold text-secondary flex-shrink-0"
      :class="compact ? 'text-xs' : 'text-sm'"
    >
      #{{ player.number }}
    </span>

  </div>
</template>

<script setup>
defineProps({
  // player: profile object from the database
  player: {
    type: Object,
    required: true,
  },
  // role: 'player' or 'captain'
  role: {
    type: String,
    default: 'player',
  },
  // compact: show smaller version for tight spaces
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>
