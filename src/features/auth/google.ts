import { createServerFn } from '@tanstack/react-start'

export const getGoogleOAuthStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { googleConfigured } = await import('./google.server')
    return { available: googleConfigured() }
  },
)
