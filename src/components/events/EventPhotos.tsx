import { useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '../ui/button'
import { uploadEventPhoto } from '../../features/media/media'
import type { getEventPhotos } from '../../features/media/media'
import { PrivatePhotos } from '../gallery/PrivatePhotos'

type PhotoData = Awaited<ReturnType<typeof getEventPhotos>>
type Selection = { id: string; file: File; status: 'selected' | 'sending' | 'done' | 'error'; error?: string; description?: string }
const MAX_BYTES = 20 * 1024 * 1024
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])

function size(bytes: number) { return `${(bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MiB` }

export function EventPhotos({ eventId, data }: { eventId: string; data: PhotoData }) {
  const router = useRouter()
  const [selection, setSelection] = useState<Selection[]>([])
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const input = useRef<HTMLInputElement>(null)

  function choose(files: FileList | null) {
    if (!files?.length) return
    setError('')
    setSelection((current) => [...current, ...Array.from(files, (file) => ({
      id: crypto.randomUUID(), file, status: 'selected' as const,
      error: !allowed.has(file.type) ? 'Formato não permitido.'
        : file.size < 1 || file.size > MAX_BYTES ? 'O arquivo deve ter até 20 MiB.' : undefined,
    }))])
    if (input.current) input.current.value = ''
  }

  async function send() {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true); setError(''); setNotice('')
    let completed = 0
    try {
      for (const item of selection.filter((entry) => entry.status !== 'done' && !entry.error)) {
        const savedDescription = item.description ?? description.trim()
        setSelection((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'sending', description: savedDescription } : entry))
        try {
          const form = new FormData()
          form.set('eventId', eventId)
          form.set('mediaId', item.id)
          form.set('description', savedDescription)
          form.set('file', item.file)
          const result = await uploadEventPhoto({ data: form })
          if (result.error) {
            setSelection((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'error', error: result.error } : entry))
          } else {
            completed++
            setSelection((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'done', error: undefined } : entry))
          }
        } catch {
          setSelection((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'error', error: 'Falha de conexão. Tente novamente.' } : entry))
        }
      }
      if (completed) {
        setNotice(`${completed} fotografia${completed === 1 ? '' : 's'} enviada${completed === 1 ? '' : 's'} com sucesso.`)
        try { await router.invalidate() }
        catch { setError('Envio concluído, mas não foi possível atualizar a lista. Recarregue a página.') }
      }
    } finally { inFlight.current = false; setBusy(false) }
  }

  return <section className="event-panel" aria-labelledby="event-photos-title">
    <h2 id="event-photos-title" className="text-2xl font-semibold">Fotografias</h2>
    <PrivatePhotos photos={data.photos} />
    {data.canUpload && <div className="event-form mt-5">
      <label className="grid gap-2 text-sm font-medium">Adicionar fotos
        <input ref={input} className="event-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => choose(event.target.files)} />
      </label>
      <p className="text-sm text-muted-foreground">JPEG, PNG ou WebP. Até 20 MiB por foto.</p>
      <label className="grid gap-2 text-sm font-medium">Descrição opcional para estas fotos
        <textarea className="event-input" value={description} maxLength={2000} disabled={busy} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {selection.length > 0 && <ul className="grid gap-2">{selection.map((item) =>
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
          <span className="min-w-0 break-all">{item.file.name} · {size(item.file.size)}
            <span className="block text-sm text-muted-foreground">{item.status === 'sending' ? 'Enviando…' : item.status === 'done' ? 'Concluído' : item.error ?? 'Pronto para enviar'}</span>
          </span>
          {item.status !== 'done' && !busy && <Button type="button" size="sm" variant="outline" onClick={() => setSelection((current) => current.filter((entry) => entry.id !== item.id))}>Remover</Button>}
        </li>)}</ul>}
      <Button type="button" disabled={busy || !selection.some((item) => item.status !== 'done' && !item.error)} onClick={() => void send()}>{busy ? 'Enviando…' : 'Confirmar envio'}</Button>
      {selection.some((item) => item.status === 'error') && <Button type="button" variant="outline" disabled={busy} onClick={() => setSelection((current) => current.map((item) => item.status === 'error' && allowed.has(item.file.type) && item.file.size > 0 && item.file.size <= MAX_BYTES ? { ...item, status: 'selected', error: undefined } : item))}>Tentar novamente</Button>}
    </div>}
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
  </section>
}
