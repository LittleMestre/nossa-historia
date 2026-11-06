import { Images } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { MediaCard } from './MediaCard'
import type { MediaCardData } from './MediaCard'

export function GalleryGrid({ items }: { items: MediaCardData[] }) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={Images}
        title="A galeria ainda espera suas histórias"
        description="As fotos e os vídeos enviados pela família aparecerão aqui, organizados por acontecimento."
      />
    )
  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  )
}
