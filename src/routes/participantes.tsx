import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { UserRoundPlus, UsersRound } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'
import { PersonForm } from '../components/people/PersonForm'
import { Button } from '../components/ui/button'
import { createPerson, getPeoplePage } from '../features/people/people'
import type { PersonInput } from '../features/people/model'

export const Route = createFileRoute('/participantes')({ loader: () => getPeoplePage(), component: PeoplePage })
function PeoplePage() {
  const { people, canCreate } = Route.useLoaderData()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  async function save(person: PersonInput) {
    const result = await createPerson({ data: { person } })
    if (result.error) return result.error
    setCreating(false)
    setNotice('Pessoa adicionada com sucesso.')
    try { await router.invalidate() }
    catch { setNotice('Pessoa salva, mas não foi possível atualizar a lista. Recarregue a página.') }
    return null
  }
  return <div className="inner-page">
    <PageHeading eyebrow="Quem faz parte" title="Pessoas" description="Pessoas presentes nas lembranças, mesmo sem conta no aplicativo."
      action={canCreate && !creating ? <Button onClick={() => setCreating(true)}><UserRoundPlus size={16} /> Adicionar pessoa</Button> : undefined} />
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {creating && <section className="event-panel"><h2 className="text-2xl font-semibold">Nova pessoa</h2><PersonForm onSave={save} onCancel={() => setCreating(false)} /></section>}
    {!people.length ? <EmptyState icon={UsersRound} title="Toda história começa com pessoas" description="As pessoas cadastradas pela família aparecerão aqui."
      action={canCreate && !creating ? <Button onClick={() => setCreating(true)}>Adicionar primeira pessoa</Button> : undefined} /> :
    <ul className="event-list">{people.map((person) => <li key={person.id}><Link to="/participantes/$personId" params={{ personId: person.id }} className="event-card"><h2>{person.name}</h2>{person.nickname && <span className="text-muted-foreground">Conhecido(a) como {person.nickname}</span>}{person.description && <p>{person.description}</p>}<span className="event-detail-link">Ver detalhes →</span></Link></li>)}</ul>}
  </div>
}
