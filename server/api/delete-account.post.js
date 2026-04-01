// server/api/delete-account.post.js
// Deletes the authenticated user's account completely — profile data + auth user.
// The auth user deletion requires the service role key (server-side only).
// Accepts: { deleteTeam: boolean } in the request body.

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // ── 1. Read the Bearer token from the Authorization header ─────────────
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    throw createError({ statusCode: 401, message: 'Nav autorizācijas tokena.' })
  }

  // ── 2. Verify the token and get the user ID via a regular client ────────
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw createError({ statusCode: 401, message: 'Nederīgs tokens.' })
  }

  const userId = user.id

  // ── 3. Admin client (service role — can delete auth users) ─────────────
  const admin = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey
  )

  // ── 4. Read request body ────────────────────────────────────────────────
  const body = await readBody(event)
  const deleteTeam = body?.deleteTeam === true

  // ── 5. If the user's team should be deleted (sole member scenario) ──────
  if (deleteTeam) {
    // Find the team where this user is the last member
    const { data: membership } = await admin
      .from('team_members')
      .select('team_id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (membership?.team_id) {
      const teamId = membership.team_id

      // Delete game_challenges involving this team
      await admin.from('game_challenges')
        .delete()
        .or(`challenger_team_id.eq.${teamId},challenged_team_id.eq.${teamId}`)

      // Delete challenge_votes for this team
      await admin.from('challenge_votes').delete().eq('team_id', teamId)

      // Delete team invitations
      await admin.from('team_invitations').delete().eq('team_id', teamId)

      // Delete team members
      await admin.from('team_members').delete().eq('team_id', teamId)

      // Delete the team itself
      await admin.from('teams').delete().eq('team_id', teamId)
    }
  } else {
    // Just remove the user from their team
    await admin.from('team_members').delete().eq('profile_id', userId)
  }

  // ── 6. Clean up user-specific records ──────────────────────────────────
  await admin.from('challenge_votes').delete().eq('profile_id', userId)
  await admin.from('notifications').delete().eq('profile_id', userId)
  await admin.from('team_invitations').delete().eq('invitee_profile_id', userId)
  // lineup_players references profiles.profile_id — must be removed before profile delete
  await admin.from('lineup_players').delete().eq('profile_id', userId)

  await admin.from('profiles').delete().eq('profile_id', userId)

  // ── 7. Delete the auth user (requires service role) ────────────────────
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    throw createError({ statusCode: 500, message: 'Neizdevās dzēst kontu: ' + deleteError.message })
  }

  return { ok: true }
})
