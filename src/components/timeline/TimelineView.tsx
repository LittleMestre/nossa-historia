import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { TimelineAxis } from './TimelineAxis'
import { TimelineControls } from './TimelineControls'
import { TimelineEventCard } from './TimelineEventCard'
import { TimelineFocusIndicator } from './TimelineFocusIndicator'
import { TimelineYearNavigator } from './TimelineYearNavigator'
import { createTimelineItems } from './timeline-model'
import type { TimelineEvent, TimelineItem } from './timeline-model'

interface TimelineViewProps {
  events: TimelineEvent[]
  showDetailsLink?: boolean
}

export function TimelineView({
  events,
  showDetailsLink = true,
}: TimelineViewProps) {
  const [today] = useState(() => new Date())
  const [jumpYear, setJumpYear] = useState<number | null>(null)
  const [focusedKey, setFocusedKey] = useState('today')
  const items = useMemo(
    () => createTimelineItems(events, today, jumpYear),
    [events, today, jumpYear],
  )
  const viewportRef = useRef<HTMLDivElement>(null)
  const slotsRef = useRef(new Map<string, HTMLDivElement>())
  const pendingScrollRef = useRef<string | null>('today')
  const dragRef = useRef<{ x: number; scroll: number; moved: boolean } | null>(
    null,
  )
  const suppressClickRef = useRef(false)
  const scrollIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedIndex = Math.max(
    0,
    items.findIndex((item) => item.key === focusedKey),
  )
  const focusedItem = items[focusedIndex]
  const focusedYear =
    focusedItem.kind === 'event' ? focusedItem.event.year : focusedItem.year

  function scrollToItem(key: string, behavior: ScrollBehavior = 'smooth') {
    const viewport = viewportRef.current
    const slot = slotsRef.current.get(key)
    if (!viewport || !slot) return
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    viewport.scrollTo({
      left: slot.offsetLeft + slot.clientWidth / 2 - viewport.clientWidth / 2,
      behavior: reduceMotion ? 'instant' : behavior,
    })
  }

  useEffect(() => {
    const pending = pendingScrollRef.current
    if (pending) {
      scrollToItem(pending, pending === 'today' ? 'instant' : 'smooth')
      pendingScrollRef.current = null
    }
  }, [items])

  useEffect(
    () => () => {
      if (scrollIdleRef.current !== null) clearTimeout(scrollIdleRef.current)
    },
    [],
  )

  function select(key: string) {
    setFocusedKey(key)
    scrollToItem(key)
  }

  function jumpToYear(year: number) {
    const matchingEvent = items.find(
      (item) => item.kind === 'event' && item.event.year === year,
    )
    const key =
      matchingEvent?.key ??
      (year === today.getFullYear() ? 'today' : `year-${year}`)
    setFocusedKey(key)
    if (key === 'today' || matchingEvent) scrollToItem(key)
    else {
      pendingScrollRef.current = key
      setJumpYear(year)
    }
  }

  function move(direction: -1 | 1) {
    const nextIndex = focusedIndex + direction
    if (nextIndex >= 0 && nextIndex < items.length) select(items[nextIndex].key)
    else jumpToYear(focusedYear + direction)
  }

  function returnToday() {
    setFocusedKey('today')
    setJumpYear(null)
    scrollToItem('today')
  }

  function onScroll() {
    if (scrollIdleRef.current !== null) clearTimeout(scrollIdleRef.current)
    scrollIdleRef.current = setTimeout(() => {
      scrollIdleRef.current = null
      const viewport = viewportRef.current
      if (!viewport || items.length === 0) return
      const slot = slotsRef.current.get(items[0].key)
      if (!slot) return
      const padding =
        Number.parseFloat(getComputedStyle(viewport).paddingLeft) || 0
      const center = viewport.scrollLeft + viewport.clientWidth / 2
      const index = Math.max(
        0,
        Math.min(
          items.length - 1,
          Math.round(
            (center - padding - slot.clientWidth / 2) / slot.clientWidth,
          ),
        ),
      )
      setFocusedKey(items[index].key)
    }, 120)
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const viewport = viewportRef.current
    if (!viewport) return
    dragRef.current = {
      x: event.clientX,
      scroll: viewport.scrollLeft,
      moved: false,
    }
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const viewport = viewportRef.current
    if (!drag || !viewport) return
    const distance = event.clientX - drag.x
    if (Math.abs(distance) > 5 && !drag.moved) {
      drag.moved = true
      viewport.setPointerCapture(event.pointerId)
    }
    if (drag.moved) {
      viewport.classList.add('is-dragging')
      viewport.scrollLeft = drag.scroll - distance
    }
  }

  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current
    if (dragRef.current?.moved) suppressClickRef.current = true
    dragRef.current = null
    viewport?.classList.remove('is-dragging')
    if (viewport?.hasPointerCapture(event.pointerId))
      viewport.releasePointerCapture(event.pointerId)
  }

  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(event.key === 'ArrowLeft' ? -1 : 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      returnToday()
    }
  }

  return (
    <section className="cinema-timeline" aria-label="Linha do tempo horizontal">
      <div className="cinema-topbar">
        <div>
          <span className="section-kicker">Uma viagem pelas lembranças</span>
          <p>Deslize pela linha para explorar o passado e o futuro.</p>
        </div>
        <TimelineYearNavigator focusedYear={focusedYear} onJump={jumpToYear} />
      </div>
      <div className="cinema-stage">
        <TimelineAxis />
        <div
          className="cinema-viewport"
          ref={viewportRef}
          tabIndex={0}
          role="region"
          aria-label="Eventos em ordem cronológica; use as setas do teclado, arraste ou deslize"
          onScroll={onScroll}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onKeyDown={keyDown}
          onClickCapture={(event) => {
            if (suppressClickRef.current) {
              event.preventDefault()
              event.stopPropagation()
              suppressClickRef.current = false
            }
          }}
        >
          {items.map((item, index) => (
            <div
              className="cinema-slot"
              key={item.key}
              ref={(node) => {
                if (node) slotsRef.current.set(item.key, node)
                else slotsRef.current.delete(item.key)
              }}
              data-timeline-key={item.key}
            >
              {item.kind === 'event' ? (
                <TimelineEventCard
                  event={item.event}
                  placement={item.placement}
                  focused={focusedKey === item.key}
                  distance={Math.abs(index - focusedIndex)}
                  onSelect={() => select(item.key)}
                  showDetailsLink={showDetailsLink}
                />
              ) : (
                <TimeMarker
                  item={item}
                  focused={focusedKey === item.key}
                  onSelect={() => select(item.key)}
                />
              )}
            </div>
          ))}
        </div>
        {events.length === 0 && (
          <div className="cinema-empty">
            <CalendarDays size={20} />
            <strong>Sua linha do tempo começa aqui.</strong>
            <span>
              Os acontecimentos da família aparecerão ao longo deste eixo quando
              forem cadastrados.
            </span>
          </div>
        )}
      </div>
      <div className="cinema-bottom">
        <TimelineFocusIndicator
          item={focusedItem}
          today={today}
          totalEvents={events.length}
        />
        <TimelineControls
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
          onToday={returnToday}
          isToday={focusedKey === 'today'}
        />
      </div>
    </section>
  )
}

function TimeMarker({
  item,
  focused,
  onSelect,
}: {
  item: Extract<TimelineItem, { kind: 'today' | 'year' }>
  focused: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`cinema-time-marker${focused ? ' is-focused' : ''}`}
      onClick={onSelect}
      aria-pressed={focused}
      aria-label={
        item.kind === 'today' ? `Hoje, ${item.year}` : `Ano de ${item.year}`
      }
    >
      <span className="cinema-time-label">
        {item.kind === 'today' ? 'HOJE' : 'ANO'}
      </span>
      <strong>{item.year}</strong>
      <span className="cinema-time-dot" />
    </button>
  )
}
