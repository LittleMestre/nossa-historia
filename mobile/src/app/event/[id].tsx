import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, Empty, PhotoGrid, Screen, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
import { confirmDemoAction, pickDemoPhotos } from '@/lib/demo-actions'
import { eventDate } from '@/lib/model'
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, active, actor, demoActions, busy } = useApp()
  const c = usePalette()
  const [picking, setPicking] = useState(false)
  const event = data.events.find((item) => item.id === id)
  async function addPhotos() {
    if (!demoActions || busy || picking) return
    setPicking(true)
    try {
      const assets = await pickDemoPhotos()
      if (assets.length) await demoActions.addPhotos(id, assets)
    } catch (cause) {
      Alert.alert(
        'Não foi possível adicionar fotos',
        cause instanceof Error ? cause.message : 'Tente novamente.',
      )
    } finally {
      setPicking(false)
    }
  }
  function deleteEvent() {
    if (!demoActions) return
    confirmDemoAction(
      'Excluir acontecimento?',
      'O acontecimento e suas fotos serão ocultados nesta família.',
      'Excluir',
      async () => {
        await demoActions.deleteEvent(id)
        router.dismissTo('/events')
      },
    )
  }
  if (!event)
    return (
      <Screen title="Acontecimento indisponível">
        <Empty
          icon="alert-circle-outline"
          title="Não encontrado"
          detail="Este acontecimento não está disponível no espaço atual."
        />
        <Button title="Voltar" onPress={() => router.back()} outline />
      </Screen>
    )
  const photos = data.photos.filter((photo) => photo.event_id === event.id)
  return (
    <Screen title={event.title} eyebrow="ACONTECIMENTO">
      <Button
        title="Voltar"
        onPress={() => router.back()}
        outline
        icon="arrow-back"
      />
      <View
        style={{
          marginTop: 24,
          borderRadius: 20,
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
          padding: 20,
        }}
      >
        <Text style={{ color: c.warm, fontWeight: '800' }}>
          {eventDate(event)}
        </Text>
        <Text style={{ color: c.muted, marginTop: 8 }}>
          {
            { family: 'Familiar', individual: 'Individual', other: 'Outro' }[
              event.moment_type
            ]
          }{' '}
          · {data.categories[event.category_id ?? ''] ?? 'Sem categoria'}
        </Text>
        <Text
          style={{ color: c.ink, fontSize: 16, lineHeight: 25, marginTop: 22 }}
        >
          {event.location ? event.location + '\n' : ''}
          {event.description || 'Nenhuma descrição foi adicionada.'}
        </Text>
        {demoActions &&
          (active?.role === 'admin' ||
            (active?.role === 'contributor' && event.created_by === actor)) && (
            <Button
              title="Editar acontecimento"
              outline
              disabled={!!demoActions && (busy || picking)}
              onPress={() =>
                router.push({
                  pathname: '/editor',
                  params: { kind: 'event', id: event.id },
                })
              }
            />
          )}
        {demoActions && active?.role !== 'viewer' && (
          <Button
            title={
              picking ? 'Selecionando fotografias…' : 'Adicionar fotografias'
            }
            icon="images-outline"
            disabled={busy || picking}
            onPress={() => void addPhotos()}
          />
        )}
        <PhotoGrid photos={photos} max={photos.length} />
      </View>
      <Text
        style={{
          color: c.ink,
          fontFamily: 'serif',
          fontSize: 24,
          marginTop: 28,
          marginBottom: 12,
        }}
      >
        Pessoas nesta história
      </Text>
      {(data.participants[event.id] ?? []).length ? (
        data.participants[event.id].map((person) => (
          <Text
            accessibilityRole="link"
            onPress={() => router.push(`/person/${person.id}`)}
            key={person.id}
            style={{
              color: c.ink,
              backgroundColor: c.card,
              padding: 12,
              borderRadius: 10,
              marginBottom: 6,
            }}
          >
            {person.name}
          </Text>
        ))
      ) : (
        <Text style={{ color: c.muted }}>Nenhuma pessoa vinculada.</Text>
      )}
      {demoActions &&
        (active?.role === 'admin' ||
          (active?.role === 'contributor' && event.created_by === actor)) && (
          <Button
            title="Excluir acontecimento"
            outline
            disabled={busy || picking}
            onPress={deleteEvent}
          />
        )}
    </Screen>
  )
}
