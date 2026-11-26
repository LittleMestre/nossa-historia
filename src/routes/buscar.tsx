import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'
import { Button } from '../components/ui/button'
import { momentLabel } from '../features/events/model'
import {
  eventSearchPageSize,
  eventSearchTextLimit,
  eventSearchYearSchema,
  getEventSearchCategories,
  searchEvents,
} from '../features/events/search'
import { emptyTimelineFilters } from '../features/events/timeline-filters'
import type { TimelineFilters } from '../features/events/timeline-filters'

export const Route = createFileRoute('/buscar')({ component: SearchPage })

function SearchPage() {
  const { user, activeSpace } = Route.useRouteContext()
  if (!user || !activeSpace) return null
  return (
    <EventSearch
      key={`${user.id}:${activeSpace.id}`}
      scope={{ userId: user.id, spaceId: activeSpace.id }}
      spaceName={activeSpace.name}
    />
  )
}

function EventSearch({
  scope,
  spaceName,
}: {
  scope: { userId: string; spaceId: string }
  spaceName: string
}) {
  const [input, setInput] = useState('')
  const [debouncedText, setDebouncedText] = useState('')
  const [dateMode, setDateMode] = useState('all')
  const [yearInput, setYearInput] = useState('')
  const [filters, setFilters] = useState(emptyTimelineFilters)
  const [page, setPage] = useState(0)
  const searchInput = useRef<HTMLInputElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)

  const text = input.trim()
  useEffect(() => {
    if (!text) return
    const timer = window.setTimeout(() => setDebouncedText(text), 350)
    return () => window.clearTimeout(timer)
  }, [text])

  const year = eventSearchYearSchema.safeParse(Number(yearInput))
  const invalidYear = dateMode === 'year' && !year.success
  const waitingForText = !!text && text !== debouncedText
  const searchFilters = {
    ...filters,
    year:
      dateMode === 'undated'
        ? ('undated' as const)
        : dateMode === 'year' && year.success
          ? year.data
          : null,
  }
  const hasFilters =
    dateMode !== 'all' || !!filters.categoryId || !!filters.momentType
  const canSearch = (!!text || hasFilters) && !invalidYear
  const categories = useQuery({
    queryKey: ['event-search-categories', scope],
    queryFn: ({ signal }) => getEventSearchCategories({ data: scope, signal }),
    gcTime: 0,
    retry: false,
  })
  const results = useQuery({
    queryKey: ['event-search', scope, text, searchFilters, page],
    queryFn: ({ signal }) =>
      searchEvents({
        data: { ...scope, text, filters: searchFilters, page },
        signal,
      }),
    enabled: canSearch && !waitingForText,
    gcTime: 0,
    retry: false,
  })
  const result =
    canSearch && !waitingForText && !results.isError ? results.data : undefined
  const pageCount = result ? Math.ceil(result.total / eventSearchPageSize) : 0

  function changeText(value: string) {
    if (value.trim() !== text) setPage(0)
    setInput(value)
    if (!value.trim()) setDebouncedText('')
  }

  function clearFilters() {
    setDateMode('all')
    setYearInput('')
    setFilters(emptyTimelineFilters)
    setPage(0)
  }

  function resetSearch() {
    changeText('')
    clearFilters()
    searchInput.current?.focus()
  }

  function changePage(nextPage: number) {
    setPage(nextPage)
    resultsHeading.current?.focus()
  }

  return (
    <div className="inner-page">
      <PageHeading
        eyebrow="Capítulos da família"
        title="Buscar memórias"
        description={`Encontre acontecimentos de ${spaceName}.`}
      />
      <section
        className="event-panel space-y-5"
        aria-label="Pesquisa e filtros"
      >
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="memory-search"
          >
            Título ou descrição
          </label>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="memory-search"
                ref={searchInput}
                className="event-input pl-10!"
                value={input}
                maxLength={eventSearchTextLimit}
                onChange={(event) => changeText(event.target.value)}
                placeholder="Ex.: Natal de 2024"
              />
            </div>
            {input && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Limpar pesquisa"
                onClick={() => {
                  changeText('')
                  searchInput.current?.focus()
                }}
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <fieldset className="grid items-start gap-4 sm:grid-cols-3">
          <legend className="mb-3 text-sm font-semibold">
            Filtros de acontecimentos
          </legend>
          <div className="min-w-0 space-y-2">
            <label
              className="block text-sm font-medium"
              htmlFor="search-date-mode"
            >
              Data do acontecimento
            </label>
            <select
              id="search-date-mode"
              className="event-input"
              value={dateMode}
              onChange={(event) => {
                setDateMode(event.target.value)
                setPage(0)
              }}
            >
              <option value="all">Todas as datas</option>
              <option value="year">Ano específico</option>
              <option value="undated">Data desconhecida</option>
            </select>
            {dateMode === 'year' && (
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="search-year"
                >
                  Ano
                </label>
                <input
                  id="search-year"
                  className="event-input"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Ex.: 2024"
                  value={yearInput}
                  aria-invalid={!!yearInput && invalidYear}
                  aria-describedby="search-year-help"
                  onChange={(event) => {
                    setYearInput(event.target.value.replace(/[^0-9]/g, ''))
                    setPage(0)
                  }}
                />
                <p
                  id="search-year-help"
                  className="mt-1 text-sm text-muted-foreground"
                >
                  Informe um ano de quatro dígitos.
                </p>
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <label
              className="block text-sm font-medium"
              htmlFor="search-category"
            >
              Categoria
            </label>
            <select
              id="search-category"
              className="event-input"
              disabled={!categories.data}
              value={filters.categoryId ?? ''}
              onChange={(event) => {
                setFilters({
                  ...filters,
                  categoryId: event.target.value || null,
                })
                setPage(0)
              }}
            >
              <option value="">
                {categories.isPending
                  ? 'Carregando categorias…'
                  : 'Todas as categorias'}
              </option>
              {categories.data?.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            {categories.isError && (
              <p role="alert" className="text-sm text-muted-foreground">
                Não foi possível carregar as categorias.{' '}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => void categories.refetch()}
                >
                  Tentar novamente
                </button>
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <label
              className="block text-sm font-medium"
              htmlFor="search-moment"
            >
              Tipo de momento
            </label>
            <select
              id="search-moment"
              className="event-input"
              value={filters.momentType ?? ''}
              onChange={(event) => {
                const value = event.target
                  .value as TimelineFilters['momentType']
                setFilters({ ...filters, momentType: value || null })
                setPage(0)
              }}
            >
              <option value="">Todos os tipos</option>
              {Object.entries(momentLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
        <Button
          type="button"
          variant="outline"
          disabled={!hasFilters}
          onClick={clearFilters}
        >
          Limpar filtros
        </Button>
      </section>

      <section aria-labelledby="search-results" className="max-w-[900px]">
        <h2
          id="search-results"
          ref={resultsHeading}
          tabIndex={-1}
          className="mb-3 text-xl font-semibold"
        >
          Resultados
        </h2>
        <div role="status" className="text-sm text-muted-foreground">
          {canSearch && (waitingForText || results.isFetching) && (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle
                size={16}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />{' '}
              Buscando acontecimentos…
            </span>
          )}
          {result && !results.isFetching && (
            <span>
              {result.total}{' '}
              {result.total === 1
                ? 'acontecimento encontrado'
                : 'acontecimentos encontrados'}
            </span>
          )}
        </div>
        {!canSearch && !invalidYear && (
          <EmptyState
            icon={Search}
            title="Encontre uma memória da família"
            description="Digite parte de um título ou de uma descrição, ou escolha um filtro para começar."
          />
        )}
        {canSearch && !waitingForText && results.isError && (
          <div className="event-notice space-y-3">
            <p role="alert">
              Não foi possível carregar os resultados. Confira a conexão e tente
              novamente.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void results.refetch()}
              >
                Tentar novamente
              </Button>
              {page > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changePage(0)}
                >
                  Voltar à primeira página
                </Button>
              )}
            </div>
          </div>
        )}
        {result?.total === 0 && (
          <EmptyState
            icon={Search}
            title="Nenhum acontecimento encontrado"
            description="Experimente outro termo ou ajuste os filtros."
            action={
              <Button type="button" variant="outline" onClick={resetSearch}>
                {hasFilters ? 'Limpar pesquisa e filtros' : 'Limpar pesquisa'}
              </Button>
            }
          />
        )}
        {result && result.events.length > 0 && (
          <ul className="event-list mt-3">
            {result.events.map((event) => (
              <li key={event.id}>
                <Link
                  to="/eventos/$eventId"
                  params={{ eventId: event.id }}
                  className="event-card block wrap-anywhere"
                >
                  <div className="event-card-top">
                    <span className="eyebrow">{event.date}</span>
                    <span>
                      {event.category && `${event.category} · `}
                      {momentLabel[event.momentType]}
                    </span>
                  </div>
                  <h3 className="my-2 text-xl font-semibold">{event.title}</h3>
                  {event.description && <p>{event.description}</p>}
                  <span className="event-detail-link">
                    Ver detalhes <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {result && result.total > 0 && !result.events.length && (
          <p className="event-notice">
            Os resultados mudaram. Volte à primeira página para continuar.
          </p>
        )}
        {result && (pageCount > 1 || page > 0) && (
          <nav
            aria-label="Paginação dos resultados"
            className="mt-5 flex flex-wrap items-center gap-3"
          >
            <Button
              type="button"
              variant="outline"
              disabled={page === 0}
              onClick={() => changePage(result.events.length ? page - 1 : 0)}
            >
              <ChevronLeft aria-hidden="true" />{' '}
              {result.events.length ? 'Anterior' : 'Primeira página'}
            </Button>
            {result.events.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {pageCount}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={page + 1 >= pageCount}
              onClick={() => changePage(page + 1)}
            >
              Próxima <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        )}
      </section>
    </div>
  )
}
