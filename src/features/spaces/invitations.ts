import { createHash, randomBytes } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseAdminClient } from '../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../lib/supabase/server'

const inviteInput = z.object({
  spaceId: z.uuid(),
  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  role: z.enum(['contributor', 'viewer']),
})
const idInput = z.object({ id: z.uuid(), spaceId: z.uuid() })
const tokenInput = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/) })
const exchangeInput = z.object({ code: z.string().min(1).max(2048) })
const sessionInput = z.object({
  accessToken: z.string().min(1).max(8192),
  refreshToken: z.string().min(1).max(8192),
})

async function requireAdmin(spaceId: string) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: member } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()
  return member?.role === 'admin' ? { supabase, user } : null
}

export const listPendingInvites = createServerFn({ method: 'GET' })
  .validator(z.object({ spaceId: z.uuid() }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.spaceId)
    if (!admin) return []
    const { data: rows, error } = await admin.supabase
      .from('invitations')
      .select('id, email, role, expires_at, created_at')
      .eq('space_id', data.spaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw new Error('Não foi possível carregar os convites.')
    return rows
  })

export const sendInvite = createServerFn({ method: 'POST' })
  .validator(inviteInput)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.spaceId)
    if (!admin) return { error: 'Somente administradores podem convidar.' }
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { data: rows, error } = await admin.supabase
      .from('invitations')
      .insert({
        space_id: data.spaceId,
        email: data.email,
        role: data.role,
        token_hash: tokenHash,
        invited_by: admin.user.id,
        expires_at: expiresAt,
      })
      .select('id')
    if (error)
      return {
        error:
          error.code === '23505'
            ? 'Já existe um convite pendente para este e-mail.'
            : 'Não foi possível criar o convite.',
      }
    const id = rows[0]?.id
    if (!id) return { error: 'Não foi possível registrar o convite.' }
    const origin =
      process.env.VITE_APP_ORIGIN ||
      import.meta.env.VITE_APP_ORIGIN ||
      'http://127.0.0.1:3000'
    const redirectTo = `${origin}/convite?token=${token}`
    try {
      const auth = createSupabaseAdminClient()
      const { error: inviteError } = await auth.auth.admin.inviteUserByEmail(
        data.email,
        { redirectTo },
      )
      if (inviteError) {
        // Supabase rejects confirmed users in inviteUserByEmail; send a magic link instead.
        const { error: otpError } = await auth.auth.signInWithOtp({
          email: data.email,
          options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
        })
        if (otpError) throw otpError
      }
      return { error: null }
    } catch {
      await admin.supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', id)
      return { error: 'Não foi possível enviar o e-mail. Tente novamente.' }
    }
  })

export const revokeInvite = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }) => {
    const admin = await requireAdmin(data.spaceId)
    if (!admin) return { ok: false }
    const { data: row, error } = await admin.supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', data.id)
      .eq('space_id', data.spaceId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()
    return { ok: !error && !!row }
  })

export const exchangeInviteCode = createServerFn({ method: 'POST' })
  .validator(exchangeInput)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(data.code)
    return { ok: !error }
  })

export const establishInviteSession = createServerFn({ method: 'POST' })
  .validator(sessionInput)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.setSession({
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
    })
    if (error) return { ok: false }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return { ok: !!user }
  })

export const acceptInvite = createServerFn({ method: 'POST' })
  .validator(tokenInput)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return {
        error: 'Entre com a conta que recebeu o convite.',
        spaceId: null,
      }
    const { data: spaceId, error } = await supabase.rpc('accept_invitation', {
      invite_token: data.token,
    })
    if (error || !spaceId)
      return {
        error:
          'Convite inválido, expirado, revogado ou destinado a outra conta.',
        spaceId: null,
      }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile) {
      const suppliedName = user.user_metadata.full_name
      const displayName =
        typeof suppliedName === 'string' && suppliedName.trim()
          ? suppliedName.trim().slice(0, 120)
          : 'Membro da família'
      await supabase
        .from('profiles')
        .insert({ id: user.id, display_name: displayName })
    }
    return { error: null, spaceId }
  })
