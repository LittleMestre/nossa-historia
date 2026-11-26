import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, UsersRound } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { searchPeople } from '../../features/people/search'
import type { SearchPerson } from '../../features/people/search'
import type { SearchScope } from '../../features/search/model'
import { EmptyState } from '../EmptyState'
import { Button } from '../ui/button'
import { SearchField } from './SearchField'
import { SearchPagination } from './SearchPagination'
import { useSearchText } from './useSearchText'

export function PeopleSearch({
  scope,
  active,
  picker = false,
  onSelect,
}: {
  scope: SearchScope
  active: boolean
  picker?: boolean
  onSelect: (person: SearchPerson) => void
}) {
  const [page, setPage] = useState(0)
  const { input, text, waitingForText, changeText } = useSearchText(() =>
    setPage(0),
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const headingId = useId()
  useEffect(() => {
    if (picker) inputRef.current?.focus()
  }, [picker])

  const results = useQuery({
    queryKey: ['people-search', scope, text, page],
    queryFn: ({ signal }) =>
      searchPeople({ data: { ...scope, text, page }, signal }),
    enabled: active && !!text && !waitingForText,
    gcTime: 0,
    retry: false,
  })
  const result =
    text && !waitingForText && !results.isError ? results.data : undefined

  function clear() {
    changeText('')
    inputRef.current?.focus()
  }

  function changePage(nextPage: number) {
    setPage(nextPage)
    resultsHeading.current?.focus()
  }

  return (
    <>
      <div className={picker ? '' : 'event-panel'}>
        <SearchField
          inputRef={inputRef}
          label="Nome ou apelido"
          placeholder="Ex.: Luciana ou Vovó"
          value={input}
          onChange={changeText}
        />
      </div>
      <section aria-labelledby={headingId} className="mt-4 max-w-[900px]">
        <h2
          id={headingId}
          ref={resultsHeading}
          tabIndex={-1}
          className={
            picker
              ? 'sr-only font-semibold focus:not-sr-only'
              : 'mb-3 text-xl font-semibold'
          }
        >
          {picker ? 'Pessoas para selecionar' : 'Resultados'}
        </h2>
        <div role="status" className="text-sm text-muted-foreground">
          {!!text && (waitingForText || results.isFetching) && (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle
                size={16}
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />{' '}
              Buscando pessoas…
            </span>
          )}
          {result && !results.isFetching && (
            <span>
              {result.total}{' '}
              {result.total === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
            </span>
          )}
        </div>
        {!text &&
          (picker ? (
            <p className="text-sm text-muted-foreground">
              Digite parte do nome ou apelido para selecionar uma pessoa.
            </p>
          ) : (
            <EmptyState
              icon={UsersRound}
              title="Encontre uma pessoa da família"
              description="Digite parte do nome ou apelido para começar."
            />
          ))}
        {!!text && !waitingForText && results.isError && (
          <div className="event-notice space-y-3">
            <p role="alert">
              Não foi possível carregar as pessoas. Confira a conexão e tente
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
        {result?.total === 0 &&
          (picker ? (
            <p className="mt-2 text-sm">
              Nenhuma pessoa encontrada.{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={clear}
              >
                Limpar pesquisa
              </button>
            </p>
          ) : (
            <EmptyState
              icon={UsersRound}
              title="Nenhuma pessoa encontrada"
              description="Experimente outro nome ou apelido."
              action={
                <Button type="button" variant="outline" onClick={clear}>
                  Limpar pesquisa
                </Button>
              }
            />
          ))}
        {result && result.people.length > 0 && (
          <ul className="event-list mt-3">
            {result.people.map((person) => (
              <li key={person.id}>
                {picker ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full min-w-0 justify-start px-3 py-2 text-left whitespace-normal wrap-anywhere"
                    onClick={() => onSelect(person)}
                  >
                    {person.name}
                    {person.nickname && ` · ${person.nickname}`}
                  </Button>
                ) : (
                  <article className="event-card wrap-anywhere">
                    <Link
                      to="/participantes/$personId"
                      params={{ personId: person.id }}
                      className="block rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <h3 className="my-2 text-xl font-semibold">
                        {person.name}
                      </h3>
                      {person.nickname && (
                        <span className="text-sm text-muted-foreground">
                          Apelido: {person.nickname}
                        </span>
                      )}
                      {person.description && <p>{person.description}</p>}
                      <span className="event-detail-link">
                        Ver perfil <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 h-auto whitespace-normal py-2"
                      aria-label={`Ver acontecimentos desta pessoa: ${person.name}`}
                      onClick={() => onSelect(person)}
                    >
                      Ver acontecimentos desta pessoa
                    </Button>
                  </article>
                )}
              </li>
            ))}
          </ul>
        )}
        {result && result.total > 0 && !result.people.length && (
          <p className="event-notice">
            Os resultados mudaram. Volte à primeira página para continuar.
          </p>
        )}
        {result && (
          <SearchPagination
            page={page}
            total={result.total}
            hasRows={result.people.length > 0}
            onPageChange={changePage}
          />
        )}
      </section>
    </>
  )
}
