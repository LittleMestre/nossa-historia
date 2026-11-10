import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../lib/supabase/server'

const spaceId = z.uuid()
const cookieName = 'nossa_active_space'

export const getSpaceState = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { spaces: [], activeSpace: null }
    const { data: memberships, error } = await supabase
      .from('space_members')
      .select('space_id, role, spaces(id, name)')
      .eq('user_id', user.id)
    if (error) throw new Error('Não foi possível carregar os espaços.')
    const spaces = memberships.map((member) => ({
      id: member.space_id,
      name: member.spaces.name,
      role: member.role,
    }))
    const activeSpace =
      spaces.find((space) => space.id === getCookie(cookieName)) ?? null
    return { spaces, activeSpace }
  },
)

export const createFirstSpace = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string().trim().min(1).max(120) }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Entre na sua conta para continuar.' }
    const { count, error: countError } = await supabase
      .from('space_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if (countError) return { error: 'Não foi possível verificar seus espaços.' }
    if (count) return { error: 'Você já participa de um espaço familiar.' }
    const { error } = await supabase
      .from('spaces')
      .insert({ name: data.name, created_by: user.id })
    if (error) return { error: 'Não foi possível criar o espaço.' }
    const { data: memberships } = await supabase
      .from('space_members')
      .select('space_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
    const id = memberships?.[0]?.space_id
    if (!id)
      return { error: 'Espaço criado, mas não foi possível selecioná-lo.' }
    setCookie(cookieName, id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    return { error: null }
  })

export const selectSpace = createServerFn({ method: 'POST' })
  .validator(z.object({ spaceId }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false }
    const { data: member } = await supabase
      .from('space_members')
      .select('id')
      .eq('space_id', data.spaceId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!member) return { ok: false }
    setCookie(cookieName, data.spaceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
    return { ok: true }
  })

export const getActiveMembers = createServerFn({ method: 'GET' }).handler(
  async () => {
    const state = await getSpaceState()
    if (!state.activeSpace) return []
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('space_members')
      .select('user_id, role, joined_at')
      .eq('space_id', state.activeSpace.id)
      .order('joined_at')
    if (error) throw new Error('Não foi possível carregar os membros.')
    const ids = data.map((member) => member.user_id)
    const { data: profiles, error: profilesError } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [], error: null }
    if (profilesError) throw new Error('Não foi possível carregar os perfis.')
    const names = new Map(
      profiles.map((profile) => [profile.id, profile.display_name]),
    )
    const emails = new Map<string, string>()
    if (state.activeSpace.role === 'admin') {
      const admin = createSupabaseAdminClient()
      await Promise.all(
        ids.map(async (id) => {
          const { data: account, error: accountError } =
            await admin.auth.admin.getUserById(id)
          if (!accountError && account.user.email)
            emails.set(id, account.user.email)
        }),
      )
    }
    return data.map((member) => ({
      id: member.user_id,
      role: member.role,
      name:
        names.get(member.user_id) &&
        names.get(member.user_id) !== 'Membro da família'
          ? names.get(member.user_id)!
          : 'Nome não informado',
      email: emails.get(member.user_id) ?? null,
    }))
  },
)
