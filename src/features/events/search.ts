import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { getSpaceState } from '../spaces/spaces'
import { eventInputSchema, formatEventDate } from './model'
import type { TimelineFilters } from './timeline-filters'

export const eventSearchPageSize = 20
export const eventSearchTextLimit = 200
export const eventSearchYearSchema = z.number().int().min(1000).max(9999)

const scopeSchema = z.object({ userId: z.uuid(), spaceId: z.uuid() })
const filtersSchema = z.object({
  year: z.union([eventSearchYearSchema, z.literal('undated')]).nullable(),
  categoryId: z.uuid().nullable(),
  momentType: eventInputSchema.shape.moment_type.nullable(),
}) satisfies z.ZodType<TimelineFilters>

async function searchContext(scope: z.infer<typeof scopeSchema>) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || user?.id !== scope.userId) throw new Error('Sua sessão mudou.')
  const { activeSpace } = await getSpaceState()
  if (activeSpace?.id !== scope.spaceId)
    throw new Error('O espaço ativo mudou.')
  return { supabase, spaceId: activeSpace.id }
}

// PostgreSQL's (?q) treats the remaining pattern literally. Quote it separately
// for PostgREST's logical filter syntax.
function literalPattern(text: string) {
  return `"(?q)${text.replace(/[\\"]/g, '\\$&')}"`
}

export const getEventSearchCategories = createServerFn({ method: 'GET' })
  .validator(scopeSchema)
  .handler(async ({ data }) => {
    const { supabase, spaceId } = await searchContext(data)
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('space_id', spaceId)
      .order('name')
    if (error) throw new Error('Não foi possível carregar as categorias.')
    return categories
  })

export const searchEvents = createServerFn({ method: 'POST' })
  .validator(
    scopeSchema.extend({
      text: z
        .string()
        .trim()
        .max(eventSearchTextLimit)
        .refine((text) => !text.includes('\0')),
      filters: filtersSchema,
      page: z
        .number()
        .int()
        .min(0)
        .max(
          Math.floor(
            (Number.MAX_SAFE_INTEGER - eventSearchPageSize) /
              eventSearchPageSize,
          ),
        ),
    }),
  )
  .handler(async ({ data }) => {
    const { supabase, spaceId } = await searchContext(data)
    const { text, filters, page } = data
    const query = supabase
      .from('events')
      .select(
        'id, title, description, date_precision, start_year, start_month, start_day, end_year, end_month, end_day, approximate_date_label, moment_type, categories(name)',
        { count: 'exact' },
      )
      .eq('space_id', spaceId)
      .is('deleted_at', null)
      .is('parent_event_id', null)

    if (text) {
      const pattern = literalPattern(text)
      query.or(`title.imatch.${pattern},description.imatch.${pattern}`)
    }
    if (filters.year === 'undated') query.eq('date_precision', 'unknown')
    else if (filters.year !== null) {
      const year = filters.year
      query
        .lte('start_year', year)
        .or(`start_year.eq.${year},end_year.gte.${year}`)
    }
    if (filters.categoryId) query.eq('category_id', filters.categoryId)
    if (filters.momentType) query.eq('moment_type', filters.momentType)

    const offset = page * eventSearchPageSize
    const {
      data: events,
      count,
      error,
    } = await query
      .order('start_year', { ascending: false, nullsFirst: false })
      .order('start_month', { ascending: false, nullsFirst: false })
      .order('start_day', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + eventSearchPageSize - 1)
    if (error || count === null)
      throw new Error('Não foi possível buscar os acontecimentos.')
    return {
      total: count,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        description:
          event.description && event.description.length > 280
            ? `${event.description.slice(0, 280).trimEnd()}…`
            : event.description,
        date: formatEventDate(event),
        category: event.categories?.name ?? null,
        momentType: event.moment_type,
      })),
    }
  })
