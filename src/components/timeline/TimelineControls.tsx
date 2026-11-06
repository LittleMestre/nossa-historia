import { ChevronLeft, ChevronRight, LocateFixed } from 'lucide-react'

interface TimelineControlsProps {
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  isToday: boolean
}

export function TimelineControls({
  onPrevious,
  onNext,
  onToday,
  isToday,
}: TimelineControlsProps) {
  return (
    <div className="cinema-controls">
      <div className="cinema-arrow-group">
        <button
          className="cinema-arrow"
          type="button"
          onClick={onPrevious}
          aria-label="Evento ou período anterior"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          className="cinema-arrow"
          type="button"
          onClick={onNext}
          aria-label="Próximo evento ou período"
        >
          <ChevronRight size={22} />
        </button>
      </div>
      <button
        className="cinema-today-button"
        type="button"
        onClick={onToday}
        disabled={isToday}
      >
        <LocateFixed size={16} /> Voltar para hoje
      </button>
    </div>
  )
}
