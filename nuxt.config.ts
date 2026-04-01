// nuxt.config.ts
// This is the main configuration file for the Nuxt application.
// It registers all modules, sets up the CSS, and configures runtime environment variables.

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // devtools: helpful panel in the browser during development
  devtools: { enabled: true },

  // Modules: extra features we plug into Nuxt
  modules: [
    '@nuxtjs/tailwindcss', // Utility-first CSS framework
    '@pinia/nuxt',         // Global state management (stores)
  ],

  // Tell @nuxtjs/tailwindcss to use our custom CSS file (with color variables + @tailwind directives)
  // and to find our tailwind.config.js at the project root
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
  },

  // runtimeConfig: makes environment variables available in the app.
  // Variables under 'public' are safe to expose to the browser.
  runtimeConfig: {
    // Server-only (never exposed to the browser)
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },

  // app: global HTML head settings
  app: {
    head: {
      title: 'Basketbola Pārvaldības Sistēma',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Basketbola komandu un spēļu pārvaldības sistēma' },
      ],
    },
  },
})
