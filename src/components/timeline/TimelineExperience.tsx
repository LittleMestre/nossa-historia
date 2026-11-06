import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Search, Sparkles } from 'lucide-react'
import { TimelineView } from './TimelineView'
import type { TimelineEvent } from './timeline-model'

export function TimelineExperience({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="timeline-experience">
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
      <TimelineView events={events} />
      <div className="timeline-afterword">
        <span>
          As primeiras lembranças aparecerão aqui quando o espaço privado
          estiver disponível.
        </span>
        <Link to="/eventos">
          Ver área de eventos <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  )
}
