import { useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { addEventParticipant, removeEventParticipant } from '../../features/people/people'
import { Button } from '../ui/button'

type PeopleData = Awaited<ReturnType<typeof import('../../features/people/people').getEventParticipants>>
export function EventParticipants({ eventId, data }: { eventId: string; data: PeopleData }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const linked = new Set(data.links.map((link) => link.person_id))
  const available = data.people.filter((person) => !linked.has(person.id) &&
    `${person.name} ${person.nickname ?? ''}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
  async function mutate(action: () => Promise<{ error: string | null }>, message: string) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await action()
      if (result.error) { setError(result.error); return }
      setSelected('')
      setSearch('')
      setNotice(message)
      try { await router.invalidate() }
      catch { setError('Vínculo salvo, mas não foi possível atualizar a lista. Recarregue a página.') }
    } catch { setError('Não foi possível atualizar os participantes. Tente novamente.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <section className="event-panel" aria-labelledby="participants-title">
    <h2 id="participants-title" className="text-2xl font-semibold">Participantes</h2>
    {data.links.length ? <ul className="person-link-list">{data.links.map((link) => {
      const person = data.people.find((item) => item.id === link.person_id)
      if (!person) return null
      return <li key={link.id}>
        <Link to="/participantes/$personId" params={{ personId: person.id }}>{person.name}{person.nickname && <span className="text-muted-foreground"> · {person.nickname}</span>}</Link>
        {data.canManage && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => removeEventParticipant({ data: { eventId, linkId: link.id } }), `${person.name} removido deste evento.`)}>Remover</Button>}
      </li>
    })}</ul> : <p className="text-muted-foreground mt-3">Nenhuma pessoa vinculada a este acontecimento.</p>}
    {data.canManage && <div className="event-form">
      <label className="grid gap-1 text-sm">Buscar pessoa para vincular
        <input className="event-input" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setSelected('') }} placeholder="Digite um nome" />
      </label>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1 text-sm grow min-w-48">Pessoa cadastrada
          <select className="event-input" value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Selecione uma pessoa</option>
            {available.map((person) => <option key={person.id} value={person.id}>{person.name}{person.nickname ? ` (${person.nickname})` : ''}</option>)}
          </select>
        </label>
        <Button type="button" disabled={busy || !selected || linked.has(selected)} onClick={() => void mutate(() => addEventParticipant({ data: { eventId, personId: selected } }), 'Participante vinculado com sucesso.')}>{busy ? 'Salvando…' : 'Vincular'}</Button>
      </div>
      {!data.people.length && <p>Cadastre uma pessoa em <Link className="event-back" to="/participantes">Pessoas</Link> para vinculá-la.</p>}
    </div>}
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
  </section>
}
