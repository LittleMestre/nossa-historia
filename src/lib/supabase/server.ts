import { createServerClient } from '@supabase/ssr'
import {
  getCookie,
  getRequestHeader,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'
import type { Database } from '../../types/database.types'

export function createSupabaseServerClient() {
  setResponseHeader('Cache-Control', 'private, no-store')
  const url = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key)
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY',
    )

  return createServerClient<Database>(url, key, {
    cookieOptions: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
    cookies: {
      getAll() {
        const raw = getRequestHeader('cookie') ?? ''
        return raw
          .split(';')
          .map((part) => part.trim().split('=')[0])
          .filter(Boolean)
          .map((name) => ({
            name,
            value: getCookie(name) ?? '',
          }))
      },
      setAll(cookies, headers) {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, {
            ...options,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
          })
        }
        for (const [name, value] of Object.entries(headers))
          setResponseHeader(name, value)
      },
    },
  })
}
