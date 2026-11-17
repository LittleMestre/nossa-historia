import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getSignedPhotoUrls } from '../../features/media/media'
import { GalleryGrid } from './GalleryGrid'
import { MediaCard } from './MediaCard'

export type PrivatePhoto = {
  id: string
  description: string | null
  original_filename: string
  event_id?: string
  eventTitle?: string
}

export function PrivatePhotos({ photos, gallery = false }: { photos: PrivatePhoto[]; gallery?: boolean }) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [original, setOriginal] = useState('')
  const [originalError, setOriginalError] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const ids = photos.map((photo) => photo.id).join(',')
  const selectedId = selected === null ? null : photos[selected]?.id

  const refresh = useCallback(async () => {
    if (!ids) { setLoading(false); return }
    try {
      const result = await getSignedPhotoUrls({ data: { ids: ids.split(','), variant: 'thumbnail' } })
      setUrls(result.urls)
      setFailed({})
    } catch { setFailed(Object.fromEntries(ids.split(',').map((id) => [id, true]))) }
    finally { setLoading(false) }
  }, [ids])

  useEffect(() => {
    setLoading(true)
    void refresh()
    const timer = window.setInterval(() => { if (!document.hidden) void refresh() }, 45_000)
    const visible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', visible)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [refresh])

  useEffect(() => {
    if (!selectedId) return
    let active = true
    setOriginal(''); setOriginalError(false)
    void getSignedPhotoUrls({ data: { ids: [selectedId], variant: 'original' } })
      .then((result) => { if (active) { setOriginal(result.urls[selectedId] ?? ''); setOriginalError(!result.urls[selectedId]) } })
      .catch(() => { if (active) setOriginalError(true) })
    const timer = window.setInterval(() => {
      if (document.hidden) return
      void getSignedPhotoUrls({ data: { ids: [selectedId], variant: 'original' } })
        .then((result) => { if (active && result.urls[selectedId]) { setOriginal(result.urls[selectedId]); setOriginalError(false) } })
        .catch(() => { if (active) setOriginalError(true) })
    }, 45_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [selectedId])

  useEffect(() => {
    if (selected === null) return
    closeButton.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowRight') setSelected((index) => index === null ? null : (index + 1) % photos.length)
      if (event.key === 'ArrowLeft') setSelected((index) => index === null ? null : (index + photos.length - 1) % photos.length)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [selected, photos.length])

  function open(index: number) { previousFocus.current = document.activeElement as HTMLElement; setSelected(index) }
  function close() { setSelected(null); previousFocus.current?.focus() }

  if (!photos.length) return <p className="mt-3 text-muted-foreground">Ainda não há fotografias neste acontecimento.</p>
  return <>
    {loading && <p role="status" className="mt-3 text-muted-foreground">Carregando fotografias…</p>}
    {gallery ? <GalleryGrid>{photos.map((photo, index) => <MediaCard key={photo.id} media={photo} url={urls[photo.id]} loading={loading} failed={!!failed[photo.id]} onOpen={() => open(index)} onError={() => setFailed((current) => ({ ...current, [photo.id]: true }))} onRetry={() => void refresh()} />)}</GalleryGrid>
      : <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">{photos.map((photo, index) => <MediaCard key={photo.id} media={photo} url={urls[photo.id]} loading={loading} failed={!!failed[photo.id]} onOpen={() => open(index)} onError={() => setFailed((current) => ({ ...current, [photo.id]: true }))} onRetry={() => void refresh()} />)}</div>}
    {selected !== null && <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3 text-white sm:p-6" role="dialog" aria-modal="true" aria-label="Fotografia ampliada">
      <div className="flex items-center justify-end"><button ref={closeButton} type="button" onClick={close} aria-label="Fechar fotografia" className="rounded-lg p-2 hover:bg-white/20"><X /></button></div>
      <div className="flex min-h-0 flex-1 items-center justify-between gap-2">
        {photos.length > 1 && <button type="button" aria-label="Fotografia anterior" className="rounded-lg p-2 hover:bg-white/20" onClick={() => setSelected((selected + photos.length - 1) % photos.length)}><ChevronLeft /></button>}
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          {original && !originalError ? <img src={original} alt={photos[selected].description || photos[selected].original_filename} className="max-h-[75vh] max-w-full object-contain" onError={() => setOriginalError(true)} /> : <p>{originalError ? 'Imagem indisponível.' : 'Carregando fotografia…'}</p>}
        </div>
        {photos.length > 1 && <button type="button" aria-label="Próxima fotografia" className="rounded-lg p-2 hover:bg-white/20" onClick={() => setSelected((selected + 1) % photos.length)}><ChevronRight /></button>}
      </div>
      <div className="mx-auto max-w-3xl py-3 text-center text-sm">{photos[selected].description && <p>{photos[selected].description}</p>}{photos.length > 1 && <p>{selected + 1} de {photos.length}</p>}</div>
    </div>}
  </>
}
