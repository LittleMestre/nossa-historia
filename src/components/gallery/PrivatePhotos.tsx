import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { deletePhoto, getSignedPhotoUrls } from '../../features/media/media'
import { Button } from '../ui/button'
import { GalleryGrid } from './GalleryGrid'
import { MediaCard } from './MediaCard'

export type PrivatePhoto = {
  id: string
  description: string | null
  original_filename: string
  event_id?: string
  eventTitle?: string
  canDelete?: boolean
}

export function PrivatePhotos({ photos, gallery = false }: { photos: PrivatePhoto[]; gallery?: boolean }) {
  const router = useRouter()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [original, setOriginal] = useState('')
  const [originalError, setOriginalError] = useState(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<PrivatePhoto | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const cancelDelete = useRef<HTMLButtonElement>(null)
  const visiblePhotos = photos.filter((photo) => !hiddenIds.includes(photo.id))
  const ids = visiblePhotos.map((photo) => photo.id).join(',')
  const selectedId = selected === null ? null : visiblePhotos[selected]?.id

  const refresh = useCallback(async () => {
    if (!ids) { setLoading(false); return }
    try {
      const allIds = ids.split(',')
      const batches = Array.from({ length: Math.ceil(allIds.length / 60) }, (_, index) => allIds.slice(index * 60, index * 60 + 60))
      const results = await Promise.all(batches.map((batch) => getSignedPhotoUrls({ data: { ids: batch, variant: 'thumbnail' } })))
      setUrls(Object.assign({}, ...results.map((result) => result.urls)))
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
      if (event.key === 'ArrowRight') setSelected((index) => index === null ? null : (index + 1) % visiblePhotos.length)
      if (event.key === 'ArrowLeft') setSelected((index) => index === null ? null : (index + visiblePhotos.length - 1) % visiblePhotos.length)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [selected, visiblePhotos.length])

  useEffect(() => {
    if (!pendingDelete) return
    cancelDelete.current?.focus()
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && !deleteBusy) setPendingDelete(null) }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [pendingDelete, deleteBusy])

  async function remove() {
    if (!pendingDelete || deleteBusy) return
    setDeleteBusy(true); setDeleteError('')
    try {
      const result = await deletePhoto({ data: { mediaId: pendingDelete.id } })
      if (result.error) { setDeleteError(result.error); return }
      setSelected(null)
      setHiddenIds((current) => [...current, pendingDelete.id])
      setPendingDelete(null)
      setNotice('Fotografia excluída. Um administrador poderá recuperá-la na lixeira.')
      try { await router.invalidate() }
      catch { setDeleteError('A fotografia foi excluída, mas não foi possível atualizar os dados agora.') }
    } catch { setDeleteError('Não foi possível excluir a fotografia. Tente novamente.') }
    finally { setDeleteBusy(false) }
  }

  function open(index: number) { previousFocus.current = document.activeElement as HTMLElement; setSelected(index) }
  function close() { setSelected(null); previousFocus.current?.focus() }

  if (!visiblePhotos.length && !notice) return <p className="mt-3 text-muted-foreground">Ainda não há fotografias neste acontecimento.</p>
  return <>
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {deleteError && <p role="alert" className="auth-error">{deleteError}</p>}
    {loading && <p role="status" className="mt-3 text-muted-foreground">Carregando fotografias…</p>}
    {!visiblePhotos.length && <p className="mt-3 text-muted-foreground">Não há mais fotografias nesta lista.</p>}
    {visiblePhotos.length > 0 && (gallery ? <GalleryGrid>{visiblePhotos.map((photo, index) => <div key={photo.id}><MediaCard media={photo} url={urls[photo.id]} loading={loading} failed={!!failed[photo.id]} onOpen={() => open(index)} onError={() => setFailed((current) => ({ ...current, [photo.id]: true }))} onRetry={() => void refresh()} />{photo.canDelete && <Button className="mt-2" type="button" size="sm" variant="outline" onClick={() => setPendingDelete(photo)}>Excluir fotografia</Button>}</div>)}</GalleryGrid>
      : <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">{visiblePhotos.map((photo, index) => <div key={photo.id}><MediaCard media={photo} url={urls[photo.id]} loading={loading} failed={!!failed[photo.id]} onOpen={() => open(index)} onError={() => setFailed((current) => ({ ...current, [photo.id]: true }))} onRetry={() => void refresh()} />{photo.canDelete && <Button className="mt-2" type="button" size="sm" variant="outline" onClick={() => setPendingDelete(photo)}>Excluir fotografia</Button>}</div>)}</div>
    )}
    {selected !== null && <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3 text-white sm:p-6" role="dialog" aria-modal="true" aria-label="Fotografia ampliada">
      <div className="flex items-center justify-end"><button ref={closeButton} type="button" onClick={close} aria-label="Fechar fotografia" className="rounded-lg p-2 hover:bg-white/20"><X /></button></div>
      <div className="flex min-h-0 flex-1 items-center justify-between gap-2">
        {visiblePhotos.length > 1 && <button type="button" aria-label="Fotografia anterior" className="rounded-lg p-2 hover:bg-white/20" onClick={() => setSelected((selected + visiblePhotos.length - 1) % visiblePhotos.length)}><ChevronLeft /></button>}
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          {original && !originalError ? <img src={original} alt={visiblePhotos[selected].description || visiblePhotos[selected].original_filename} className="max-h-[75vh] max-w-full object-contain" onError={() => setOriginalError(true)} /> : <p>{originalError ? 'Imagem indisponível.' : 'Carregando fotografia…'}</p>}
        </div>
        {visiblePhotos.length > 1 && <button type="button" aria-label="Próxima fotografia" className="rounded-lg p-2 hover:bg-white/20" onClick={() => setSelected((selected + 1) % visiblePhotos.length)}><ChevronRight /></button>}
      </div>
      <div className="mx-auto max-w-3xl py-3 text-center text-sm">{visiblePhotos[selected].description && <p>{visiblePhotos[selected].description}</p>}{visiblePhotos.length > 1 && <p>{selected + 1} de {visiblePhotos.length}</p>}</div>
    </div>}
    {pendingDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-photo-title" aria-describedby="delete-photo-description"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl"><h2 id="delete-photo-title" className="text-xl font-semibold">Excluir fotografia?</h2><p id="delete-photo-description" className="mt-3 text-sm text-muted-foreground">Esta fotografia será removida da galeria, mas poderá ser recuperada posteriormente por um administrador.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><Button ref={cancelDelete} type="button" variant="outline" disabled={deleteBusy} onClick={() => setPendingDelete(null)}>Cancelar</Button><Button type="button" variant="destructive" disabled={deleteBusy} onClick={() => void remove()}>{deleteBusy ? 'Excluindo…' : 'Excluir fotografia'}</Button></div>{deleteError && <p role="alert" className="auth-error mt-3">{deleteError}</p>}</div></div>}
  </>
}
