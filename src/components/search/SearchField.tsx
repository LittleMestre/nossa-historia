import { Search, X } from 'lucide-react'
import { useId } from 'react'
import type { RefObject } from 'react'
import { searchTextLimit } from '../../features/search/model'
import { Button } from '../ui/button'

export function SearchField({
  inputRef,
  label,
  placeholder,
  value,
  onChange,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id={id}
            ref={inputRef}
            className="event-input pl-10!"
            value={value}
            maxLength={searchTextLimit}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Limpar pesquisa por ${label.toLocaleLowerCase('pt-BR')}`}
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}
