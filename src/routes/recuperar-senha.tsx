import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { requestPasswordReset } from '../features/auth/auth'

const schema = z.object({ email: z.email('Informe um e-mail válido.') })
type FormValues = z.infer<typeof schema>
export const Route = createFileRoute('/recuperar-senha')({
  component: RecoveryPage,
})

function RecoveryPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  async function onSubmit(values: FormValues) {
    setError('')
    try {
      await requestPasswordReset({ data: values })
      setSent(true)
    } catch {
      setError('Não foi possível solicitar a recuperação agora.')
    }
  }
  return (
    <section className="auth-card" aria-labelledby="recovery-title">
      <h1 id="recovery-title">Recuperar senha</h1>
      {sent ? (
        <p>
          Se o e-mail estiver cadastrado, você receberá um link para criar uma
          nova senha.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <p>Informe o e-mail da sua conta.</p>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span role="alert">{errors.email.message}</span>}
          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}
      <Link to="/entrar">Voltar ao login</Link>
    </section>
  )
}
