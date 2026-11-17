import { createFileRoute } from '@tanstack/react-router'
import { setResponseHeader } from '@tanstack/react-start/server'
import {
  safeInviteToken,
  startGoogleOAuth,
} from '../features/auth/google.server'
import { logout } from '../features/auth/auth'

export const Route = createFileRoute('/auth/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        setResponseHeader('Cache-Control', 'private, no-store')
        const url = new URL(request.url)
        const token = safeInviteToken(url.searchParams.get('token'))
        const configuredOrigin =
          process.env.VITE_APP_ORIGIN ||
          import.meta.env.VITE_APP_ORIGIN ||
          'http://127.0.0.1:3000'
        const origin = new URL(configuredOrigin).origin
        const login = new URL('/entrar', origin)
        if (token) login.searchParams.set('token', token)
        if (url.origin !== origin) {
          const ended = await logout()
          if (!ended.ok) {
            const failed = new URL('/entrar', url.origin)
            failed.searchParams.set('oauth', 'unavailable')
            return Response.redirect(failed, 303)
          }
          const canonical = new URL('/auth/google', origin)
          if (token) canonical.searchParams.set('token', token)
          return Response.redirect(canonical, 303)
        }
        let destination: string | null = null
        try {
          destination = await startGoogleOAuth(origin, token)
        } catch {
          // Return to the existing login if OAuth cannot start.
        }
        if (!destination) {
          login.searchParams.set('oauth', 'unavailable')
          return Response.redirect(login, 303)
        }
        return Response.redirect(destination, 303)
      },
    },
  },
})
