import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { exchangeRecoveryCode, updatePassword } from '../features/auth/auth'

const schema = z
  .object({
    password: z.string().min(12, 'Use pelo menos 12 caracteres.'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem.',
  })
type FormValues = z.infer<typeof schema>
export const Route = createFileRoute('/nova-senha')({
  component: NewPasswordPage,
})

function NewPasswordPage() {
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setError('Link inválido. Solicite uma nova recuperação.')
      return
    }
    exchangeRecoveryCode({ data: { code } })
      .then((result) => {
        if (result.ok) {
          window.history.replaceState({}, '', '/nova-senha')
          setReady(true)
        } else setError('Link expirado. Solicite uma nova recuperação.')
      })
      .catch(() => setError('Não foi possível validar o link.'))
  }, [])

  async function onSubmit(values: FormValues) {
    setError('')
    try {
      const result = await updatePassword({
        data: { password: values.password },
      })
      if (result.error) setError(result.error)
      else setDone(true)
    } catch {
      setError('Não foi possível alterar a senha.')
    }
  }
  return (
    <section className="auth-card" aria-labelledby="new-password-title">
      <h1 id="new-password-title">Criar nova senha</h1>
      {done ? (
        <p>Senha alterada. Você já pode acessar o álbum.</p>
      ) : ready ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="new-password">Nova senha</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <span role="alert">{errors.password.message}</span>
          )}
          <label htmlFor="confirm-password">Confirme a senha</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            {...register('confirm')}
            aria-invalid={!!errors.confirm}
          />
          {errors.confirm && <span role="alert">{errors.confirm.message}</span>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar senha'}
          </button>
        </form>
      ) : (
        !error && <p>Validando link…</p>
      )}
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <Link to="/entrar">Ir para o login</Link>
    </section>
  )
}
