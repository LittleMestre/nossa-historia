import { useRef, useState } from 'react'
import { personInputSchema } from '../../features/people/model'
import type { Person, PersonInput } from '../../features/people/model'
import { Button } from '../ui/button'

export function PersonForm({ person, onSave, onCancel }: {
  person?: Person
  onSave: (input: PersonInput) => Promise<string | null>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<PersonInput>({
    name: person?.name ?? '', nickname: person?.nickname ?? '',
    description: person?.description ?? '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    setError('')
    const parsed = personInputSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os dados da pessoa.')
      return
    }
    inFlight.current = true
    setBusy(true)
    try {
      const message = await onSave(parsed.data)
      if (message) setError(message)
    } catch {
      setError('Não foi possível salvar a pessoa. Tente novamente.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return <form className="event-form" onSubmit={(event) => void submit(event)}>
    <label className="grid gap-1 text-sm">Nome
      <input className="event-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required maxLength={160} autoFocus />
    </label>
    <label className="grid gap-1 text-sm">Apelido (opcional)
      <input className="event-input" value={draft.nickname} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} maxLength={120} />
    </label>
    <label className="grid gap-1 text-sm">Descrição (opcional)
      <textarea className="event-input min-h-28" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={5000} />
    </label>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button type="submit" disabled={busy}>{busy ? 'Salvando…' : person ? 'Salvar alterações' : 'Adicionar pessoa'}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button>
    </div>
  </form>
}
