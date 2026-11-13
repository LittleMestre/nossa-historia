import { z } from 'zod'
import type { Database } from '../../types/database.types'

type EventRow = Database['public']['Tables']['events']['Row']
const part = z.number().int().nullable()
export const eventInputSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(200),
  description: z.string().trim().max(10000, 'A descrição é muito longa.'),
  moment_type: z.enum(['family', 'individual', 'other']),
  date_precision: z.enum(['day', 'month', 'year', 'range', 'unknown']),
  start_year: part, start_month: part, start_day: part,
  end_year: part, end_month: part, end_day: part,
  approximate_date_label: z.string().trim().max(160).nullable(),
  category_id: z.uuid().nullable(), location_id: z.uuid().nullable(),
}).superRefine((value, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message, path: ['date_precision'] })
  const valid = (year: number | null, month: number | null, day: number | null) => {
    if (year === null) return month === null && day === null
    if (year < 1000 || year > 9999) return false
    if (month === null) return day === null
    if (month < 1 || month > 12) return false
    if (day === null) return true
    const actual = new Date(Date.UTC(year, month - 1, day))
    return day >= 1 && actual.getUTCFullYear() === year && actual.getUTCMonth() === month - 1 && actual.getUTCDate() === day
  }
  const { date_precision: precision, start_year: sy, start_month: sm, start_day: sd, end_year: ey, end_month: em, end_day: ed } = value
  if (!valid(sy, sm, sd) || !valid(ey, em, ed)) issue('Confira os dias, meses e anos informados.')
  if (precision === 'unknown' && [sy, sm, sd, ey, em, ed].some((v) => v !== null)) issue('Data desconhecida não deve ter dia, mês ou ano.')
  if (precision === 'year' && (sy === null || sm !== null || sd !== null || ey !== null || em !== null || ed !== null)) issue('Informe somente o ano.')
  if (precision === 'month' && (sy === null || sm === null || sd !== null || ey !== null || em !== null || ed !== null)) issue('Informe o mês e o ano.')
  if (precision === 'day' && (sy === null || sm === null || sd === null || ey !== null || em !== null || ed !== null)) issue('Informe dia, mês e ano.')
  if (precision === 'range') {
    if (sy === null || ey === null) issue('Informe os anos inicial e final do intervalo.')
    else {
      const start = sy * 10000 + (sm ?? 1) * 100 + (sd ?? 1)
      const end = ey * 10000 + (em ?? 12) * 100 + (ed ?? 31)
      if (start > end) issue('O início do intervalo deve ser anterior ao fim.')
    }
  }
})
export type EventInput = z.infer<typeof eventInputSchema>
export type Event = EventRow
export const momentLabel = { family: 'Familiar', individual: 'Individual', other: 'Outro momento' } as const
const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
function partialDate(year: number | null, month: number | null, day: number | null) {
  if (year === null) return 'Data desconhecida'
  if (month === null) return String(year)
  if (day === null) return `${months[month - 1]} de ${year}`
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}
export function formatEventDate(event: Event) {
  const { date_precision: precision, start_year: year, start_month: month, start_day: day } = event
  const label = precision === 'range'
    ? `Entre ${partialDate(year, month, day)} e ${partialDate(event.end_year, event.end_month, event.end_day)}`
    : precision === 'unknown' ? 'Data desconhecida' : partialDate(year, month, day)
  return event.approximate_date_label ? `${label} · ${event.approximate_date_label}` : label
}
export function sortEvents(events: Event[]) {
  return [...events].sort((a, b) =>
    (b.start_year ?? -1) - (a.start_year ?? -1) ||
    (b.start_month ?? 0) - (a.start_month ?? 0) ||
    (b.start_day ?? 0) - (a.start_day ?? 0) ||
    b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id),
  )
}
