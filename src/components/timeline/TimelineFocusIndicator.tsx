import type { TimelineItem } from './timeline-model'

interface TimelineFocusIndicatorProps {
  item: TimelineItem
  today: Date
  totalEvents: number
}

export function TimelineFocusIndicator({
  item,
  today,
  totalEvents,
}: TimelineFocusIndicatorProps) {
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today)
  const title =
    item.kind === 'event'
      ? item.event.title
      : item.kind === 'today'
        ? 'Hoje'
        : `Ano de ${item.year}`
  const date =
    item.kind === 'event'
      ? item.event.dateLabel
      : item.kind === 'today'
        ? todayLabel
        : 'Nenhum evento neste ano ainda'

  return (
    <div className="cinema-focus" aria-live="polite">
      <div>
        <span className="section-kicker">Em foco</span>
        <strong>{title}</strong>
        <span>{date}</span>
      </div>
      <p>
        {totalEvents === 0
          ? 'A linha do tempo está pronta para receber as lembranças da família.'
          : 'Arraste, deslize ou use as setas para viajar entre os momentos.'}
      </p>
    </div>
  )
}
