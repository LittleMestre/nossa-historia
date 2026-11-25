import { supabase } from './supabase'
import {
  sortEvents,
  type Data,
  type Event,
  type Photo,
  type Space,
} from './model'

function client() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}
export async function loadSpaces(userId: string): Promise<Space[]> {
  const { data, error } = await client()
    .from('space_members')
    .select('space_id, role, spaces(id, name)')
    .eq('user_id', userId)
  if (error) throw new Error('Não foi possível carregar os espaços familiares.')
  return (data ?? []).flatMap((row) => {
    const space = (Array.isArray(row.spaces) ? row.spaces[0] : row.spaces) as
      { id: string; name: string } | undefined
    return space
      ? [
          {
            id: row.space_id,
            name: space.name,
            role: row.role as Space['role'],
          },
        ]
      : []
  })
}
export async function loadData(spaceId: string): Promise<Data> {
  const api = client()
  const [
    eventsResult,
    categoriesResult,
    photosResult,
    linksResult,
    peopleResult,
  ] = await Promise.all([
    api
      .from('events')
      .select(
        'id, space_id, title, description, created_by, moment_type, category_id, date_precision, start_year, start_month, start_day, end_year, end_month, end_day, approximate_date_label, created_at',
      )
      .eq('space_id', spaceId)
      .is('deleted_at', null)
      .is('parent_event_id', null)
      .order('created_at', { ascending: false })
      .limit(500),
    api.from('categories').select('id, name').eq('space_id', spaceId),
    api
      .from('media')
      .select(
        'id, event_id, description, storage_path, events!inner(id, deleted_at)',
      )
      .eq('space_id', spaceId)
      .eq('media_type', 'photo')
      .eq('upload_status', 'ready')
      .is('deleted_at', null)
      .is('events.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200),
    api
      .from('event_participants')
      .select('event_id, people(id, name)')
      .eq('space_id', spaceId)
      .limit(500),
    api
      .from('people')
      .select('id,name,nickname,description,created_by')
      .eq('space_id', spaceId)
      .order('name'),
  ])
  const failure =
    eventsResult.error ||
    categoriesResult.error ||
    photosResult.error ||
    linksResult.error ||
    peopleResult.error
  if (failure)
    throw new Error(
      'Não foi possível carregar os dados deste espaço. Confira a conexão e tente novamente.',
    )
  const categories: Record<string, string> = {}
  for (const row of categoriesResult.data ?? []) categories[row.id] = row.name
  const participants: Data['participants'] = {}
  for (const row of linksResult.data ?? []) {
    const person = (Array.isArray(row.people) ? row.people[0] : row.people) as
      { id: string; name: string } | undefined
    if (person) (participants[row.event_id] ??= []).push(person)
  }
  const photos = (photosResult.data ?? []).map(
    ({ events: _events, ...row }) => row,
  ) as Photo[]
  return {
    people: peopleResult.data ?? [],
    events: sortEvents((eventsResult.data ?? []) as Event[]),
    categories,
    photos,
    participants,
  }
}
export async function signPhotos(photos: Photo[]) {
  if (!photos.length) return photos
  const api = client()
  const { data, error } = await api.storage
    .from('family-media')
    .createSignedUrls(
      photos.map((p) => p.storage_path),
      60,
    )
  const urls = new Map(
    (error ? [] : (data ?? [])).map((item) => [item.path, item.signedUrl]),
  )
  return photos.map((photo) => ({
    ...photo,
    url: urls.get(photo.storage_path) ?? undefined,
  }))
}
