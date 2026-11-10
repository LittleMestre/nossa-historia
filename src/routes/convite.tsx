import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  acceptInvite,
  establishInviteSession,
  exchangeInviteCode,
} from '../features/spaces/invitations'
import { selectSpace } from '../features/spaces/spaces'

export const Route = createFileRoute('/convite')({ component: InvitePage })
function InvitePage() {
  const [message, setMessage] = useState('Validando convite…')
  const [accepted, setAccepted] = useState(false)
  const started = useRef(false)
  const [tokenForLogin, setTokenForLogin] = useState<string | null>(null)
  useEffect(() => {
    if (started.current) return
    started.current = true
    async function run() {
      const url = new URL(window.location.href)
      const token = url.searchParams.get('token')
      const code = url.searchParams.get('code')
      const fragment = new URLSearchParams(url.hash.slice(1))
      const accessToken = fragment.get('access_token')
      const refreshToken = fragment.get('refresh_token')
      if (url.hash)
        window.history.replaceState({}, '', url.pathname + url.search)
      if (!token || !/^[0-9a-f]{64}$/.test(token)) {
        setMessage('Link de convite inválido.')
        return
      }
      setTokenForLogin(token)
      try {
        if (accessToken && refreshToken) {
          const session = await establishInviteSession({
            data: { accessToken, refreshToken },
          })
          if (!session.ok) {
            setMessage('Link de autenticação expirado. Peça um novo convite.')
            return
          }
        } else if (code) {
          const exchanged = await exchangeInviteCode({ data: { code } })
          if (!exchanged.ok) {
            setMessage('Link de autenticação expirado. Peça um novo convite.')
            return
          }
        }
        const result = await acceptInvite({ data: { token } })
        if (result.error || !result.spaceId) {
          setMessage(result.error ?? 'Não foi possível aceitar o convite.')
          return
        }
        const selected = await selectSpace({
          data: { spaceId: result.spaceId },
        })
        if (selected.ok) {
          setAccepted(true)
          setMessage('Convite aceito. Seu espaço está pronto.')
        } else
          setMessage('Convite aceito. Entre novamente para abrir o espaço.')
      } catch {
        setMessage('Não foi possível validar o convite agora.')
      }
    }
    void run()
  }, [])
  return (
    <section className="auth-card">
      <p className="eyebrow">Convite familiar</p>
      <h1>Participar da família</h1>
      <p role="status">{message}</p>
      {accepted ? (
        <Link to="/">Abrir a família</Link>
      ) : (
        <Link
          to="/entrar"
          search={tokenForLogin ? { token: tokenForLogin } : {}}
        >
          Entrar com a conta convidada
        </Link>
      )}
    </section>
  )
}
