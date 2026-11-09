import {
  Link,
  Outlet,
  useRouteContext,
  useRouterState,
} from '@tanstack/react-router'
import {
  BookHeart,
  CalendarDays,
  GalleryHorizontalEnd,
  Home,
  Settings2,
  UsersRound,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { logout } from '../../features/auth/auth'
import { useState } from 'react'

const navigation = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/linha-do-tempo', label: 'Linha do tempo', icon: CalendarDays },
  { to: '/galeria', label: 'Galeria', icon: GalleryHorizontalEnd },
  { to: '/eventos', label: 'Eventos', icon: BookHeart },
  { to: '/participantes', label: 'Pessoas', icon: UsersRound },
] as const

export function AppShell() {
  const { user, activeSpace } = useRouteContext({ from: '__root__' })
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const publicPage = [
    '/entrar',
    '/recuperar-senha',
    '/nova-senha',
    '/convite',
  ].includes(pathname)

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError(false)
    try {
      const result = await logout()
      if (!result.ok) throw new Error('logout failed')
      window.location.assign('/entrar')
    } catch {
      setLoggingOut(false)
      setLogoutError(true)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="app-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Nossa História, início">
            <span className="brand-mark">
              <BookHeart size={22} strokeWidth={1.75} />
            </span>
            <span>
              Nossa <em>História</em>
            </span>
          </Link>
          {user && activeSpace && (
            <nav className="desktop-nav" aria-label="Navegação principal">
              {navigation.map(({ to, label }) => (
                <Link
                  className={`nav-link${pathname === to ? ' is-active' : ''}`}
                  to={to}
                  key={to}
                  aria-current={pathname === to ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <div className="header-actions">
            {user && activeSpace ? (
              <Link to="/espacos" className="private-label">
                {activeSpace.name}
              </Link>
            ) : (
              <span className="private-label">Seu álbum de memórias</span>
            )}
            {user && activeSpace && (
              <Link
                to="/membros"
                className="space-manage-link"
                aria-label="Gerenciar espaço"
              >
                <Settings2 size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>Gerenciar espaço</span>
              </Link>
            )}
            <ThemeToggle />
            {user && (
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Saindo…' : 'Sair'}
              </button>
            )}
            {logoutError && (
              <span role="alert">Não foi possível sair. Tente novamente.</span>
            )}
          </div>
        </div>
      </header>
      <main id="conteudo" className="page-container">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>Nossa História</span>
        <span>Um lugar para lembrar juntos.</span>
      </footer>
      {!publicPage && user && activeSpace && (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              className={`mobile-link${pathname === to ? ' is-active' : ''}`}
              to={to}
              key={to}
              aria-current={pathname === to ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{label === 'Linha do tempo' ? 'Tempo' : label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
