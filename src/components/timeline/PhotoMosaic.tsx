import { ImageIcon } from 'lucide-react'

export function PhotoMosaic({ urls, error = false }: { urls?: string[]; error?: boolean }) {
  const shown = urls?.slice(0, 4) ?? []
  if (!shown.length) return <span className="cinema-photo-empty">
    <ImageIcon size={30} strokeWidth={1.25} />
    <span>{error ? 'Fotos indisponíveis' : urls ? 'Sem fotos' : 'Carregando fotos…'}</span>
  </span>
  return <span className={`photo-mosaic photo-mosaic-${shown.length}`} aria-hidden="true">
    {shown.map((url) => <img key={url} src={url} alt="" loading="lazy" draggable={false} />)}
  </span>
}
