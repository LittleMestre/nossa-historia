import { Link } from '@tanstack/react-router'
import { ArrowUpRight, ImageIcon } from 'lucide-react'
import type { TimelineEvent, TimelinePlacement } from './timeline-model'

interface TimelineEventCardProps {
  event: TimelineEvent
  placement: TimelinePlacement
  focused: boolean
  distance: number
  onSelect: () => void
  showDetailsLink?: boolean
}

export function TimelineEventCard({
  event,
  placement,
  focused,
  distance,
  onSelect,
  showDetailsLink = true,
}: TimelineEventCardProps) {
  return (
    <div
      className={`cinema-event cinema-event-${placement} cinema-distance-${Math.min(distance, 3)}${focused ? ' is-focused' : ''}`}
    >
      <div className="cinema-connector" aria-hidden="true" />
      <span className="cinema-dot" aria-hidden="true" />
      <button
        type="button"
        className="cinema-card"
        onClick={onSelect}
        aria-pressed={focused}
        aria-label={`Selecionar ${event.title}, ${event.dateLabel}`}
      >
        <span className="cinema-photo">
          {event.coverUrl ? (
            <img src={event.coverUrl} alt="" loading="lazy" />
          ) : (
            <span className="cinema-photo-empty">
              <ImageIcon size={30} strokeWidth={1.25} />
              <span>Sem capa</span>
            </span>
          )}
        </span>
        <span className="cinema-card-meta">
          <span className="cinema-card-date">{event.dateLabel}</span>
          <strong>{event.title}</strong>
          {event.category && <small>{event.category}</small>}
        </span>
      </button>
      {focused && showDetailsLink && (
        <Link
          className="cinema-open"
          to="/eventos/$eventId"
          params={{ eventId: event.id }}
          aria-label={`Abrir álbum de ${event.title}`}
        >
          Abrir álbum <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  )
}
