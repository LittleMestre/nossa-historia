import { Link, createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { EventForm } from '../components/events/EventForm'
import { PageHeading } from '../components/layout/PageHeading'
import { Button } from '../components/ui/button'
import { deleteEvent, getEventDetail, updateEvent } from '../features/events/events'
import { formatEventDate, momentLabel } from '../features/events/model'
import type { EventInput } from '../features/events/model'

export const Route = createFileRoute('/eventos_/$eventId')({ loader: ({ params }) => getEventDetail({ data: { eventId: params.eventId } }), component: EventDetailPage })
function EventDetailPage() {
  const { event, categories, locations, authorName, canEdit } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function save(input: EventInput) {
    if (!event) return 'Evento não encontrado.'
    const result = await updateEvent({ data: { eventId: event.id, event: input } })
    if (result.error) return result.error
    setEditing(false)
    setNotice('Evento atualizado com sucesso.')
    try {
      await router.invalidate()
    } catch {
      setNotice('Evento salvo. Não foi possível atualizar os detalhes agora; recarregue a página.')
    }
    return null
  }
  async function remove() {
    if (!event || !window.confirm(`Excluir “${event.title}”? O registro ficará disponível para recuperação por um administrador.`)) return
    setBusy(true)
    try {
      const result = await deleteEvent({ data: { eventId: event.id } })
      if (result.error) setError(result.error)
      else {
        await navigate({ to: '/eventos' })
        await router.invalidate()
      }
    } catch { setError('Não foi possível excluir o evento.') } finally { setBusy(false) }
  }
  if (!event) return <div className="inner-page"><EmptyState icon={BookOpenText} title="Evento não encontrado" description="Este acontecimento não está disponível neste espaço familiar." action={<Link className="primary-link" to="/eventos">Voltar aos eventos</Link>} /></div>
  return <div className="inner-page"><PageHeading eyebrow="Álbum do acontecimento" title={event.title} description={formatEventDate(event)} />
    <Link className="event-back" to="/eventos">← Todos os eventos</Link>
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {editing ? <section className="event-panel"><h2 className="text-2xl font-semibold">Editar acontecimento</h2><EventForm event={event} categories={categories} locations={locations} onCancel={() => setEditing(false)} onSave={save} /></section> :
    <article className="event-panel"><div className="flex flex-wrap gap-2"><span className="event-tag">{momentLabel[event.moment_type]}</span>{categories.find((item) => item.id === event.category_id) && <span className="event-tag">{categories.find((item) => item.id === event.category_id)?.name}</span>}</div>
      {event.description && <p className="event-description">{event.description}</p>}
      {locations.find((item) => item.id === event.location_id) && <p><strong>Local:</strong> {locations.find((item) => item.id === event.location_id)?.name}</p>}
      {authorName && <p><strong>Registrado por:</strong> {authorName}</p>}
      {canEdit && <div className="flex flex-wrap gap-3 pt-4"><Button onClick={() => setEditing(true)}>Editar evento</Button><Button variant="destructive" onClick={() => void remove()} disabled={busy}>{busy ? 'Excluindo…' : 'Excluir evento'}</Button></div>}
      {error && <p role="alert" className="auth-error">{error}</p>}
    </article>}
  </div>
}
