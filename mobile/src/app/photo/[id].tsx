import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { LocalField } from '@/components/LocalField'
import { canChange } from '@/lib/local-repository'
import { Alert, Text, View, useWindowDimensions } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { Chip } from '@/components/Stage'
import { Picture } from '@/components/Photo'
import { useApp } from '@/lib/app-context'
import { confirmDemoAction } from '@/lib/demo-actions'
export default function Photo() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data, demoActions, busy, active } = useApp(),
    c = usePalette(),
    { height } = useWindowDimensions()
  const i = data.photos.findIndex((p) => p.id === id),
    p = data.photos[i],
    event = data.events.find((e) => e.id === p?.event_id)
  const [caption, setCaption] = useState<string | null>(null)
  function move(delta: number) {
    setCaption(null)
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
      'A foto irá para a lixeira desta família.',
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
          {demoActions && active && canChange(active.role, p.created_by) && (
            <>
              <LocalField
                label="Descrição da foto"
                value={caption ?? p.description ?? ''}
                onChangeText={setCaption}
                maxLength={2000}
              />
              <Button
                outline
                disabled={busy || caption === null}
                title="Salvar descrição"
                onPress={() =>
                  void demoActions
                    .editPhoto(id, caption ?? '')
                    .then(() => {
                      setCaption(null)
                      Alert.alert('Descrição salva')
                    })
                    .catch((e) => Alert.alert('Falha ao salvar', e.message))
                }
              />
              <Button
                title="Excluir fotografia"
                outline
                disabled={busy}
                onPress={deletePhoto}
              />
            </>
          )}
        </>
      )}
      <Button title="Voltar" outline onPress={goBack} />
    </Screen>
  )
}
