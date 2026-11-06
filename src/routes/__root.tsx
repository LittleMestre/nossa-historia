import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '../components/layout/AppShell'
import appCss from '../styles.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
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
