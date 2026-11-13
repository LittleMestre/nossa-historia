import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { UsersRound } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'
import { PersonForm } from '../components/people/PersonForm'
import { Button } from '../components/ui/button'
import { getPersonDetail, updatePerson } from '../features/people/people'
import type { PersonInput } from '../features/people/model'

export const Route = createFileRoute('/participantes_/$personId')({
  loader: ({ params }) => getPersonDetail({ data: { personId: params.personId } }),
  component: PersonDetailPage,
})
function PersonDetailPage() {
  const { person, canEdit } = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  async function save(input: PersonInput) {
    if (!person) return 'Pessoa não encontrada.'
    const result = await updatePerson({ data: { personId: person.id, person: input } })
    if (result.error) return result.error
    setEditing(false)
    setNotice('Pessoa atualizada com sucesso.')
    try { await router.invalidate() }
    catch { setNotice('Pessoa salva, mas não foi possível atualizar os detalhes. Recarregue a página.') }
    return null
  }
  if (!person) return <div className="inner-page"><EmptyState icon={UsersRound} title="Pessoa não encontrada" description="Este registro não está disponível neste espaço familiar." action={<Link className="primary-link" to="/participantes">Voltar às pessoas</Link>} /></div>
  return <div className="inner-page">
    <PageHeading eyebrow="Quem faz parte" title={person.name} description={person.nickname ? `Conhecido(a) como ${person.nickname}` : 'Pessoa da família'} />
    <Link className="event-back" to="/participantes">← Todas as pessoas</Link>
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {editing ? <section className="event-panel"><h2 className="text-2xl font-semibold">Editar pessoa</h2><PersonForm person={person} onSave={save} onCancel={() => setEditing(false)} /></section> :
    <article className="event-panel">{person.description && <p className="event-description">{person.description}</p>}{canEdit && <div className="pt-4"><Button onClick={() => setEditing(true)}>Editar pessoa</Button></div>}</article>}
  </div>
}
