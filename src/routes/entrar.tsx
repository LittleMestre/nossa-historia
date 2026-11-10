import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '../features/auth/auth'
import { getGoogleOAuthStatus } from '../features/auth/google'

const schema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/entrar')({
  validateSearch: z.object({
    oauth: z.enum(['cancelled', 'failed', 'unavailable']).optional(),
    token: z.string().optional(),
  }),
  loader: () => getGoogleOAuthStatus(),
  component: LoginPage,
})

function LoginPage() {
  const { available: googleAvailable } = Route.useLoaderData()
  const { oauth: oauthStatus } = Route.useSearch()
  const [serverError, setServerError] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const oauthMessage =
    oauthStatus === 'cancelled'
      ? 'A entrada com Google foi cancelada. Tente novamente se desejar.'
      : oauthStatus === 'failed'
        ? 'Não foi possível entrar com Google. Tente novamente ou use e-mail e senha.'
        : oauthStatus === 'unavailable'
          ? 'A entrada com Google ainda não está disponível.'
          : null
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError('')
    try {
      const result = await login({ data: values })
      if (result.error) setServerError(result.error)
      else {
        const token = new URLSearchParams(window.location.search).get('token')
        window.location.assign(
          token && /^[0-9a-f]{64}$/.test(token)
            ? `/convite?token=${token}`
            : '/',
        )
      }
    } catch {
      setServerError('Não foi possível entrar agora. Tente novamente.')
    }
  }

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <p className="eyebrow">Álbum privado</p>
      <h1 id="login-title">Entre na Nossa História</h1>
      <p>Use o acesso recebido pela sua família.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && <span role="alert">{errors.email.message}</span>}
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && <span role="alert">{errors.password.message}</span>}
        {serverError && (
          <p role="alert" className="auth-error">
            {serverError}
          </p>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <div className="auth-divider">
        <span>ou continue com</span>
      </div>
      <button
        className="google-login-button"
        type="button"
        disabled={!googleAvailable || googleBusy}
        onClick={() => {
          setGoogleBusy(true)
          const token = new URLSearchParams(window.location.search).get('token')
          window.location.assign(
            token && /^[0-9a-f]{64}$/.test(token)
              ? `/auth/google?token=${token}`
              : '/auth/google',
          )
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.71-.06-1.42-.19-2.1H12v3.98h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.4Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.61-2.37l-3.22-2.5c-.9.6-2.04.96-3.39.96a6.1 6.1 0 0 1-5.73-4.23H2.94v2.58A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.27 13.86a6 6 0 0 1 0-3.72V7.56H2.94a10 10 0 0 0 0 8.88l3.33-2.58Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.91c1.43 0 2.7.49 3.71 1.45l2.79-2.79A9.96 9.96 0 0 0 12 2a10 10 0 0 0-9.06 5.56l3.33 2.58A6.1 6.1 0 0 1 12 5.91Z"
          />
        </svg>
        {googleBusy ? 'Redirecionando…' : 'Continuar com Google'}
      </button>
      {!googleAvailable && (
        <p className="auth-provider-note">
          Disponível após configurar o Google OAuth.
        </p>
      )}
      {oauthMessage && (
        <p role="alert" className="auth-error">
          {oauthMessage}
        </p>
      )}
      <Link to="/recuperar-senha">Esqueci minha senha</Link>
    </section>
  )
}
