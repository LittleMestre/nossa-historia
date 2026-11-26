import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SpiralTimelineView } from './SpiralTimelineView'
import { TimelineView } from './TimelineView'
import { createTimelineItems } from './timeline-model'
import type { TimelineEvent, MomentType } from './timeline-model'
import type { UndatedEvent } from '../../features/events/timeline'
import { availableTimelineYears, emptyTimelineFilters, filterTimeline } from '../../features/events/timeline-filters'
import type { TimelineFilters } from '../../features/events/timeline-filters'
import type { TimelinePhotoEntry } from './useTimelinePhotos'

export function TimelineExperience({
  events,
  undated = [],
  categories,
  canCreate = false,
  view = 'horizontal',
}: {
  events: TimelineEvent[]
  undated?: UndatedEvent[]
  categories?: { id: string; name: string }[]
  canCreate?: boolean
  view?: 'horizontal' | 'spiral'
}) {
  const noEvents = events.length === 0 && undated.length === 0
  const [filters, setFilters] = useState<TimelineFilters>(emptyTimelineFilters)
  const photoCache = useRef(new Map<string, TimelinePhotoEntry>())
  const years = useMemo(() => availableTimelineYears(events), [events])
  useEffect(() => {
    setFilters((current) => ({
      ...current,
      year: current.year !== null && current.year !== 'undated' && !years.includes(current.year)
        ? null : current.year === 'undated' && !undated.length ? null : current.year,
      categoryId: current.categoryId && !categories?.some((category) => category.id === current.categoryId)
        ? null : current.categoryId,
    }))
  }, [years, categories, undated.length])
  const filtered = useMemo(() => filterTimeline(events, undated, filters), [events, undated, filters])
  const hasFilters = filters.year !== null || filters.categoryId !== null || filters.momentType !== null
  const focusKey = useMemo(() => hasFilters
    ? createTimelineItems(filtered.events, new Date(), null).find((item) => item.kind === 'event')?.key ?? 'today'
    : 'today', [filtered.events, hasFilters])
  const filterKey = `${filters.year ?? 'all'}:${filters.categoryId ?? 'all'}:${filters.momentType ?? 'all'}`
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
        <Link className="timeline-search" to="/buscar">
          <Search size={18} aria-hidden="true" />
          <span>Buscar por título ou descrição</span>
        </Link>
        <Link className="timeline-gallery-link" to="/galeria">
          Explorar galeria <ArrowUpRight size={17} />
        </Link>
      </div>
      {categories && <section className="timeline-filters" aria-label="Filtrar acontecimentos">
        <label>Ano
          <select value={filters.year ?? ''} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value === '' ? null : event.target.value === 'undated' ? 'undated' : Number(event.target.value) }))}>
            <option value="">Todos os anos</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
            {undated.length > 0 && <option value="undated">Eventos sem data</option>}
          </select>
        </label>
        <label>Categoria
          <select value={filters.categoryId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value || null }))}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label>Tipo de momento
          <select value={filters.momentType ?? ''} onChange={(event) => setFilters((current) => ({ ...current, momentType: (event.target.value || null) as MomentType | null }))}>
            <option value="">Todos</option>
            <option value="family">Familiar</option>
            <option value="individual">Individual</option>
            <option value="other">Outros momentos</option>
          </select>
        </label>
        <div className="timeline-filter-summary" role="status">
          <span>{filtered.count} acontecimento{filtered.count === 1 ? '' : 's'} encontrado{filtered.count === 1 ? '' : 's'}</span>
          {hasFilters && <button type="button" onClick={() => setFilters(emptyTimelineFilters)}>Limpar filtros</button>}
        </div>
      </section>}
      {(!hasFilters || (filtered.events.length > 0 && filters.year !== 'undated')) && (view === 'spiral' ? (
        <SpiralTimelineView key={filterKey} events={filtered.events} hasUndated={filtered.undated.length > 0} initialFocusKey={focusKey} photoCache={photoCache} />
      ) : (
        <TimelineView key={filterKey} events={filtered.events} hasUndated={filtered.undated.length > 0} initialFocusKey={focusKey} photoCache={photoCache} />
      ))}
      {hasFilters && filtered.count === 0 && <div className="timeline-filter-empty" role="status">
        <strong>Nenhum acontecimento encontrado.</strong>
        <span>Experimente outra combinação de filtros.</span>
      </div>}
      {filtered.undated.length > 0 && <section className="inner-page" aria-labelledby="undated-heading">
        <h2 id="undated-heading">Eventos sem data</h2>
        <p>Esses acontecimentos não têm uma posição conhecida no tempo.</p>
        <ul className="event-list">{filtered.undated.map((event) => <li key={event.id}>
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
