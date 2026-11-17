import { deleteCookie } from '@tanstack/react-start/server'

export function clearActiveSpaceCookie() {
  deleteCookie('nossa_active_space', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}
