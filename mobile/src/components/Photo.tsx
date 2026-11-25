import { useState } from 'react'
import { Text, View } from 'react-native'
import { Image } from 'expo-image'
import type { Photo } from '@/lib/model'
import { usePalette } from '@/lib/palette'
export function Picture({
  photo,
  contain = false,
}: {
  photo: Photo
  contain?: boolean
}) {
  const c = usePalette()
  const [failed, setFailed] = useState<string>()
  const source = photo.asset ?? (photo.url ? { uri: photo.url } : undefined)
  return source && failed !== (photo.url ?? 'asset') ? (
    <Image
      style={{ flex: 1 }}
      source={source}
      cachePolicy="none"
      contentFit={contain ? 'contain' : 'cover'}
      accessibilityLabel={photo.description ?? 'Fotografia'}
      onError={() => setFailed(photo.url ?? 'asset')}
    />
  ) : (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: c.soft,
      }}
    >
      <Text style={{ color: c.muted }}>Foto indisponível</Text>
    </View>
  )
}
export function Mosaic({
  photos,
  height = 96,
}: {
  photos: Photo[]
  height?: number
}) {
  const c = usePalette()
  const rows = photos.slice(0, 4)
  if (!rows.length)
    return (
      <View
        style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.soft,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: c.muted }}>Sem fotos</Text>
      </View>
    )
  const columns =
    rows.length <= 2
      ? rows.map((p) => [p])
      : rows.length === 3
        ? [[rows[0]], rows.slice(1)]
        : [rows.slice(0, 2), rows.slice(2)]
  return (
    <View
      style={{
        height,
        flexDirection: 'row',
        gap: 3,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {columns.map((col) => (
        <View key={col[0].id} style={{ flex: 1, gap: 3 }}>
          {col.map((p) => (
            <Picture key={p.id} photo={p} />
          ))}
        </View>
      ))}
    </View>
  )
}
