// server/api/delete-team.post.js
// Deletes a team and all related data using the service role key (bypasses RLS).
// Caller must be the team captain OR an admin.

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

  // ── 2. Read request body ────────────────────────────────────────────────
  const body = await readBody(event)
  const { teamId } = body || {}
  if (!teamId) throw createError({ statusCode: 400, message: 'teamId ir obligāts.' })

  const isAdmin = user.app_metadata?.role === 'admin'

  // ── 3. Verify caller is captain or admin ────────────────────────────────
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (membership?.role !== 'captain') {
      throw createError({ statusCode: 403, message: 'Tikai kapteinis vai administrators var dzēst komandu.' })
    }
  }

  // ── 4. Full cleanup via service role ────────────────────────────────────
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Get all member profile IDs to clear current_team
  const { data: members } = await admin
    .from('team_members')
    .select('profile_id')
    .eq('team_id', teamId)

  if (members?.length) {
    await admin
      .from('profiles')
      .update({ current_team: null })
      .in('profile_id', members.map(m => m.profile_id))
  }

  // Delete in FK dependency order
  await admin.from('game_challenges').delete()
    .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
  await admin.from('challenge_votes').delete().eq('team_id', teamId)
  await admin.from('team_invitations').delete().eq('team_id', teamId)
  await admin.from('team_members').delete().eq('team_id', teamId)

  const { error } = await admin.from('teams').delete().eq('team_id', teamId)
  if (error) {
    throw createError({ statusCode: 500, message: 'Neizdevās dzēst komandu: ' + error.message })
  }

  return { ok: true }
})
