import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Images } from 'lucide-react'
import { PageHeading } from '../components/layout/PageHeading'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/button'
import { PrivatePhotos } from '../components/gallery/PrivatePhotos'
import { getGalleryPhotos } from '../features/media/media'

export const Route = createFileRoute('/galeria')({
  loader: () => getGalleryPhotos({ data: { page: 0 } }),
  component: GalleryPage,
})

function GalleryPage() {
  const first = Route.useLoaderData()
  const router = useRouter()
  const [more, setMore] = useState<typeof first.photos>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(first.hasMore)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setHasMore(first.hasMore) }, [first])
  const photos = [...first.photos, ...more.filter((photo) => !first.photos.some((item) => item.id === photo.id))]
  async function loadMore() {
    setBusy(true); setError('')
    try {
      const next = await getGalleryPhotos({ data: { page: page + 1 } })
      setMore((current) => [...current, ...next.photos])
      setPage(page + 1); setHasMore(next.hasMore)
    } catch { setError('Não foi possível carregar mais fotografias.') }
    finally { setBusy(false) }
  }
  return <div className="inner-page">
    <PageHeading eyebrow="Retratos da nossa vida" title="Galeria" description="Fotografias dos acontecimentos compartilhados pela família." />
    {photos.length ? <PrivatePhotos photos={photos} gallery /> : <EmptyState icon={Images} title="A galeria ainda espera suas histórias" description="As fotos enviadas pela família aparecerão aqui, organizadas por acontecimento." />}
    {hasMore && <Button className="mt-6" type="button" disabled={busy} onClick={() => void loadMore()}>{busy ? 'Carregando…' : 'Carregar mais fotos'}</Button>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <Button className="mt-6" type="button" variant="outline" onClick={() => { setMore([]); setPage(0); void router.invalidate() }}>Atualizar galeria</Button>
  </div>
}
