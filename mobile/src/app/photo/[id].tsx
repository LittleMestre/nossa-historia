import { router, useLocalSearchParams } from 'expo-router'
import { Text, View, useWindowDimensions } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { Chip } from '@/components/Stage'
import { Picture } from '@/components/Photo'
import { useApp } from '@/lib/app-context'
import { confirmDemoAction } from '@/lib/demo-actions'
export default function Photo() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data, demoActions, busy } = useApp(),
    c = usePalette(),
    { height } = useWindowDimensions()
  const i = data.photos.findIndex((p) => p.id === id),
    p = data.photos[i],
    event = data.events.find((e) => e.id === p?.event_id)
  function move(delta: number) {
    router.setParams({ id: data.photos[i + delta].id })
  }
  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace('/gallery')
  }
  function deletePhoto() {
    if (!demoActions) return
    confirmDemoAction(
      'Excluir fotografia?',
      'A cópia da demonstração será removida da galeria e do acontecimento.',
      'Excluir',
      async () => {
        await demoActions.deletePhoto(id)
        goBack()
      },
    )
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
            {i + 1} / {data.photos.length}
            {p.description ? ` · ${p.description}` : ''}
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
          {demoActions && (
            <Button
              title="Excluir fotografia"
              outline
              disabled={busy}
              onPress={deletePhoto}
            />
          )}
        </>
      )}
      <Button title="Voltar" outline onPress={goBack} />
    </Screen>
  )
}
