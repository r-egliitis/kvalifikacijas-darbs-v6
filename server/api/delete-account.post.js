// server/api/delete-account.post.js
// Deletes the authenticated user's account completely — profile data + auth user.
// Reads env vars directly from process.env (more reliable than runtimeConfig in server routes).

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const supabaseUrl     = process.env.SUPABASE_URL
  const anonKey         = process.env.SUPABASE_KEY
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw createError({ statusCode: 500, message: 'Service role key nav konfigurēts.' })
  }

  // ── 1. Read the Bearer token ────────────────────────────────────────────
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    throw createError({ statusCode: 401, message: 'Nav autorizācijas tokena.' })
  }

  // ── 2. Verify token and get user ID ────────────────────────────────────
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw createError({ statusCode: 401, message: 'Nederīgs tokens.' })
  }
  const userId = user.id

  // ── 3. Admin client (service role) ─────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 4. Request body ─────────────────────────────────────────────────────
  const body       = await readBody(event)
  const deleteTeam = body?.deleteTeam === true

  // ── 5. Team cleanup ─────────────────────────────────────────────────────
  if (deleteTeam) {
    const { data: membership } = await admin
      .from('team_members').select('team_id').eq('profile_id', userId).maybeSingle()

    if (membership?.team_id) {
      const teamId = membership.team_id
      await admin.from('game_challenges').delete()
        .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
      await admin.from('challenge_votes').delete().eq('team_id', teamId)
      await admin.from('team_invitations').delete().eq('team_id', teamId)
      await admin.from('team_members').delete().eq('team_id', teamId)
      await admin.from('teams').delete().eq('team_id', teamId)
    }
  } else {
    await admin.from('team_members').delete().eq('profile_id', userId)
  }

  // ── 6. User-specific record cleanup ────────────────────────────────────
  await admin.from('challenge_votes').delete().eq('profile_id', userId)
  await admin.from('notifications').delete().eq('profile_id', userId)
  await admin.from('team_invitations').delete().eq('invitee_profile_id', userId)
  await admin.from('lineup_players').delete().eq('profile_id', userId)
  await admin.from('game_votes').delete().eq('profile_id', userId)

  // Delete profile and confirm it was removed
  const { error: profileErr } = await admin
    .from('profiles').delete().eq('profile_id', userId)
  if (profileErr) {
    throw createError({ statusCode: 500, message: 'Profila dzēšana neizdevās: ' + profileErr.message })
  }

  // ── 7. Delete auth user via REST API directly ───────────────────────────
  // Using the REST endpoint directly is more reliable than the SDK method
  // when the user has an active session.
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method:  'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey':        serviceRoleKey,
    },
  })

  if (!res.ok) {
    let msg = 'Neizdevās dzēst autentifikācijas ierakstu.'
    try {
      const body = await res.json()
      msg = body?.msg || body?.message || msg
    } catch {}
    throw createError({ statusCode: 500, message: msg })
  }

  return { ok: true }
})
