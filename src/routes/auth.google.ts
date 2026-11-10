import { createFileRoute } from '@tanstack/react-router'
import {
  safeInviteToken,
  startGoogleOAuth,
} from '../features/auth/google.server'

export const Route = createFileRoute('/auth/google')({
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
