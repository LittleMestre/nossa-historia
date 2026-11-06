export type TimelinePlacement = 'above' | 'below'

export interface TimelineEvent {
  id: string
  title: string
  dateLabel: string
  year: number
  month?: number | null
  day?: number | null
  category?: string | null
  coverUrl?: string | null
  placement?: TimelinePlacement | null
}

export type TimelineItem =
  | {
      kind: 'event'
      key: string
      event: TimelineEvent
      placement: TimelinePlacement
    }
  | { kind: 'today'; key: 'today'; year: number }
  | { kind: 'year'; key: string; year: number }

function chronologicalValue(year: number, month = 0, day = 0) {
  return year * 10_000 + month * 100 + day
}

export function createTimelineItems(
  events: TimelineEvent[],
  today: Date,
  jumpYear: number | null,
): TimelineItem[] {
  const sorted = events
    .map((event, originalIndex) => ({ event, originalIndex }))
    .sort(
      (a, b) =>
        chronologicalValue(a.event.year, a.event.month ?? 0, a.event.day ?? 0) -
          chronologicalValue(
            b.event.year,
            b.event.month ?? 0,
            b.event.day ?? 0,
          ) || a.originalIndex - b.originalIndex,
    )

  let unclassifiedIndex = 0
  const items: TimelineItem[] = sorted.map(({ event }) => {
    const placement =
      event.placement ?? (unclassifiedIndex++ % 2 === 0 ? 'above' : 'below')
    return { kind: 'event', key: event.id, event, placement }
  })

  items.push({ kind: 'today', key: 'today', year: today.getFullYear() })
  if (jumpYear !== null && jumpYear !== today.getFullYear()) {
    items.push({ kind: 'year', key: `year-${jumpYear}`, year: jumpYear })
  }

  return items.sort((a, b) => {
    const value = (item: TimelineItem) => {
      if (item.kind === 'event')
        return chronologicalValue(
          item.event.year,
          item.event.month ?? 0,
          item.event.day ?? 0,
        )
      if (item.kind === 'today')
        return chronologicalValue(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
        )
      return chronologicalValue(item.year, 1, 1)
    }
    return value(a) - value(b)
  })
}
