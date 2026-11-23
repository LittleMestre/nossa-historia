import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { getSignedPhotoUrls, getTimelineMosaicPhotos } from '../../features/media/media'

export type TimelinePhotoEntry = { urls: string[]; expiresAt: number }

// Cache limitado à instância da visualização; nunca é compartilhado entre contas.
export function useTimelinePhotos(eventIds: string[], sharedCache?: RefObject<Map<string, TimelinePhotoEntry>>) {
  const key = eventIds.join(',')
  const localCache = useRef(new Map<string, TimelinePhotoEntry>())
  const cache = sharedCache ?? localCache
  const generation = useRef(0)
  const [photos, setPhotos] = useState<Record<string, string[]>>(() =>
    Object.fromEntries([...cache.current].filter(([, entry]) => entry.expiresAt > Date.now())
      .map(([id, entry]) => [id, entry.urls])),
  )
  const [error, setError] = useState(false)

  useEffect(() => {
    const currentGeneration = ++generation.current
    const pending = new Set<string>()
    const ids = key ? key.split(',') : []
    async function refresh() {
      if (document.hidden) return
      const needed = ids.filter((id) =>
        !pending.has(id) && (cache.current.get(id)?.expiresAt ?? 0) < Date.now(),
      )
      if (!needed.length) return
      needed.forEach((id) => pending.add(id))
      try {
        for (let offset = 0; offset < needed.length; offset += 60) {
          const batch = needed.slice(offset, offset + 60)
          const selected = await getTimelineMosaicPhotos({ data: { eventIds: batch } })
          if (generation.current !== currentGeneration) return
          const photoIds = Object.values(selected).flat()
          const signed = photoIds.length
            ? await Promise.all(Array.from({ length: Math.ceil(photoIds.length / 60) }, (_, index) =>
                getSignedPhotoUrls({ data: { ids: photoIds.slice(index * 60, index * 60 + 60), variant: 'thumbnail' } }),
              ))
            : []
          if (generation.current !== currentGeneration) return
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
        if (generation.current === currentGeneration) setError(true)
      } finally {
        needed.forEach((id) => pending.delete(id))
      }
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 45_000)
    const visible = () => { if (!document.hidden) void refresh() }
    document.addEventListener('visibilitychange', visible)
    return () => {
      generation.current++
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [key, cache])

  return { photos, error }
}
