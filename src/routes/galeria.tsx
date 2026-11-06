import { createFileRoute } from '@tanstack/react-router'
import { PageHeading } from '../components/layout/PageHeading'
import { GalleryGrid } from '../components/gallery/GalleryGrid'
import type { MediaCardData } from '../components/gallery/MediaCard'

export const Route = createFileRoute('/galeria')({ component: GalleryPage })
const items: MediaCardData[] = []

function GalleryPage() {
  return (
    <div className="inner-page">
      <PageHeading
        eyebrow="Retratos da nossa vida"
        title="Galeria"
        description="Um lugar para rever fotos e vídeos de cada momento compartilhado."
      />
      <GalleryGrid items={items} />
    </div>
  )
}
