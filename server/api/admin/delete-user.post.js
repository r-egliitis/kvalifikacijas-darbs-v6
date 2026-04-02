// server/api/admin/delete-user.post.js
// Admin-initiated deletion of any user account.
// Performs the same full cleanup as delete-account.post.js but targets a different user.
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
  const { data: { user: caller }, error: callerError } = await supabase.auth.getUser()
  if (callerError || !caller) throw createError({ statusCode: 401, message: 'Nederīgs tokens.' })

  // ── 2. Verify caller is admin ───────────────────────────────────────────
  if (caller.app_metadata?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Piekļuve liegta.' })
  }

  // ── 3. Read request body ────────────────────────────────────────────────
  const body = await readBody(event)
  const { targetUserId } = body || {}
  if (!targetUserId) throw createError({ statusCode: 400, message: 'targetUserId ir obligāts.' })
  if (targetUserId === caller.id) throw createError({ statusCode: 400, message: 'Nevar dzēst pats sevi šeit. Izmanto parasto konta dzēšanu.' })

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 4. Team cleanup ─────────────────────────────────────────────────────
  const { data: membership } = await admin
    .from('team_members').select('team_id, role').eq('profile_id', targetUserId).maybeSingle()

  if (membership?.team_id) {
    const teamId = membership.team_id

    if (membership.role === 'captain') {
      // Check if sole member — if so, delete the whole team
      const { count } = await admin
        .from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId)

      if ((count || 0) <= 1) {
        await admin.from('game_challenges').delete()
          .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)
        await admin.from('challenge_votes').delete().eq('team_id', teamId)
        await admin.from('team_invitations').delete().eq('team_id', teamId)
        await admin.from('team_members').delete().eq('team_id', teamId)
        await admin.from('teams').delete().eq('team_id', teamId)
      } else {
        // Just remove the member
        await admin.from('team_members').delete().eq('profile_id', targetUserId)
        await admin.from('profiles').update({ current_team: null }).eq('profile_id', targetUserId)
      }
    } else {
      await admin.from('team_members').delete().eq('profile_id', targetUserId)
      await admin.from('profiles').update({ current_team: null }).eq('profile_id', targetUserId)
    }
  }

  // ── 5. User-specific record cleanup ────────────────────────────────────
  await admin.from('challenge_votes').delete().eq('profile_id', targetUserId)
  await admin.from('notifications').delete().eq('profile_id', targetUserId)
  await admin.from('team_invitations').delete().eq('invitee_profile_id', targetUserId)
  await admin.from('lineup_players').delete().eq('profile_id', targetUserId)
  await admin.from('game_votes').delete().eq('profile_id', targetUserId)

  const { error: profileErr } = await admin
    .from('profiles').delete().eq('profile_id', targetUserId)
  if (profileErr) {
    throw createError({ statusCode: 500, message: 'Profila dzēšana neizdevās: ' + profileErr.message })
  }

  // ── 6. Delete auth user ─────────────────────────────────────────────────
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
    method:  'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey':        serviceRoleKey,
    },
  })

  if (!res.ok) {
    let msg = 'Neizdevās dzēst autentifikācijas ierakstu.'
    try { const b = await res.json(); msg = b?.msg || b?.message || msg } catch {}
    throw createError({ statusCode: 500, message: msg })
  }

  return { ok: true }
})
