import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { CalendarPlus2, BookOpenText } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { EventForm } from '../components/events/EventForm'
import type { SelectedEventPhoto } from '../components/events/EventForm'
import { PageHeading } from '../components/layout/PageHeading'
import { Button } from '../components/ui/button'
import { createEvent, getEventsPage } from '../features/events/events'
import { formatEventDate, momentLabel } from '../features/events/model'
import { uploadEventPhoto } from '../features/media/media'

export const Route = createFileRoute('/eventos')({ loader: () => getEventsPage(), component: EventsPage })
function EventsPage() {
  const { events, categories, locations, role, spaceName } = Route.useLoaderData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const createdId = useRef<string | null>(null)
  const [partialEventId, setPartialEventId] = useState<string | null>(null)
  const canCreate = role !== 'viewer'
  async function save(input: Parameters<typeof createEvent>[0]['data']['event'], photos: SelectedEventPhoto[], onPhotoResult: (id: string, error: string | null) => void) {
    if (!createdId.current) {
      const result = await createEvent({ data: { event: input } })
      if (result.error || !result.id) return result.error ?? 'Não foi possível criar o evento.'
      createdId.current = result.id
      setPartialEventId(result.id)
    }
    const failures: string[] = []
    for (const item of photos) {
      try {
        const form = new FormData()
        form.set('eventId', createdId.current)
        form.set('mediaId', item.id)
        form.set('file', item.file)
        const result = await uploadEventPhoto({ data: form })
        onPhotoResult(item.id, result.error)
        if (result.error) failures.push(item.file.name)
      } catch {
        onPhotoResult(item.id, 'Falha de conexão. Tente novamente.')
        failures.push(item.file.name)
      }
    }
    let refreshed = true
    try {
      await router.invalidate()
    } catch {
      refreshed = false
    }
    if (failures.length) return `Evento criado. Falha no envio de: ${failures.join(', ')}. Prepare uma nova tentativa ou abra os detalhes para adicionar fotos.`
    setCreating(false)
    setPartialEventId(null)
    createdId.current = null
    setNotice(refreshed ? 'Evento criado com sucesso.' : 'Evento criado. Não foi possível atualizar a lista agora; tente abrir Eventos novamente.')
    return null
  }
  return <div className="inner-page">
    <PageHeading eyebrow="Capítulos da família" title="Eventos" description={`Acontecimentos de ${spaceName}.`}
      action={canCreate && !creating ? <Button onClick={() => setCreating(true)}><CalendarPlus2 size={16} /> Criar evento</Button> : undefined} />
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {creating && <section className="event-panel"><h2 className="text-2xl font-semibold">Novo acontecimento</h2>{partialEventId && <p role="status">O evento já foi criado. Para alterá-lo, <Link to="/eventos/$eventId" params={{ eventId: partialEventId }}>abra seus detalhes</Link>. Aqui você pode tentar os envios novamente.</p>}<EventForm uploadOnly={!!partialEventId} categories={categories} locations={locations} onCancel={() => { createdId.current = null; setPartialEventId(null); setCreating(false); void router.invalidate() }} onSave={save} /></section>}
    {!events.length ? <EmptyState icon={BookOpenText} title="O primeiro capítulo ainda está por vir" description="Os acontecimentos registrados pela família aparecerão aqui."
      action={canCreate && !creating ? <Button onClick={() => setCreating(true)}>Criar primeiro evento</Button> : undefined} /> :
      <ul className="event-list">{events.map((event) => <li key={event.id}><Link to="/eventos/$eventId" params={{ eventId: event.id }} className="event-card"><div className="event-card-top"><span className="eyebrow">{formatEventDate(event)}</span><span>{categories.find((item) => item.id === event.category_id)?.name ?? momentLabel[event.moment_type]}</span></div><h2>{event.title}</h2>{event.description && <p>{event.description}</p>}<span className="event-detail-link">Ver detalhes →</span></Link></li>)}</ul>}
  </div>
}
