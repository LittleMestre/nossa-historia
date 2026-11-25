import { router, useLocalSearchParams } from 'expo-router'
import { Text, View, useWindowDimensions } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { Chip } from '@/components/Stage'
import { Picture } from '@/components/Photo'
import { useApp } from '@/lib/app-context'
export default function Photo() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data } = useApp(),
    c = usePalette(),
    { height } = useWindowDimensions()
  const i = data.photos.findIndex((p) => p.id === id),
    p = data.photos[i],
    event = data.events.find((e) => e.id === p?.event_id)
  function move(delta: number) {
    router.setParams({ id: data.photos[i + delta].id })
  }
  return (
    <Screen title={event?.title ?? 'Fotografia'}>
      {p && (
        <>
          <View
            style={{
              height: height * 0.44,
              backgroundColor: c.soft,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <Picture key={p.id} photo={p} contain />
          </View>
          <Text style={{ color: c.ink, marginVertical: 12 }}>
            {i + 1} / {data.photos.length} · {p.description}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="‹ Anterior" disabled={!i} onPress={() => move(-1)} />
            <Chip
              label="Próxima ›"
              disabled={i === data.photos.length - 1}
              onPress={() => move(1)}
            />
          </View>
          {event && (
            <Button
              title="Ver acontecimento"
              outline
              onPress={() => router.push(`/event/${event.id}`)}
            />
          )}
        </>
      )}
      <Button
        title="Voltar"
        outline
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/gallery')
        }
      />
    </Screen>
  )
}
