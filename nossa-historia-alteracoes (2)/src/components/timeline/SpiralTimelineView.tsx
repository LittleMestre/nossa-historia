import { Link } from '@tanstack/react-router'
import { ArrowUpRight, CalendarDays, ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TimelineControls } from './TimelineControls'
import { TimelineFocusIndicator } from './TimelineFocusIndicator'
import { TimelineYearNavigator } from './TimelineYearNavigator'
import { createTimelineItems } from './timeline-model'
import type { TimelineEvent, TimelineItem } from './timeline-model'
import {
  DESKTOP_SPIRAL,
  MOBILE_SPIRAL,
  approach,
  dragToOffset,
  spiralTransform,
  visibleRange,
} from './spiral-model'

interface SpiralTimelineViewProps {
  events: TimelineEvent[]
  showDetailsLink?: boolean
}

export function SpiralTimelineView({ events, showDetailsLink = true }: SpiralTimelineViewProps) {
  const [today] = useState(() => new Date())
  const [jumpYear, setJumpYear] = useState<number | null>(null)
  const [focusedKey, setFocusedKey] = useState('today')
  const items = useMemo(() => createTimelineItems(events, today, jumpYear), [events, today, jumpYear])
  const targetIndex = Math.max(0, items.findIndex((i) => i.key === focusedKey))
  const focusedItem = items[targetIndex] ?? items[0]!
  const focusedYear = focusedItem.kind === 'event' ? focusedItem.event.year : focusedItem.year

  const [isMobile, setIsMobile] = useState(false)
  const config = isMobile ? MOBILE_SPIRAL : DESKTOP_SPIRAL
  const [anim, setAnim] = useState(targetIndex)
  const animRef = useRef(targetIndex)
  const dragRef = useRef<{ x: number; base: number; moved: boolean; id: number } | null>(null)
  const dragOffsetRef = useRef(0)
  const suppressClickRef = useRef(false)
  const reduceRef = useRef(false)
  const targetRef = useRef(targetIndex)
  targetRef.current = targetIndex

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      setIsMobile(mq.matches)
      reduceRef.current = rm.matches
    }
    update()
    mq.addEventListener('change', update)
    rm.addEventListener('change', update)
    return () => {
      mq.removeEventListener('change', update)
      rm.removeEventListener('change', update)
    }
  }, [])

  // Laço de animação: interpola o foco contínuo em direção ao índice alvo (+ arraste).
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const goal = targetRef.current + dragOffsetRef.current
      const next = reduceRef.current || dragRef.current?.moved ? goal : approach(animRef.current, goal, dt)
      if (next !== animRef.current) {
        animRef.current = next
        setAnim(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function select(key: string) {
    setFocusedKey(key)
  }

  function jumpToYear(year: number) {
    const match = items.find((i) => i.kind === 'event' && i.event.year === year)
    if (match) return setFocusedKey(match.key)
    if (year === today.getFullYear()) {
      setJumpYear(null)
      return setFocusedKey('today')
    }
    setJumpYear(year)
    setFocusedKey(`year-${year}`)
  }

  function move(direction: -1 | 1) {
    const next = targetIndex + direction
    if (next >= 0 && next < items.length) select(items[next]!.key)
    else jumpToYear(focusedYear + direction)
  }

  function returnToday() {
    setJumpYear(null)
    setFocusedKey('today')
  }

  const pxPerItem = isMobile ? 90 : 160

  function pointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragRef.current = { x: e.clientX, base: targetIndex, moved: false, id: e.pointerId }
  }
  function pointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.x
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (drag.moved) dragOffsetRef.current = dragToOffset(dx, pxPerItem)
  }
  function pointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (drag?.moved) {
      suppressClickRef.current = true
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(drag.base + dragOffsetRef.current)))
      animRef.current = drag.base + dragOffsetRef.current
      dragOffsetRef.current = 0
      setFocusedKey(items[idx]!.key)
    }
    dragOffsetRef.current = 0
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function keyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (['ArrowLeft', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      move(-1)
    } else if (['ArrowRight', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      move(1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      returnToday()
    }
  }

  const [start, end] = visibleRange(anim, items.length, config.window)
  const visible = items.slice(start, end + 1).map((item, k) => ({ item, index: start + k }))
  // trilha da hélice (pontos discretos ao longo do caminho)
  const trail = useMemo(() => {
    const pts: { key: number; t: ReturnType<typeof spiralTransform> }[] = []
    for (let s = -config.window * 6; s <= config.window * 6; s++) {
      const d = s / 6 + (Math.round(anim * 6) / 6 - anim)
      pts.push({ key: s, t: spiralTransform(d, config) })
    }
    return pts
  }, [anim, config])

  return (
    <section className="spiral-timeline" aria-label="Linha do tempo em espiral">
      <div className="spiral-topbar">
        <TimelineYearNavigator focusedYear={focusedYear} onJump={jumpToYear} />
      </div>
      <div
        className="spiral-stage"
        tabIndex={0}
        role="region"
        aria-label="Eventos em espiral cronológica; use as setas do teclado, arraste ou deslize"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onKeyDown={keyDown}
        onClickCapture={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault()
            e.stopPropagation()
            suppressClickRef.current = false
          }
        }}
      >
        <span className="spiral-orient spiral-orient-future" aria-hidden="true">Futuro ↑</span>
        <span className="spiral-orient spiral-orient-past" aria-hidden="true">Passado ↓</span>
        <div className="spiral-scene">
          <div className="spiral-world">
            {trail.map(({ key, t }) => (
              <span
                key={key}
                className="spiral-trail-dot"
                aria-hidden="true"
                style={{
                  transform: `translate3d(${t.x}px, ${t.y}px, ${t.z}px)`,
                  opacity: 0.25 + t.opacity * 0.6,
                  scale: String(t.scale),
                }}
              />
            ))}
            {visible.map(({ item, index }) => {
              const t = spiralTransform(index - anim, config)
              const focused = item.key === focusedKey
              return (
                <div
                  key={item.key}
                  className={`spiral-node${focused ? ' is-focused' : ''}${item.kind !== 'event' ? ' is-marker' : ''}`}
                  data-timeline-key={item.key}
                  style={{
                    transform: `translate3d(${t.x}px, ${t.y}px, ${t.z}px) translate(-50%, -50%) scale(${t.scale})`,
                    opacity: t.opacity,
                    zIndex: t.zIndex,
                    filter: `saturate(${t.saturation}) blur(${t.blur.toFixed(2)}px)`,
                    pointerEvents: t.opacity < 0.08 ? 'none' : undefined,
                  }}
                >
                  {item.kind === 'event' ? (
                    <SpiralCard item={item} focused={focused} onSelect={() => select(item.key)} showDetailsLink={showDetailsLink} />
                  ) : (
                    <SpiralMarker item={item} focused={focused} onSelect={() => select(item.key)} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {events.length === 0 && (
          <div className="spiral-empty">
            <CalendarDays size={20} />
            <strong>Sua história começa aqui.</strong>
            <span>As lembranças da família girarão nesta espiral quando forem cadastradas.</span>
          </div>
        )}
      </div>
      <div className="cinema-bottom">
        <TimelineFocusIndicator item={focusedItem} today={today} totalEvents={events.length} />
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

function SpiralCard({
  item,
  focused,
  onSelect,
  showDetailsLink,
}: {
  item: Extract<TimelineItem, { kind: 'event' }>
  focused: boolean
  onSelect: () => void
  showDetailsLink: boolean
}) {
  const { event } = item
  return (
    <div className="spiral-card-wrap">
      <button
        type="button"
        className="spiral-card"
        onClick={onSelect}
        aria-pressed={focused}
        aria-label={`Selecionar ${event.title}, ${event.dateLabel}`}
      >
        <span className="spiral-photo">
          {event.coverUrl ? (
            <img src={event.coverUrl} alt="" draggable={false} />
          ) : (
            <span className="cinema-photo-empty">
              <ImageIcon size={30} strokeWidth={1.25} />
              <span>Sem capa</span>
            </span>
          )}
        </span>
        <span className="spiral-meta">
          <span className="spiral-date">{event.dateLabel}</span>
          <strong>{event.title}</strong>
          {event.category && <small>{event.category}</small>}
        </span>
      </button>
      {focused && showDetailsLink && (
        <Link className="cinema-open spiral-open" to="/eventos/$eventId" params={{ eventId: event.id }}>
          Abrir álbum <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  )
}

function SpiralMarker({
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
      className={`spiral-marker${focused ? ' is-focused' : ''}`}
      onClick={onSelect}
      aria-pressed={focused}
      aria-label={item.kind === 'today' ? `Hoje, ${item.year}` : `Ano de ${item.year}`}
    >
      <span>{item.kind === 'today' ? 'Presente · Hoje' : 'Ano'}</span>
      <strong>{item.year}</strong>
    </button>
  )
}
