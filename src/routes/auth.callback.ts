import { createFileRoute } from '@tanstack/react-router'
import {
  finishGoogleOAuth,
  safeInviteToken,
  safeOAuthCode,
} from '../features/auth/google.server'

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = safeInviteToken(url.searchParams.get('token'))
        const configuredOrigin =
          process.env.VITE_APP_ORIGIN ||
          import.meta.env.VITE_APP_ORIGIN ||
          'http://127.0.0.1:3000'
        const origin = new URL(configuredOrigin).origin
        const login = new URL('/entrar', origin)
        if (token) login.searchParams.set('token', token)
        const providerError = url.searchParams.get('error')
        if (providerError) {
          login.searchParams.set(
            'oauth',
            providerError === 'access_denied' ? 'cancelled' : 'failed',
          )
          return Response.redirect(login, 303)
        }
        const code = safeOAuthCode(url.searchParams.get('code'))
        let signedIn = false
        if (code) {
          try {
            signedIn = await finishGoogleOAuth(code)
          } catch {
            signedIn = false
          }
        }
        if (!signedIn) {
          login.searchParams.set('oauth', 'failed')
          return Response.redirect(login, 303)
        }
        const destination = new URL(token ? '/convite' : '/espacos', origin)
        if (token) destination.searchParams.set('token', token)
        return Response.redirect(destination, 303)
      },
    },
  },
})
