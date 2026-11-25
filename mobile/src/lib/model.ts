export type Role = 'admin' | 'contributor' | 'viewer'
export type Space = { id: string; name: string; role: Role }
export type Event = {
  location?: string
  id: string
  space_id: string
  title: string
  description: string | null
  moment_type: 'family' | 'individual' | 'other'
  created_by: string
  category_id: string | null
  date_precision: 'day' | 'month' | 'year' | 'range' | 'unknown'
  start_year: number | null
  start_month: number | null
  start_day: number | null
  end_year: number | null
  end_month: number | null
  end_day: number | null
  approximate_date_label: string | null
  created_at: string
}
export type Photo = {
  created_by?: string
  id: string
  event_id: string
  description: string | null
  storage_path: string
  asset?: number
  url?: string
}
export type Person = {
  id: string
  name: string
  nickname?: string | null
  description?: string | null
  created_by?: string
}
export type Data = {
  people: Person[]
  events: Event[]
  categories: Record<string, string>
  photos: Photo[]
  participants: Record<string, Person[]>
}
const months = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]
function partial(y: number | null, m: number | null, d: number | null) {
  if (y === null) return 'Data desconhecida'
  if (m === null) return String(y)
  if (d === null) return `${months[m - 1]} de ${y}`
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}
export function eventDate(event: Event) {
  const start = partial(event.start_year, event.start_month, event.start_day)
  const label =
    event.date_precision === 'range'
      ? `Entre ${start} e ${partial(event.end_year, event.end_month, event.end_day)}`
      : event.date_precision === 'unknown'
        ? 'Data desconhecida'
        : start
  return event.approximate_date_label
    ? `${label} · ${event.approximate_date_label}`
    : label
}
export function sortEvents(events: Event[]) {
  return [...events].sort(
    (a, b) =>
      (b.start_year ?? -1) - (a.start_year ?? -1) ||
      (b.start_month ?? 0) - (a.start_month ?? 0) ||
      (b.start_day ?? 0) - (a.start_day ?? 0) ||
      b.created_at.localeCompare(a.created_at) ||
      a.id.localeCompare(b.id),
  )
}
