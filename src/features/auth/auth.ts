import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../lib/supabase/server'

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(1),
})
const emailInput = z.object({ email: z.email().max(254) })
const newPassword = z.object({ password: z.string().min(12).max(128) })
const codeInput = z.object({ code: z.string().min(1).max(2048) })
const displayNameInput = z.object({
  displayName: z.string().trim().min(1).max(120),
})

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()
    return {
      id: user.id,
      email: user.email ?? '',
      displayName: profile?.display_name ?? null,
    }
  },
)

export const login = createServerFn({ method: 'POST' })
  .validator(credentials)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: auth, error } = await supabase.auth.signInWithPassword(data)
    if (error) return { error: 'E-mail ou senha inválidos.' }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (profileError) {
      await supabase.auth.signOut()
      return { error: 'Não foi possível carregar seu perfil.' }
    }
    if (!profile) {
      const suppliedName = auth.user.user_metadata.full_name
      const displayName =
        typeof suppliedName === 'string' && suppliedName.trim()
          ? suppliedName.trim().slice(0, 120)
          : 'Membro da família'
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: auth.user.id, display_name: displayName })
      if (insertError) {
        await supabase.auth.signOut()
        return { error: 'Não foi possível preparar seu perfil.' }
      }
    }
    return { error: null }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()
  return { ok: !error }
})

export const updateDisplayName = createServerFn({ method: 'POST' })
  .validator(displayNameInput)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Entre na sua conta para continuar.' }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: data.displayName,
    })
    return { error: error ? 'Não foi possível salvar seu nome.' : null }
  })

export const requestPasswordReset = createServerFn({ method: 'POST' })
  .validator(emailInput)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const origin =
      process.env.VITE_APP_ORIGIN ||
      import.meta.env.VITE_APP_ORIGIN ||
      'http://127.0.0.1:3000'
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${origin}/nova-senha`,
    })
    return { ok: true }
  })

export const exchangeRecoveryCode = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(data.code)
    return { ok: !error }
  })

export const updatePassword = createServerFn({ method: 'POST' })
  .validator(newPassword)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user)
      return { error: 'Link expirado. Solicite uma nova recuperação.' }
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })
    return {
      error: error
        ? 'Não foi possível alterar a senha. Tente novamente.'
        : null,
    }
  })
