// plugins/supabase.js
// A Nuxt plugin runs ONCE when the app starts, inside the Nuxt context.
// This is the correct place to call useRuntimeConfig() for module-level setup.
// We create the Supabase client here and "provide" it to the whole app as $supabase.

import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  // useRuntimeConfig() is safe to call inside a Nuxt plugin
  const config = useRuntimeConfig()

  // Create the Supabase client using credentials from .env
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // "provide" makes $supabase available everywhere via useNuxtApp().$supabase
  return {
    provide: { supabase },
  }
})
