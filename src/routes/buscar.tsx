import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, LoaderCircle, Search, UsersRound } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useId, useRef, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'
import { PeopleSearch } from '../components/search/PeopleSearch'
import { SearchField } from '../components/search/SearchField'
import { SearchPagination } from '../components/search/SearchPagination'
import { useSearchText } from '../components/search/useSearchText'
import { Button } from '../components/ui/button'
import { momentLabel } from '../features/events/model'
import {
  eventSearchYearSchema,
  getEventSearchCategories,
  searchEvents,
} from '../features/events/search'
import { emptyTimelineFilters } from '../features/events/timeline-filters'
import type { TimelineFilters } from '../features/events/timeline-filters'
import type { SearchPerson } from '../features/people/search'
import type { SearchScope } from '../features/search/model'

export const Route = createFileRoute('/buscar')({ component: SearchPage })

function SearchPage() {
  const { user, activeSpace } = Route.useRouteContext()
  if (!user || !activeSpace) return null
  return (
    <SearchExperience
      key={`${user.id}:${activeSpace.id}`}
      scope={{ userId: user.id, spaceId: activeSpace.id }}
      spaceName={activeSpace.name}
    />
  )
}

function SearchExperience({
  scope,
  spaceName,
}: {
  scope: SearchScope
  spaceName: string
}) {
  const [tab, setTab] = useState('events')
  const [person, setPerson] = useState<SearchPerson | null>(null)
  const [page, setPage] = useState(0)
  const eventTab = useRef<HTMLButtonElement>(null)

  function selectPerson(nextPerson: SearchPerson | null) {
    setPerson(nextPerson)
    setPage(0)
  }

  return (
    <div className="inner-page">
      <PageHeading
        eyebrow="Capítulos da família"
        title="Buscar memórias"
        description={`Encontre acontecimentos e pessoas de ${spaceName}.`}
      />
      <Tabs.Root value={tab} onValueChange={setTab} activationMode="manual">
        <Tabs.List
          aria-label="Tipo de busca"
          className="mt-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border bg-card p-1"
        >
          <Tabs.Trigger asChild value="events">
            <Button
              ref={eventTab}
              type="button"
              variant="ghost"
              size="lg"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CalendarDays aria-hidden="true" /> Acontecimentos
            </Button>
          </Tabs.Trigger>
          <Tabs.Trigger asChild value="people">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UsersRound aria-hidden="true" /> Pessoas
            </Button>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          forceMount
          value="events"
          className="data-[state=inactive]:hidden"
        >
          <EventSearch
            scope={scope}
            active={tab === 'events'}
            person={person}
            onPersonChange={selectPerson}
            page={page}
            setPage={setPage}
          />
        </Tabs.Content>
        <Tabs.Content
          forceMount
          value="people"
          className="data-[state=inactive]:hidden"
        >
          <PeopleSearch
            scope={scope}
            active={tab === 'people'}
            onSelect={(selected) => {
              selectPerson(selected)
              setTab('events')
              eventTab.current?.focus()
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function EventSearch({
  scope,
  active,
  person,
  onPersonChange,
  page,
  setPage,
}: {
  scope: SearchScope
  active: boolean
  person: SearchPerson | null
  onPersonChange: (person: SearchPerson | null) => void
  page: number
  setPage: (page: number) => void
}) {
  const [dateMode, setDateMode] = useState('all')
  const [yearInput, setYearInput] = useState('')
  const [filters, setFilters] = useState(emptyTimelineFilters)
  const [picking, setPicking] = useState(false)
  const pickerId = useId()
  const pickerButton = useRef<HTMLButtonElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const { input, text, waitingForText, changeText } = useSearchText(() =>
    setPage(0),
  )
  const personId = person?.id ?? null

  const year = eventSearchYearSchema.safeParse(Number(yearInput))
  const invalidYear = dateMode === 'year' && !year.success
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
    dateMode !== 'all' ||
    !!filters.categoryId ||
    !!filters.momentType ||
    !!personId
  const canSearch = (!!text || hasFilters) && !invalidYear
  const categories = useQuery({
    queryKey: ['event-search-categories', scope],
    queryFn: ({ signal }) => getEventSearchCategories({ data: scope, signal }),
    enabled: active,
    gcTime: 0,
    retry: false,
  })
  const results = useQuery({
    queryKey: ['event-search', scope, text, searchFilters, personId, page],
    queryFn: ({ signal }) =>
      searchEvents({
        data: { ...scope, text, filters: searchFilters, personId, page },
        signal,
      }),
    enabled: active && canSearch && !waitingForText,
    gcTime: 0,
    retry: false,
  })
  const result =
    canSearch && !waitingForText && !results.isError ? results.data : undefined
  function clearFilters() {
    setDateMode('all')
    setYearInput('')
    setFilters(emptyTimelineFilters)
    setPicking(false)
    onPersonChange(null)
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
    <>
      <section
        className="event-panel space-y-5"
        aria-label="Pesquisa e filtros"
      >
        <SearchField
          inputRef={searchInput}
          label="Título ou descrição"
          placeholder="Ex.: Natal de 2024"
          value={input}
          onChange={changeText}
        />

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
        <fieldset className="min-w-0 space-y-3 border-t pt-3">
          <legend className="pr-2 text-sm font-semibold">
            Pessoa participante
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            {person && (
              <span className="event-tag wrap-anywhere">
                {person.name}
                {person.nickname && ` · ${person.nickname}`}
              </span>
            )}
            <Button
              ref={pickerButton}
              type="button"
              variant="outline"
              aria-expanded={picking}
              aria-controls={pickerId}
              onClick={() => setPicking(!picking)}
            >
              {picking
                ? 'Fechar seleção'
                : person
                  ? 'Trocar pessoa'
                  : 'Selecionar pessoa'}
            </Button>
            {person && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onPersonChange(null)
                  pickerButton.current?.focus()
                }}
              >
                Remover pessoa
              </Button>
            )}
          </div>
          <div id={pickerId} hidden={!picking}>
            {picking && (
              <PeopleSearch
                scope={scope}
                active={active}
                picker
                onSelect={(selected) => {
                  onPersonChange(selected)
                  setPicking(false)
                  pickerButton.current?.focus()
                }}
              />
            )}
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
        {result && (
          <SearchPagination
            page={page}
            total={result.total}
            hasRows={result.events.length > 0}
            onPageChange={changePage}
          />
        )}
      </section>
    </>
  )
}
