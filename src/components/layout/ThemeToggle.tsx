import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = window.localStorage.getItem('nossa-historia-theme')
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
    const next: Theme =
      saved === 'dark' || (saved !== 'light' && preferred) ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.theme = next
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('nossa-historia-theme', next)
  }

  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={
        theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'
      }
      title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
    >
      {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  )
}
