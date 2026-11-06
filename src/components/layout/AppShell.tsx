import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  BookHeart,
  CalendarDays,
  GalleryHorizontalEnd,
  Home,
  UsersRound,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/linha-do-tempo', label: 'Linha do tempo', icon: CalendarDays },
  { to: '/galeria', label: 'Galeria', icon: GalleryHorizontalEnd },
  { to: '/eventos', label: 'Eventos', icon: BookHeart },
  { to: '/participantes', label: 'Pessoas', icon: UsersRound },
] as const

export function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

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
          <div className="header-actions">
            <span className="private-label">Seu álbum de memórias</span>
            <ThemeToggle />
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
    </div>
  )
}
