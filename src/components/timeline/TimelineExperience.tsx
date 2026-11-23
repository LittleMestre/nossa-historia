import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Search, Sparkles } from 'lucide-react'
import { SpiralTimelineView } from './SpiralTimelineView'
import { TimelineView } from './TimelineView'
import type { TimelineEvent } from './timeline-model'
import type { UndatedEvent } from '../../features/events/timeline'

export function TimelineExperience({
  events,
  undated = [],
  canCreate = false,
  view = 'horizontal',
}: {
  events: TimelineEvent[]
  undated?: UndatedEvent[]
  canCreate?: boolean
  view?: 'horizontal' | 'spiral'
}) {
  const noEvents = events.length === 0 && undated.length === 0
  return (
    <div
      className={`timeline-experience${view === 'spiral' ? ' is-spiral' : ''}`}
    >
      <header className="timeline-intro">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> O tempo guarda histórias
          </span>
          <h1>
            Uma vida inteira de <em>momentos.</em>
          </h1>
          <p>
            Viaje pelas lembranças da família. Cada fotografia encontrará seu
            lugar no tempo.
          </p>
        </div>
        <div className="timeline-intro-aside">
          <span className="intro-ornament" aria-hidden="true">
            ✳
          </span>
          <span>O passado vive nas histórias que contamos juntos.</span>
        </div>
      </header>
      <div className="timeline-utility">
        <div className="timeline-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Encontre uma pessoa, lugar ou ocasião"
            aria-label="Pesquisa de memórias, disponível em breve"
            disabled
          />
          <span>Busca em breve</span>
        </div>
        <Link to="/galeria">
          Explorar galeria <ArrowUpRight size={17} />
        </Link>
      </div>
      {view === 'spiral' ? (
        <SpiralTimelineView events={events} hasUndated={undated.length > 0} />
      ) : (
        <TimelineView events={events} hasUndated={undated.length > 0} />
      )}
      {undated.length > 0 && <section className="inner-page" aria-labelledby="undated-heading">
        <h2 id="undated-heading">Eventos sem data</h2>
        <p>Esses acontecimentos não têm uma posição conhecida no tempo.</p>
        <ul className="event-list">{undated.map((event) => <li key={event.id}>
          <Link className="event-card" to="/eventos/$eventId" params={{ eventId: event.id }}>
            <span className="eyebrow">{event.dateLabel}</span>
            <h3>{event.title}</h3>
            {event.category && <span>{event.category}</span>}
            <span className="event-detail-link">Ver detalhes →</span>
          </Link>
        </li>)}</ul>
      </section>}
      <div className="timeline-afterword">
        <span>{noEvents ? 'O primeiro capítulo da família ainda está por vir.' : 'Explore os acontecimentos registrados pela família.'}</span>
        <Link to="/eventos">{noEvents && canCreate ? 'Cadastrar primeiro evento' : 'Ver área de eventos'} <ArrowUpRight size={15} /></Link>
      </div>
    </div>
  )
}
