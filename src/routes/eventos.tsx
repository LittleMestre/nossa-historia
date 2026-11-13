import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CalendarPlus2, BookOpenText } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { EventForm } from '../components/events/EventForm'
import { PageHeading } from '../components/layout/PageHeading'
import { Button } from '../components/ui/button'
import { createEvent, getEventsPage } from '../features/events/events'
import { formatEventDate, momentLabel } from '../features/events/model'

export const Route = createFileRoute('/eventos')({ loader: () => getEventsPage(), component: EventsPage })
function EventsPage() {
  const { events, categories, locations, role, spaceName } = Route.useLoaderData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const canCreate = role !== 'viewer'
  async function save(input: Parameters<typeof createEvent>[0]['data']['event']) {
    const result = await createEvent({ data: { event: input } })
    if (result.error) return result.error
    setCreating(false)
    setNotice('Evento criado com sucesso.')
    try {
      await router.invalidate()
    } catch {
      setNotice('Evento salvo. Não foi possível atualizar a lista agora; recarregue a página.')
    }
    return null
  }
  return <div className="inner-page">
    <PageHeading eyebrow="Capítulos da família" title="Eventos" description={`Acontecimentos de ${spaceName}.`}
      action={canCreate && !creating ? <Button onClick={() => setCreating(true)}><CalendarPlus2 size={16} /> Criar evento</Button> : undefined} />
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {creating && <section className="event-panel"><h2 className="text-2xl font-semibold">Novo acontecimento</h2><EventForm categories={categories} locations={locations} onCancel={() => setCreating(false)} onSave={save} /></section>}
    {!events.length ? <EmptyState icon={BookOpenText} title="O primeiro capítulo ainda está por vir" description="Os acontecimentos registrados pela família aparecerão aqui."
      action={canCreate && !creating ? <Button onClick={() => setCreating(true)}>Criar primeiro evento</Button> : undefined} /> :
      <ul className="event-list">{events.map((event) => <li key={event.id}><Link to="/eventos/$eventId" params={{ eventId: event.id }} className="event-card"><div className="event-card-top"><span className="eyebrow">{formatEventDate(event)}</span><span>{categories.find((item) => item.id === event.category_id)?.name ?? momentLabel[event.moment_type]}</span></div><h2>{event.title}</h2>{event.description && <p>{event.description}</p>}<span className="event-detail-link">Ver detalhes →</span></Link></li>)}</ul>}
  </div>
}
