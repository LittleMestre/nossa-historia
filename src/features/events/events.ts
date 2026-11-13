import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { getSpaceState } from '../spaces/spaces'
import { eventInputSchema, sortEvents } from './model'

async function context() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { activeSpace } = await getSpaceState()
  if (!activeSpace) return null
  return { supabase, user, space: activeSpace }
}
async function catalogs(supabase: NonNullable<Awaited<ReturnType<typeof context>>>['supabase'], spaceId: string) {
  const [categories, locations] = await Promise.all([
    supabase.from('categories').select('id, name').eq('space_id', spaceId).order('name'),
    supabase.from('locations').select('id, name').eq('space_id', spaceId).order('name'),
  ])
  if (categories.error || locations.error) throw new Error('Não foi possível carregar os catálogos.')
  return { categories: categories.data, locations: locations.data }
}
export const getEventsPage = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await context()
  if (!ctx) throw new Error('Selecione um espaço familiar para continuar.')
  const [result, options] = await Promise.all([
    ctx.supabase.from('events').select('*').eq('space_id', ctx.space.id).is('deleted_at', null).is('parent_event_id', null),
    catalogs(ctx.supabase, ctx.space.id),
  ])
  if (result.error) throw new Error('Não foi possível carregar os eventos.')
  return { events: sortEvents(result.data), ...options, role: ctx.space.role, spaceName: ctx.space.name }
})
export const getEventDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ eventId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx) throw new Error('Selecione um espaço familiar para continuar.')
    const [result, options] = await Promise.all([
      ctx.supabase.from('events').select('*').eq('id', data.eventId).eq('space_id', ctx.space.id).is('deleted_at', null).maybeSingle(),
      catalogs(ctx.supabase, ctx.space.id),
    ])
    if (result.error) throw new Error('Não foi possível carregar o evento.')
    const event = result.data
    const { data: author } = event
      ? await ctx.supabase.from('profiles').select('display_name').eq('id', event.created_by).maybeSingle()
      : { data: null }
    return { event, ...options, authorName: author?.display_name ?? null, canEdit: !!event && (ctx.space.role === 'admin' || (ctx.space.role === 'contributor' && event.created_by === ctx.user.id)) }
  })
const mutationSchema = z.object({ event: eventInputSchema })
export const createEvent = createServerFn({ method: 'POST' })
  .validator(mutationSchema)
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para criar eventos.', id: null }
    const { data: event, error } = await ctx.supabase.from('events').insert({
      ...data.event, description: data.event.description || null,
      space_id: ctx.space.id, created_by: ctx.user.id,
    }).select('id').single()
    if (error) return { error: 'Não foi possível salvar. Confira a categoria, o local e a data.', id: null }
    return { error: null, id: event.id }
  })
export const updateEvent = createServerFn({ method: 'POST' })
  .validator(mutationSchema.extend({ eventId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para editar este evento.' }
    const { data: event, error } = await ctx.supabase.from('events').update({
      ...data.event, description: data.event.description || null,
    }).eq('id', data.eventId).eq('space_id', ctx.space.id).is('deleted_at', null).select('id').maybeSingle()
    if (error || !event) return { error: 'Não foi possível editar este evento. Confira as informações e suas permissões.' }
    return { error: null }
  })
export const deleteEvent = createServerFn({ method: 'POST' })
  .validator(z.object({ eventId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para excluir este evento.' }
    const { data: event, error } = await ctx.supabase.from('events').update({ deleted_at: new Date().toISOString() })
      .eq('id', data.eventId).eq('space_id', ctx.space.id).is('deleted_at', null).select('id').maybeSingle()
    if (error || !event) return { error: 'Não foi possível excluir este evento.' }
    return { error: null }
  })
