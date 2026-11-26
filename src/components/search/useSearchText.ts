import { useEffect, useState } from 'react'

export function useSearchText(resetPage: () => void) {
  const [input, setInput] = useState('')
  const [debouncedText, setDebouncedText] = useState('')
  const text = input.trim()

  useEffect(() => {
    if (!text) return
    const timer = window.setTimeout(() => setDebouncedText(text), 350)
    return () => window.clearTimeout(timer)
  }, [text])

  function changeText(value: string) {
    const trimmed = value.trim()
    if (trimmed !== text) {
      resetPage()
      setDebouncedText('')
    }
    setInput(value)
  }

  return {
    input,
    text,
    waitingForText: !!text && text !== debouncedText,
    changeText,
  }
}
