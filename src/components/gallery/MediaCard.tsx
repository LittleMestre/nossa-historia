import { ImageIcon, Video } from 'lucide-react'

export interface MediaCardData {
  id: string
  thumbnailUrl: string
  alt: string
  kind: 'image' | 'video'
  eventTitle: string
  dateLabel?: string
}

export function MediaCard({ media }: { media: MediaCardData }) {
  return (
    <article className="media-card">
      <div className="media-card-image">
        <img src={media.thumbnailUrl} alt={media.alt} loading="lazy" />
        <span className="media-kind">
          {media.kind === 'video' ? (
            <Video size={16} />
          ) : (
            <ImageIcon size={16} />
          )}
          {media.kind === 'video' ? 'Vídeo' : 'Foto'}
        </span>
      </div>
      <div className="media-card-caption">
        <strong>{media.eventTitle}</strong>
        {media.dateLabel && <span>{media.dateLabel}</span>}
      </div>
    </article>
  )
}
