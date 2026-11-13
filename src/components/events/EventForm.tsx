import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { eventInputSchema } from '../../features/events/model'
import type { Event, EventInput } from '../../features/events/model'

type Field = 'start_year' | 'start_month' | 'start_day' | 'end_year' | 'end_month' | 'end_day'
type Draft = Omit<EventInput, Field> & Record<Field, string>
const numberFields: Field[] = ['start_year', 'start_month', 'start_day', 'end_year', 'end_month', 'end_day']
function initial(event?: Event): Draft {
  return {
    title: event?.title ?? '', description: event?.description ?? '', moment_type: event?.moment_type ?? 'family',
    date_precision: event?.date_precision ?? 'day',
    start_year: event?.start_year?.toString() ?? '', start_month: event?.start_month?.toString() ?? '', start_day: event?.start_day?.toString() ?? '',
    end_year: event?.end_year?.toString() ?? '', end_month: event?.end_month?.toString() ?? '', end_day: event?.end_day?.toString() ?? '',
    approximate_date_label: event?.approximate_date_label ?? '', category_id: event?.category_id ?? null, location_id: event?.location_id ?? null,
  }
}
export function EventForm({ event, categories, locations, onSave, onCancel }: {
  event?: Event
  categories: { id: string; name: string }[]
  locations: { id: string; name: string }[]
  onSave: (input: EventInput) => Promise<string | null>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(() => initial(event))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((old) => ({ ...old, [key]: value }))
  function dateField(field: Field, label: string, min: number, max: number) {
    return <label className="grid gap-1 text-sm" key={field}>{label}
      <input className="event-input" type="number" min={min} max={max} inputMode="numeric" value={draft[field]} onChange={(e) => set(field, e.target.value)} />
    </label>
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (inFlight.current) return
    setError('')
    const values = Object.fromEntries(numberFields.map((field) => [field, draft[field] === '' ? null : Number(draft[field])]))
    const precision = draft.date_precision
    const normalized = {
      ...draft, ...values,
      ...(precision === 'unknown' ? Object.fromEntries(numberFields.map((field) => [field, null])) : {}),
      ...(precision !== 'range' ? { end_year: null, end_month: null, end_day: null } : {}),
      ...(precision === 'year' ? { start_month: null, start_day: null } : {}),
      ...(precision === 'month' ? { start_day: null } : {}),
      category_id: draft.category_id || null, location_id: draft.location_id || null,
      approximate_date_label: draft.approximate_date_label || null,
    }
    const parsed = eventInputSchema.safeParse(normalized)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira as informações do evento.')
      return
    }
    inFlight.current = true
    setBusy(true)
    try {
      const message = await onSave(parsed.data)
      if (message) setError(message)
    } catch {
      setError('Não foi possível salvar o evento. Tente novamente.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const precision = draft.date_precision
  return <form className="event-form" onSubmit={(e) => void submit(e)}>
    <label className="grid gap-1 text-sm">Título <span className="sr-only">obrigatório</span>
      <input className="event-input" value={draft.title} onChange={(e) => set('title', e.target.value)} maxLength={200} required autoFocus />
    </label>
    <label className="grid gap-1 text-sm">Descrição
      <textarea className="event-input min-h-28" value={draft.description} onChange={(e) => set('description', e.target.value)} maxLength={10000} />
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Precisão da data
        <select className="event-input" value={precision} onChange={(e) => set('date_precision', e.target.value as Draft['date_precision'])}>
          <option value="day">Dia</option><option value="month">Mês</option><option value="year">Ano</option><option value="range">Intervalo</option><option value="unknown">Desconhecida</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">Tipo de momento
        <select className="event-input" value={draft.moment_type} onChange={(e) => set('moment_type', e.target.value as Draft['moment_type'])}>
          <option value="family">Familiar</option><option value="individual">Individual</option><option value="other">Outro</option>
        </select>
      </label>
    </div>
    {precision !== 'unknown' && <fieldset className="event-date-fields"><legend>{precision === 'range' ? 'Início do intervalo' : 'Data do acontecimento'}</legend>
      <div className="grid gap-3 sm:grid-cols-3">{dateField('start_year', 'Ano', 1000, 9999)}
        {(precision === 'day' || precision === 'month' || precision === 'range') && dateField('start_month', precision === 'range' ? 'Mês (opcional)' : 'Mês', 1, 12)}
        {(precision === 'day' || precision === 'range') && dateField('start_day', precision === 'range' ? 'Dia (opcional)' : 'Dia', 1, 31)}
      </div></fieldset>}
    {precision === 'range' && <fieldset className="event-date-fields"><legend>Fim do intervalo</legend>
      <div className="grid gap-3 sm:grid-cols-3">{dateField('end_year', 'Ano', 1000, 9999)}{dateField('end_month', 'Mês (opcional)', 1, 12)}{dateField('end_day', 'Dia (opcional)', 1, 31)}</div>
    </fieldset>}
    <label className="grid gap-1 text-sm">Expressão aproximada (opcional)
      <input className="event-input" value={draft.approximate_date_label ?? ''} onChange={(e) => set('approximate_date_label', e.target.value)} maxLength={160} placeholder="Por volta de 2020" />
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Categoria (opcional)
        <select className="event-input" value={draft.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <label className="grid gap-1 text-sm">Localização (opcional)
        <select className="event-input" value={draft.location_id ?? ''} onChange={(e) => set('location_id', e.target.value || null)}><option value="">Sem localização</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
    </div>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : event ? 'Salvar alterações' : 'Criar evento'}</Button><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button></div>
  </form>
}
