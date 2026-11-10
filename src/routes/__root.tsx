import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  notFound,
  redirect,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '../components/layout/AppShell'
import appCss from '../styles.css?url'
import { getCurrentUser } from '../features/auth/auth'
import { getSpaceState } from '../features/spaces/spaces'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    const publicPath = [
      '/entrar',
      '/recuperar-senha',
      '/nova-senha',
      '/convite',
    ].includes(location.pathname)
    const demoPath = ['/demo-espiral', '/demo-linha-do-tempo'].includes(
      location.pathname,
    )
    if (demoPath) {
      if (!import.meta.env.DEV) throw notFound()
      return { user: null, activeSpace: null }
    }
    const user = await getCurrentUser()
    if (!user && !publicPath) throw redirect({ to: '/entrar' })
    if (
      user &&
      location.pathname === '/entrar' &&
      !new URLSearchParams(location.searchStr).has('token')
    )
      throw redirect({ to: '/espacos' })
    if (user && !publicPath) {
      const state = await getSpaceState()
      if (!state.activeSpace && location.pathname !== '/espacos')
        throw redirect({ to: '/espacos' })
      return { user, activeSpace: state.activeSpace }
    }
    return { user, activeSpace: null }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Nossa História' },
      {
        name: 'description',
        content:
          'Um espaço privado para preservar e encontrar as lembranças da família.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="not-found-page">
      <p className="eyebrow">Página não encontrada</p>
      <h1>Esta página se perdeu no tempo.</h1>
      <p>Volte ao início para continuar explorando o álbum.</p>
      <Link className="primary-link" to="/">
        Voltar ao início
      </Link>
    </div>
  )
}

function RootComponent() {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell />
        <Scripts />
      </body>
    </html>
  )
}
