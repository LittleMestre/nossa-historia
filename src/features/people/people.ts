import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { getSpaceState } from '../spaces/spaces'
import { personInputSchema } from './model'

async function context() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { activeSpace } = await getSpaceState()
  if (!activeSpace) return null
  return { supabase, user, space: activeSpace }
}

export const getPeoplePage = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await context()
  if (!ctx) throw new Error('Selecione um espaço familiar para continuar.')
  const { data, error } = await ctx.supabase.from('people').select('*')
    .eq('space_id', ctx.space.id).order('name')
  if (error) throw new Error('Não foi possível carregar as pessoas.')
  return { people: data, canCreate: ctx.space.role !== 'viewer' }
})

export const getPersonDetail = createServerFn({ method: 'GET' })
  .validator(z.object({ personId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx) throw new Error('Selecione um espaço familiar para continuar.')
    const { data: person, error } = await ctx.supabase.from('people').select('*')
      .eq('id', data.personId).eq('space_id', ctx.space.id).maybeSingle()
    if (error) throw new Error('Não foi possível carregar a pessoa.')
    return { person, canEdit: !!person && (ctx.space.role === 'admin' || (ctx.space.role === 'contributor' && person.created_by === ctx.user.id)) }
  })

function saveError(code: string | undefined) {
  return code === '23505'
    ? 'Já existe uma pessoa com esse nome neste espaço familiar.'
    : 'Não foi possível salvar a pessoa. Confira seus dados e permissões.'
}
export const createPerson = createServerFn({ method: 'POST' })
  .validator(z.object({ person: personInputSchema }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para adicionar pessoas.', id: null }
    const { data: person, error } = await ctx.supabase.from('people').insert({
      name: data.person.name,
      nickname: data.person.nickname || null,
      description: data.person.description || null,
      space_id: ctx.space.id,
      created_by: ctx.user.id,
    }).select('id').single()
    if (error) return { error: saveError(error.code), id: null }
    return { error: null, id: person.id }
  })

export const updatePerson = createServerFn({ method: 'POST' })
  .validator(z.object({ personId: z.uuid(), person: personInputSchema }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para editar esta pessoa.' }
    const { data: person, error } = await ctx.supabase.from('people').update({
      name: data.person.name,
      nickname: data.person.nickname || null,
      description: data.person.description || null,
    }).eq('id', data.personId).eq('space_id', ctx.space.id).select('id').maybeSingle()
    if (error) return { error: saveError(error.code) }
    if (!person) return { error: 'Esta pessoa não está disponível para edição.' }
    return { error: null }
  })

export const getEventParticipants = createServerFn({ method: 'GET' })
  .validator(z.object({ eventId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx) throw new Error('Selecione um espaço familiar para continuar.')
    const { data: event, error: eventError } = await ctx.supabase.from('events')
      .select('id, created_by').eq('id', data.eventId).eq('space_id', ctx.space.id)
      .is('deleted_at', null).maybeSingle()
    if (eventError) throw new Error('Não foi possível carregar os participantes.')
    if (!event) return { people: [], links: [], canManage: false }
    const [peopleResult, linksResult] = await Promise.all([
      ctx.supabase.from('people').select('id, name, nickname').eq('space_id', ctx.space.id).order('name'),
      ctx.supabase.from('event_participants').select('id, person_id, created_by')
        .eq('space_id', ctx.space.id).eq('event_id', event.id),
    ])
    if (peopleResult.error || linksResult.error) throw new Error('Não foi possível carregar os participantes.')
    return {
      people: peopleResult.data,
      links: linksResult.data,
      canManage: ctx.space.role === 'admin' || (ctx.space.role === 'contributor' && event.created_by === ctx.user.id),
    }
  })

export const addEventParticipant = createServerFn({ method: 'POST' })
  .validator(z.object({ eventId: z.uuid(), personId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para vincular participantes.' }
    const { error } = await ctx.supabase.from('event_participants').insert({
      space_id: ctx.space.id, event_id: data.eventId, person_id: data.personId, created_by: ctx.user.id,
    })
    if (error) return { error: error.code === '23505' ? 'Esta pessoa já participa deste evento.' : 'Não foi possível vincular a pessoa. Confira suas permissões e o espaço ativo.' }
    return { error: null }
  })

export const removeEventParticipant = createServerFn({ method: 'POST' })
  .validator(z.object({ eventId: z.uuid(), linkId: z.uuid() }))
  .handler(async ({ data }) => {
    const ctx = await context()
    if (!ctx || ctx.space.role === 'viewer') return { error: 'Você não tem permissão para remover participantes.' }
    const { data: link, error } = await ctx.supabase.from('event_participants').delete()
      .eq('id', data.linkId).eq('event_id', data.eventId).eq('space_id', ctx.space.id)
      .select('id').maybeSingle()
    if (error || !link) return { error: 'Não foi possível remover o vínculo. Confira suas permissões.' }
    return { error: null }
  })
