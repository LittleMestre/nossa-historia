import { useEffect, useState } from 'react'

interface TimelineYearNavigatorProps {
  focusedYear: number
  onJump: (year: number) => void
}

export function TimelineYearNavigator({
  focusedYear,
  onJump,
}: TimelineYearNavigatorProps) {
  const [value, setValue] = useState(String(focusedYear))
  const [error, setError] = useState('')

  useEffect(() => setValue(String(focusedYear)), [focusedYear])

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(value)
    if (!/^\d{4}$/.test(value) || !Number.isInteger(year)) {
      setError('Digite um ano com quatro dígitos.')
      return
    }
    setError('')
    onJump(year)
  }

  return (
    <form className="cinema-year-form" onSubmit={submit}>
      <label htmlFor="timeline-year">Ir para o ano</label>
      <div>
        <input
          id="timeline-year"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'timeline-year-error' : undefined}
        />
        <button type="submit">Ir</button>
      </div>
      {error && (
        <span id="timeline-year-error" role="alert">
          {error}
        </span>
      )}
    </form>
  )
}
