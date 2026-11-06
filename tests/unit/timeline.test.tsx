// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TimelineView } from '../../src/components/timeline/TimelineView'
import { createTimelineItems } from '../../src/components/timeline/timeline-model'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    'aria-label': label,
  }: {
    children: ReactNode
    'aria-label'?: string
  }) => (
    <a href="#album" aria-label={label}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({ matches: false })),
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('horizontal timeline', () => {
  it('starts at the real current year and permits jumping to a year without events', () => {
    const currentYear = new Date().getFullYear()
    render(<TimelineView events={[]} />)

    expect(
      screen.getByRole('button', { name: `Hoje, ${currentYear}` }),
    ).toBeTruthy()
    expect(screen.getByText('Sua linha do tempo começa aqui.')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Ir para o ano'), {
      target: { value: '1999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ir' }))
    expect(screen.getByRole('button', { name: 'Ano de 1999' })).toBeTruthy()
    expect(screen.getByText('Nenhum evento neste ano ainda')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para hoje' }))
    expect(
      screen
        .getByRole('button', { name: `Hoje, ${currentYear}` })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('sorts events chronologically and preserves explicit placement', () => {
    const items = createTimelineItems(
      [
        {
          id: 'future',
          title: 'Futuro',
          year: 2028,
          month: 1,
          dateLabel: '2028',
          placement: 'below',
        },
        {
          id: 'past',
          title: 'Passado',
          year: 2018,
          dateLabel: '2018',
          placement: 'above',
        },
      ],
      new Date(2026, 10, 6),
      null,
    )

    expect(items.map((item) => item.key)).toEqual(['past', 'today', 'future'])
    expect(items[0]).toMatchObject({ placement: 'above' })
    expect(items[2]).toMatchObject({ placement: 'below' })
  })

  it('selects an event by keyboard and exposes its album link', () => {
    const currentYear = new Date().getFullYear()
    render(
      <TimelineView
        events={[
          {
            id: 'family',
            title: 'Encontro de família',
            year: currentYear - 1,
            dateLabel: String(currentYear - 1),
            placement: 'above',
          },
        ]}
      />,
    )

    fireEvent.keyDown(
      screen.getByRole('region', { name: /Eventos em ordem cronológica/ }),
      { key: 'ArrowLeft' },
    )
    const card = screen.getByRole('button', {
      name: `Selecionar Encontro de família, ${currentYear - 1}`,
    })
    expect(card.getAttribute('aria-pressed')).toBe('true')
    expect(card.closest('.cinema-event-above')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Abrir álbum de Encontro de família' }),
    ).toBeTruthy()
  })
})
