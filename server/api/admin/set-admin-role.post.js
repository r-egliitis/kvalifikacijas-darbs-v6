// server/api/admin/set-admin-role.post.js
// Grants or revokes admin role on a target user.
// Caller must be an admin (verified via JWT app_metadata).

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const supabaseUrl    = process.env.SUPABASE_URL
  const anonKey        = process.env.SUPABASE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw createError({ statusCode: 500, message: 'Service role key nav konfigurēts.' })
  }

  // ── 1. Verify caller is authenticated ──────────────────────────────────
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw createError({ statusCode: 401, message: 'Nav autorizācijas tokena.' })

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw createError({ statusCode: 401, message: 'Nederīgs tokens.' })

  // ── 2. Verify caller is admin ───────────────────────────────────────────
  if (user.app_metadata?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Piekļuve liegta.' })
  }

  // ── 3. Read request body ────────────────────────────────────────────────
  const body = await readBody(event)
  const { targetUserId, makeAdmin } = body || {}
  if (!targetUserId) throw createError({ statusCode: 400, message: 'targetUserId ir obligāts.' })

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 4. Update JWT app_metadata via Supabase Admin REST API ─────────────
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey':        serviceRoleKey,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      app_metadata: { role: makeAdmin ? 'admin' : null },
    }),
  })

  if (!res.ok) {
    let msg = 'Neizdevās mainīt lomu.'
    try { const b = await res.json(); msg = b?.msg || b?.message || msg } catch {}
    throw createError({ statusCode: 500, message: msg })
  }

  // ── 5. Sync is_admin flag in profiles table ─────────────────────────────
  await admin.from('profiles').update({ is_admin: !!makeAdmin }).eq('profile_id', targetUserId)

  return { ok: true }
})
