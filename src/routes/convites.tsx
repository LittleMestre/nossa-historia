import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { getSpaceState } from '../features/spaces/spaces'
import {
  listPendingInvites,
  revokeInvite,
  sendInvite,
} from '../features/spaces/invitations'

export const Route = createFileRoute('/convites')({
  loader: async () => {
    const state = await getSpaceState()
    if (state.activeSpace?.role !== 'admin') throw redirect({ to: '/espacos' })
    return {
      space: state.activeSpace,
      invites: await listPendingInvites({
        data: { spaceId: state.activeSpace.id },
      }),
    }
  },
  component: InvitesPage,
})
function InvitesPage() {
  const { space, invites } = Route.useLoaderData()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'contributor' | 'viewer'>('contributor')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function send() {
    setBusy(true)
    setError('')
    try {
      const result = await sendInvite({
        data: { spaceId: space.id, email, role },
      })
      if (result.error) setError(result.error)
      else window.location.reload()
    } catch {
      setError('Não foi possível enviar o convite.')
    }
    setBusy(false)
  }
  async function revoke(id: string) {
    setBusy(true)
    const result = await revokeInvite({ data: { id, spaceId: space.id } })
    if (result.ok) window.location.reload()
    else {
      setError('Não foi possível revogar o convite.')
      setBusy(false)
    }
  }
  return (
    <section className="family-panel">
      <p className="eyebrow">{space.name}</p>
      <h1>Convites</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <label htmlFor="invite-email">E-mail do convidado</label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label htmlFor="invite-role">Papel</label>
        <select
          id="invite-role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as 'contributor' | 'viewer')
          }
        >
          <option value="contributor">Colaborador</option>
          <option value="viewer">Leitor</option>
        </select>
        <button disabled={busy || !email}>
          {busy ? 'Enviando…' : 'Enviar convite'}
        </button>
      </form>
      <h2>Pendentes</h2>
      {invites.length ? (
        <ul className="family-list">
          {invites.map((invite) => (
            <li key={invite.id}>
              <div>
                <strong>{invite.email}</strong>
                <small>
                  {invite.role === 'viewer' ? 'Leitor' : 'Colaborador'} · Válido
                  até {new Date(invite.expires_at).toLocaleString('pt-BR')}
                </small>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => revoke(invite.id)}
              >
                Revogar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum convite pendente.</p>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <Link to="/espacos">Voltar aos espaços</Link>
    </section>
  )
}
