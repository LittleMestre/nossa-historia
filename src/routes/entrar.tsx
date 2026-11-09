import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '../features/auth/auth'

const schema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})
type FormValues = z.infer<typeof schema>

export const Route = createFileRoute('/entrar')({ component: LoginPage })

function LoginPage() {
  const [serverError, setServerError] = useState('')
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
      <Link to="/recuperar-senha">Esqueci minha senha</Link>
    </section>
  )
}
