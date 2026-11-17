import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ImageOff, RotateCcw } from 'lucide-react'
import { PageHeading } from '../components/layout/PageHeading'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/button'
import {
  confirmPendingPhotoUpload, getOrphanPhotoObjects, getPendingPhotoUploads, getPhotoTrash, restorePhoto,
} from '../features/media/media'

export const Route = createFileRoute('/lixeira')({
  loader: async () => {
    const [trash, pending, orphans] = await Promise.all([
      getPhotoTrash({ data: { page: 0 } }),
      getPendingPhotoUploads({ data: { page: 0 } }),
      getOrphanPhotoObjects({ data: { page: 0 } }),
    ])
    if (!trash || !pending || !orphans) throw notFound()
    return { trash, pending, orphans }
  },
  pendingComponent: () => <div className="inner-page"><p role="status">Carregando lixeira…</p></div>,
  errorComponent: () => <div className="inner-page"><p role="alert" className="auth-error">Não foi possível carregar a lixeira. Tente atualizar a página.</p></div>,
  component: PhotoTrashPage,
})

function PhotoTrashPage() {
  const { trash, pending, orphans } = Route.useLoaderData()
  const router = useRouter()
  const [moreTrash, setMoreTrash] = useState<typeof trash.photos>([])
  const [morePending, setMorePending] = useState<typeof pending.photos>([])
  const [moreOrphans, setMoreOrphans] = useState<typeof orphans.objects>([])
  const [trashPage, setTrashPage] = useState(0)
  const [pendingPage, setPendingPage] = useState(0)
  const [orphanPage, setOrphanPage] = useState(0)
  const [trashHasMore, setTrashHasMore] = useState(trash.hasMore)
  const [pendingHasMore, setPendingHasMore] = useState(pending.hasMore)
  const [orphanHasMore, setOrphanHasMore] = useState(orphans.hasMore)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { setTrashHasMore(trash.hasMore); setPendingHasMore(pending.hasMore); setOrphanHasMore(orphans.hasMore) }, [trash, pending, orphans])

  const trashed = [...trash.photos, ...moreTrash].filter((photo) => !hiddenIds.includes(photo.id))
  const pendingPhotos = [...pending.photos, ...morePending].filter((photo) => !hiddenIds.includes(photo.id))
  const orphanObjects = [...orphans.objects, ...moreOrphans]

  async function restore(id: string) {
    if (busyId) return
    setBusyId(id); setError(''); setNotice('')
    try {
      const result = await restorePhoto({ data: { mediaId: id } })
      if (result.error) { setError(result.error); return }
      setHiddenIds((current) => [...current, id])
      setNotice('Fotografia restaurada. Ela voltará a aparecer na galeria e no evento.')
      await router.invalidate()
    } catch { setError('A operação foi concluída ou a atualização falhou. Atualize a página para conferir.') }
    finally { setBusyId(null) }
  }

  async function confirm(id: string) {
    if (busyId) return
    setBusyId(id); setError(''); setNotice('')
    try {
      const result = await confirmPendingPhotoUpload({ data: { mediaId: id } })
      if (result.error) { setError(result.error); return }
      setHiddenIds((current) => [...current, id])
      setNotice('Arquivo conferido e disponibilizado na galeria.')
      await router.invalidate()
    } catch { setError('A operação foi concluída ou a atualização falhou. Atualize a página para conferir.') }
    finally { setBusyId(null) }
  }

  async function loadTrash() {
    setLoadingMore('trash'); setError('')
    try {
      const next = await getPhotoTrash({ data: { page: trashPage + 1 } })
      if (!next) throw new Error('unauthorized')
      setMoreTrash((current) => [...current, ...next.photos])
      setTrashPage((current) => current + 1); setTrashHasMore(next.hasMore)
    } catch { setError('Não foi possível carregar mais fotografias excluídas.') }
    finally { setLoadingMore(null) }
  }

  async function loadPending() {
    setLoadingMore('pending'); setError('')
    try {
      const next = await getPendingPhotoUploads({ data: { page: pendingPage + 1 } })
      if (!next) throw new Error('unauthorized')
      setMorePending((current) => [...current, ...next.photos])
      setPendingPage((current) => current + 1); setPendingHasMore(next.hasMore)
    } catch { setError('Não foi possível carregar mais uploads pendentes.') }
    finally { setLoadingMore(null) }
  }

  async function loadOrphans() {
    setLoadingMore('orphans'); setError('')
    try {
      const next = await getOrphanPhotoObjects({ data: { page: orphanPage + 1 } })
      if (!next) throw new Error('unauthorized')
      setMoreOrphans((current) => [...current, ...next.objects])
      setOrphanPage((current) => current + 1); setOrphanHasMore(next.hasMore)
    } catch { setError('Não foi possível carregar mais objetos sem registro.') }
    finally { setLoadingMore(null) }
  }

  return <div className="inner-page">
    <PageHeading eyebrow="Gerenciamento de fotografias" title="Lixeira" description="Fotografias excluídas permanecem guardadas para recuperação. Nenhum arquivo é removido automaticamente." />
    <Link className="event-back" to="/galeria">← Voltar à galeria</Link>
    {notice && <p role="status" className="event-notice">{notice}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <section className="event-panel" aria-labelledby="trash-title">
      <h2 id="trash-title" className="text-2xl font-semibold">Fotografias excluídas</h2>
      {trashed.length ? <ul className="mt-4 grid gap-3">{trashed.map((photo) => <li key={photo.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4">
        <ImageOff className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1"><strong className="break-all">{photo.original_filename}</strong><p className="text-sm text-muted-foreground">Evento: {photo.eventTitle}{!photo.eventActive && ' (excluído)'}</p><p className="text-sm text-muted-foreground">Excluída em {new Date(photo.deleted_at!).toLocaleString('pt-BR')}{photo.deletedByName && ` por ${photo.deletedByName}`}</p></div>
        <Button type="button" size="sm" disabled={!!busyId || !photo.eventActive} onClick={() => void restore(photo.id)}><RotateCcw size={16} />{busyId === photo.id ? 'Restaurando…' : 'Restaurar'}</Button>
        {!photo.eventActive && <p className="w-full text-sm text-muted-foreground">Restaure o evento antes da fotografia.</p>}
      </li>)}</ul> : <EmptyState icon={ImageOff} title="Lixeira vazia" description="Nenhuma fotografia excluída neste espaço familiar." />}
      {trashHasMore && <Button className="mt-4" type="button" variant="outline" disabled={!!loadingMore} onClick={() => void loadTrash()}>{loadingMore === 'trash' ? 'Carregando…' : 'Carregar mais excluídas'}</Button>}
    </section>
    <section className="event-panel" aria-labelledby="pending-title">
      <h2 id="pending-title" className="text-2xl font-semibold">Uploads pendentes</h2>
      <p className="mt-2 text-sm text-muted-foreground">Após 24 horas, um envio pode ter sido interrompido. A confirmação só é liberada quando o objeto e seus metadados correspondem ao registro.</p>
      {pendingPhotos.length ? <ul className="mt-4 grid gap-3">{pendingPhotos.map((photo) => {
        const old = Date.now() - new Date(photo.created_at).getTime() >= 24 * 60 * 60 * 1000
        return <li key={photo.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4">
          <ImageOff className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1"><strong className="break-all">{photo.original_filename}</strong><p className="text-sm text-muted-foreground">Evento: {photo.event_title}{!photo.event_active && ' (excluído)'}</p><p className="text-sm text-muted-foreground">Iniciado em {new Date(photo.created_at).toLocaleString('pt-BR')} · {old ? 'Possivelmente interrompido' : 'Ainda recente'}</p><p className="text-sm text-muted-foreground">Objeto: {photo.object_state === 'valid' ? 'presente e íntegro' : photo.object_state === 'missing' ? 'não encontrado' : 'metadados divergentes'}</p></div>
          {photo.object_state === 'valid' && photo.event_active && <Button type="button" size="sm" disabled={!!busyId} onClick={() => void confirm(photo.id)}>{busyId === photo.id ? 'Conferindo…' : 'Confirmar arquivo'}</Button>}
        </li>
      })}</ul> : <p className="mt-4 text-muted-foreground">Nenhum upload pendente neste espaço.</p>}
      {pendingHasMore && <Button className="mt-4" type="button" variant="outline" disabled={!!loadingMore} onClick={() => void loadPending()}>{loadingMore === 'pending' ? 'Carregando…' : 'Carregar mais pendentes'}</Button>}
    </section>
    <section className="event-panel" aria-labelledby="orphans-title">
      <h2 id="orphans-title" className="text-2xl font-semibold">Objetos sem registro</h2>
      <p className="mt-2 text-sm text-muted-foreground">Possíveis arquivos órfãos do espaço ativo. Esta lista é apenas para investigação; nenhum objeto é apagado.</p>
      {orphanObjects.length ? <ul className="mt-4 grid gap-3">{orphanObjects.map((object) => <li key={object.object_name} className="rounded-xl border border-border p-4"><code className="break-all text-sm">{object.object_name}</code><p className="mt-1 text-sm text-muted-foreground">Registrado em {new Date(object.created_at).toLocaleString('pt-BR')}</p></li>)}</ul> : <p className="mt-4 text-muted-foreground">Nenhum objeto sem registro foi encontrado.</p>}
      {orphanHasMore && <Button className="mt-4" type="button" variant="outline" disabled={!!loadingMore} onClick={() => void loadOrphans()}>{loadingMore === 'orphans' ? 'Carregando…' : 'Carregar mais objetos'}</Button>}
    </section>
  </div>
}
