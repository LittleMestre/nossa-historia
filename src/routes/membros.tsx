import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { updateDisplayName } from '../features/auth/auth'
import { getActiveMembers, getSpaceState } from '../features/spaces/spaces'

export const Route = createFileRoute('/membros')({
  loader: async () => ({
    members: await getActiveMembers(),
    state: await getSpaceState(),
  }),
  component: MembersPage,
})
function MembersPage() {
  const { members, state } = Route.useLoaderData()
  const { user } = useRouteContext({ from: '__root__' })
  const ownName = members.find((member) => member.id === user?.id)?.name
  const [name, setName] = useState(
    ownName === 'Nome não informado' ? '' : (ownName ?? ''),
  )
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      const result = await updateDisplayName({ data: { displayName: name } })
      if (result.error) setSaveError(result.error)
      else window.location.reload()
    } catch {
      setSaveError('Não foi possível salvar seu nome.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className="family-panel">
      <p className="eyebrow">Família</p>
      <h1>Membros</h1>
      <ul className="family-list">
        {members.map((member) => (
          <li key={member.id}>
            <strong>{member.name}</strong>
            {member.email && <small>{member.email}</small>}
            <span>
              {member.role === 'admin'
                ? 'Administrador'
                : member.role === 'contributor'
                  ? 'Colaborador'
                  : 'Leitor'}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={saveName}>
        <label htmlFor="display-name">Seu nome de exibição</label>
        <input
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
        />
        <button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Salvando…' : 'Salvar nome'}
        </button>
        {saveError && <p role="alert">{saveError}</p>}
      </form>
      {state.activeSpace?.role === 'admin' && (
        <p>
          <Link to="/convites">Gerenciar convites</Link>
        </p>
      )}
      <Link to="/espacos">Voltar aos espaços</Link>
    </section>
  )
}
