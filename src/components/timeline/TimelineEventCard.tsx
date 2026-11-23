import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { PhotoMosaic } from './PhotoMosaic'
import type { TimelineEvent, TimelinePlacement } from './timeline-model'

interface TimelineEventCardProps {
  event: TimelineEvent
  placement: TimelinePlacement
  focused: boolean
  distance: number
  onSelect: () => void
  showDetailsLink?: boolean
  photoUrls?: string[]
  photoError?: boolean
}

export function TimelineEventCard({
  event,
  placement,
  focused,
  distance,
  onSelect,
  showDetailsLink = true,
  photoUrls,
  photoError,
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
          <PhotoMosaic urls={photoUrls ?? (event.coverUrl ? [event.coverUrl] : undefined)} error={photoError} />
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
