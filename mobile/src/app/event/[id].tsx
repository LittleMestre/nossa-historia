import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, Empty, PhotoGrid, Screen, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
import { eventDate } from '@/lib/model'
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, active, user } = useApp()
  const c = usePalette()
  const event = data.events.find((item) => item.id === id)
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
          {data.categories[event.category_id ?? ''] ?? 'Momento especial'}
        </Text>
        <Text
          style={{ color: c.ink, fontSize: 16, lineHeight: 25, marginTop: 22 }}
        >
          {event.description || 'Nenhuma descrição foi adicionada.'}
        </Text>
        {(active?.role === 'admin' ||
          (active?.role === 'contributor' &&
            event.created_by === user?.id)) && (
          <Button
            title="Editar acontecimento"
            outline
            onPress={() =>
              router.push({
                pathname: '/editor',
                params: { kind: 'event', id: event.id },
              })
            }
          />
        )}
        <PhotoGrid photos={photos} max={60} />
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
    </Screen>
  )
}
