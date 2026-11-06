import { CalendarDays, MapPin } from 'lucide-react'

export interface EventCardData {
  id: string
  title: string
  dateLabel: string
  summary?: string
  location?: string
  coverUrl?: string
  year: number | null
  month: number | null
}

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <article className="event-card">
      <div className="event-cover">
        {event.coverUrl ? (
          <img src={event.coverUrl} alt="" loading="lazy" />
        ) : (
          <CalendarDays size={34} strokeWidth={1.25} />
        )}
      </div>
      <div className="event-card-body">
        <span className="event-date">{event.dateLabel}</span>
        <h3>{event.title}</h3>
        {event.summary && <p>{event.summary}</p>}
        <div className="event-card-bottom">
          {event.location && (
            <span>
              <MapPin size={14} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
