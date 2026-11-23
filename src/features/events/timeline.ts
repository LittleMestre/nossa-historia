import { createServerFn } from '@tanstack/react-start'
import type { TimelineEvent } from '../../components/timeline/timeline-model'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import type { Database } from '../../types/database.types'
import { getSpaceState } from '../spaces/spaces'
import { formatEventDate } from './model'

type EventRow = Database['public']['Tables']['events']['Row']
type TimelineRow = Pick<EventRow,
  'id' | 'title' | 'date_precision' | 'start_year' | 'start_month' | 'start_day' |
  'end_year' | 'end_month' | 'end_day' | 'approximate_date_label' |
  'category_id' | 'timeline_position'
>

export interface UndatedEvent {
  id: string
  title: string
  dateLabel: string
  category: string | null
}

export function adaptTimelineEvent(row: TimelineRow, category: string | null): TimelineEvent | null {
  if (row.date_precision === 'unknown' || row.start_year === null) return null
  return {
    id: row.id,
    title: row.title,
    dateLabel: formatEventDate(row),
    year: row.start_year,
    month: row.start_month,
    day: row.start_day,
    category,
    placement: row.timeline_position === 'auto' ? null : row.timeline_position,
  }
}

// O limite por página é explícito; o laço percorre todas as páginas para não ocultar eventos.
const PAGE_SIZE = 500
export const getTimelineEvents = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Entre na sua conta para ver a linha do tempo.')
  const { activeSpace } = await getSpaceState()
  if (!activeSpace) throw new Error('Selecione um espaço familiar para continuar.')

  const { data: categories, error: categoryError } = await supabase
    .from('categories').select('id, name').eq('space_id', activeSpace.id)
  if (categoryError) throw new Error('Não foi possível carregar as categorias.')
  const categoryNames = new Map(categories.map(({ id, name }) => [id, name]))
  const events: TimelineEvent[] = []
  const undated: UndatedEvent[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from('events')
      .select('id, title, date_precision, start_year, start_month, start_day, end_year, end_month, end_day, approximate_date_label, category_id, timeline_position')
      .eq('space_id', activeSpace.id)
      .is('deleted_at', null)
      .is('parent_event_id', null)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error('Não foi possível carregar os eventos da linha do tempo.')
    for (const row of data) {
      const category = row.category_id ? categoryNames.get(row.category_id) ?? null : null
      const event = adaptTimelineEvent(row, category)
      if (event) events.push(event)
      else undated.push({ id: row.id, title: row.title, dateLabel: formatEventDate(row), category })
    }
    if (data.length < PAGE_SIZE) break
  }
  return { events, undated, canCreate: activeSpace.role !== 'viewer' }
})
