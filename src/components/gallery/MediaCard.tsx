import { Link } from '@tanstack/react-router'

export interface MediaCardData {
  id: string
  original_filename: string
  description: string | null
  event_id?: string
  eventTitle?: string
}

export function MediaCard({ media, url, loading, failed, onOpen, onError, onRetry }: {
  media: MediaCardData
  url?: string
  loading: boolean
  failed: boolean
  onOpen: () => void
  onError: () => void
  onRetry: () => void
}) {
  return <article className="media-card">
    <button type="button" className="media-card-image block w-full text-left" onClick={onOpen} aria-label={`Ampliar ${media.original_filename}`}>
      {url && !failed
        ? <img src={url} alt={media.description || media.original_filename} loading="lazy" onError={onError} />
        : <span className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">{loading ? 'Carregando…' : 'Imagem indisponível'}</span>}
    </button>
    <div className="media-card-caption flex-col">
      {media.eventTitle && media.event_id && <Link to="/eventos/$eventId" params={{ eventId: media.event_id }} className="font-semibold underline-offset-2 hover:underline">{media.eventTitle}</Link>}
      {media.description && <span>{media.description}</span>}
      {failed && <button type="button" className="text-left text-sm underline" onClick={onRetry}>Tentar carregar novamente</button>}
    </div>
  </article>
}
