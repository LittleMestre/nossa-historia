import { ChevronLeft, ChevronRight } from 'lucide-react'
import { searchPageSize } from '../../features/search/model'
import { Button } from '../ui/button'

export function SearchPagination({
  page,
  total,
  hasRows,
  onPageChange,
}: {
  page: number
  total: number
  hasRows: boolean
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.ceil(total / searchPageSize)
  if (pageCount <= 1 && page === 0) return null
  return (
    <nav
      aria-label="Paginação dos resultados"
      className="mt-5 flex flex-wrap items-center gap-3"
    >
      <Button
        type="button"
        variant="outline"
        disabled={page === 0}
        onClick={() => onPageChange(hasRows ? page - 1 : 0)}
      >
        <ChevronLeft aria-hidden="true" />{' '}
        {hasRows ? 'Anterior' : 'Primeira página'}
      </Button>
      {hasRows && (
        <span className="text-sm text-muted-foreground">
          Página {page + 1} de {pageCount}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={page + 1 >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
