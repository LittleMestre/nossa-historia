import { useEffect, useRef, useState } from 'react'
import { getSignedPhotoUrls, getTimelineMosaicPhotos } from '../../features/media/media'

type Entry = { urls: string[]; expiresAt: number }

// Cache limitado à instância da visualização; nunca é compartilhado entre contas.
export function useTimelinePhotos(eventIds: string[]) {
  const key = eventIds.join(',')
  const cache = useRef(new Map<string, Entry>())
  const pending = useRef(new Set<string>())
  const [photos, setPhotos] = useState<Record<string, string[]>>({})
  const [error, setError] = useState(false)

  useEffect(() => {
    const ids = key ? key.split(',') : []
    async function refresh() {
      if (document.hidden) return
      const needed = ids.filter((id) =>
        !pending.current.has(id) && (cache.current.get(id)?.expiresAt ?? 0) < Date.now(),
      )
      if (!needed.length) return
      needed.forEach((id) => pending.current.add(id))
      try {
        for (let offset = 0; offset < needed.length; offset += 60) {
          const batch = needed.slice(offset, offset + 60)
          const selected = await getTimelineMosaicPhotos({ data: { eventIds: batch } })
          const photoIds = Object.values(selected).flat()
          const signed = photoIds.length
            ? await Promise.all(Array.from({ length: Math.ceil(photoIds.length / 60) }, (_, index) =>
                getSignedPhotoUrls({ data: { ids: photoIds.slice(index * 60, index * 60 + 60), variant: 'thumbnail' } }),
              ))
            : []
          const urls = Object.assign({}, ...signed.map((result) => result.urls)) as Record<string, string>
          for (const id of batch) {
            cache.current.set(id, {
              urls: (selected[id] ?? []).map((photoId) => urls[photoId]).filter((url): url is string => !!url),
              expiresAt: Date.now() + 45_000,
            })
          }
        }
        setPhotos(Object.fromEntries([...cache.current].map(([id, entry]) => [id, entry.urls])))
        setError(false)
      } catch {
        setError(true)
      } finally {
        needed.forEach((id) => pending.current.delete(id))
      }
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 45_000)
    const visible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', visible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [key])

  return { photos, error }
}
