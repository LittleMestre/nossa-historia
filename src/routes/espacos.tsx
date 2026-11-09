import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  createFirstSpace,
  getSpaceState,
  selectSpace,
} from '../features/spaces/spaces'

export const Route = createFileRoute('/espacos')({
  loader: () => getSpaceState(),
  component: SpacesPage,
})

function SpacesPage() {
  const { spaces, activeSpace } = Route.useLoaderData()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function create() {
    setBusy(true)
    const result = await createFirstSpace({ data: { name } })
    if (result.error) {
      setError(result.error)
      setBusy(false)
    } else window.location.assign('/')
  }
  async function choose(id: string) {
    setBusy(true)
    const result = await selectSpace({ data: { spaceId: id } })
    if (result.ok) window.location.assign('/')
    else {
      setError('Não foi possível selecionar este espaço.')
      setBusy(false)
    }
  }
  return (
    <section className="family-panel">
      <p className="eyebrow">Espaços familiares</p>
      <h1>Escolha sua família</h1>
      {spaces.length ? (
        <ul className="family-list">
          {spaces.map((space) => (
            <li key={space.id}>
              <div>
                <strong>{space.name}</strong>
                <small>
                  {space.role === 'admin'
                    ? 'Administrador'
                    : space.role === 'viewer'
                      ? 'Leitor'
                      : 'Colaborador'}
                </small>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => choose(space.id)}
              >
                {activeSpace?.id === space.id ? 'Abrir' : 'Selecionar'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p>
            Você ainda não participa de um espaço familiar. Crie o primeiro para
            começar.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void create()
            }}
          >
            <label htmlFor="space-name">Nome da família</label>
            <input
              id="space-name"
              value={name}
              placeholder="Família ..."
              aria-describedby="space-name-hint"
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <small id="space-name-hint" className="form-hint">
              Exemplo: Família Mestrinho
            </small>
            <button disabled={busy || !name.trim()}>
              {busy ? 'Criando…' : 'Criar espaço'}
            </button>
          </form>
          <p>Recebeu um convite? Abra o link enviado ao seu e-mail.</p>
        </>
      )}
      {activeSpace && (
        <p>
          <Link to="/membros">Ver membros</Link>
          {activeSpace.role === 'admin' && (
            <>
              {' '}
              · <Link to="/convites">Gerenciar convites</Link>
            </>
          )}
        </p>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </section>
  )
}
