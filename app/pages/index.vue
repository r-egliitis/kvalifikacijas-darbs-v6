<template>
  <!--
    pages/index.vue
    The landing page — the first page visitors see.
    It introduces the system, shows key features, and provides links to register or log in.
    This page is public (no login required).
  -->
  <div>

    <!-- ── Hero Section ──────────────────────────────────────────────────── -->
    <section class="bg-gradient-to-br from-primary/10 to-accent/5 py-20 px-4">
      <div class="max-w-4xl mx-auto text-center">

        <!-- Large basketball emoji as hero icon -->
        <div class="text-7xl mb-6">🏀</div>

        <!-- Main headline -->
        <h1 class="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          Basketbola Pārvaldības<br/>
          <span class="text-primary">Sistēma</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-lg text-secondary max-w-xl mx-auto mb-8">
          Pārvalda savas komandas, izaicini pretiniekus un reģistrē spēļu rezultātus —
          viss vienā vietā.
        </p>

        <!-- Call-to-action buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/auth/register"
            class="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition text-lg"
          >
            Reģistrēties
          </NuxtLink>
          <NuxtLink
            to="/auth/login"
            class="border-2 border-primary text-primary font-semibold px-8 py-3 rounded-xl hover:bg-primary/10 transition text-lg"
          >
            Pieteikties
          </NuxtLink>
        </div>

      </div>
    </section>

    <!-- ── Features Section ──────────────────────────────────────────────── -->
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto">

        <h2 class="text-2xl font-bold text-center mb-12">Ko piedāvā sistēma?</h2>

        <!-- Feature cards grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <!-- Feature: Teams -->
          <div class="bg-surface rounded-2xl p-6 shadow-sm border border-secondary/10 hover:shadow-md transition">
            <div class="text-4xl mb-4">👥</div>
            <h3 class="font-bold text-lg mb-2">Komandu pārvaldība</h3>
            <p class="text-secondary text-sm">
              Izveido komandu, pievienojies esošai komandai un pārvaldi savu sastāvu.
            </p>
          </div>

          <!-- Feature: Game challenges -->
          <div class="bg-surface rounded-2xl p-6 shadow-sm border border-secondary/10 hover:shadow-md transition">
            <div class="text-4xl mb-4">⚔️</div>
            <h3 class="font-bold text-lg mb-2">Izaicinājumi</h3>
            <p class="text-secondary text-sm">
              Izaicini citas komandas, norodi laiku un laukumu, apstiprinājiet izaicinājumu.
            </p>
          </div>

          <!-- Feature: Results -->
          <div class="bg-surface rounded-2xl p-6 shadow-sm border border-secondary/10 hover:shadow-md transition">
            <div class="text-4xl mb-4">📊</div>
            <h3 class="font-bold text-lg mb-2">Rezultāti</h3>
            <p class="text-secondary text-sm">
              Reģistrē spēļu rezultātus un seko līdzi komandas spēļu vēsturei.
            </p>
          </div>

          <!-- Feature: Courts -->
          <div class="bg-surface rounded-2xl p-6 shadow-sm border border-secondary/10 hover:shadow-md transition">
            <div class="text-4xl mb-4">🏟️</div>
            <h3 class="font-bold text-lg mb-2">Laukumu katalogs</h3>
            <p class="text-secondary text-sm">
              Atrod basketbola laukumus — gan ārtelpas, gan iekštelpu — ar adresēm un kartēm.
            </p>
          </div>

          <!-- Feature: Profiles -->
          <div class="bg-surface rounded-2xl p-6 shadow-sm border border-secondary/10 hover:shadow-md transition">
            <div class="text-4xl mb-4">🙋</div>
            <h3 class="font-bold text-lg mb-2">Spēlētāja profils</h3>
            <p class="text-secondary text-sm">
              Izveido savu profilu ar vārdu, segvārdu, krekla numuru un profilbildi.
            </p>
          </div>

          <!-- Feature: Lineups -->
          <div class="bg-surface rounded-2xl p-6 shadow-sm border border-secondary/10 hover:shadow-md transition">
            <div class="text-4xl mb-4">📋</div>
            <h3 class="font-bold text-lg mb-2">Sākumsastāvs</h3>
            <p class="text-secondary text-sm">
              Atlasi spēlētājus sākumsastāvam pirms katras spēles.
            </p>
          </div>

        </div>
      </div>
    </section>

    <!-- ── Quick Links Section ───────────────────────────────────────────── -->
    <section class="bg-surface py-12 px-4 border-t border-secondary/10">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-xl font-bold mb-6">Sāc jau tagad</h2>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/teams"
            class="border border-secondary/30 rounded-xl px-6 py-3 hover:border-primary hover:text-primary transition font-medium"
          >
            🏀 Skatīt komandas
          </NuxtLink>
          <NuxtLink
            to="/courts"
            class="border border-secondary/30 rounded-xl px-6 py-3 hover:border-primary hover:text-primary transition font-medium"
          >
            🏟️ Skatīt laukumus
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
// Landing page — no special logic needed, just navigation links
// The page is public and requires no authentication
</script>
