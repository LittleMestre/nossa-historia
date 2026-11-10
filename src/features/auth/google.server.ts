import { createSupabaseServerClient } from '../../lib/supabase/server'
import { z } from 'zod'

const inviteToken = z.string().regex(/^[0-9a-f]{64}$/)
const oauthCode = z.string().min(1).max(2048)

export function googleConfigured() {
  if (!process.env.GOOGLE_OAUTH_ENABLED) {
    try {
      process.loadEnvFile('.env')
    } catch {
      // The application may be configured through the process environment.
    }
  }
  return (
    process.env.GOOGLE_OAUTH_ENABLED === 'true' &&
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET
  )
}

export function safeInviteToken(value: string | null) {
  return inviteToken.safeParse(value).data ?? null
}

export function safeOAuthCode(value: string | null) {
  return oauthCode.safeParse(value).data ?? null
}

export async function startGoogleOAuth(origin: string, token: string | null) {
  if (!googleConfigured()) return null
  const callback = new URL('/auth/callback', origin)
  if (token) callback.searchParams.set('token', token)
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
    },
  })
  return error ? null : data.url
}

export async function finishGoogleOAuth(code: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return false
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user || !user.email_confirmed_at) {
    await supabase.auth.signOut()
    return false
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) {
    await supabase.auth.signOut()
    return false
  }
  if (!profile) {
    const suppliedName = user.user_metadata.full_name
    const displayName =
      typeof suppliedName === 'string' && suppliedName.trim()
        ? suppliedName.trim().slice(0, 120)
        : 'Membro da família'
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name: displayName })
    if (insertError) {
      await supabase.auth.signOut()
      return false
    }
  }
  return true
}
