import { ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Button, Empty, EventCard, Screen, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
export default function Events() {
  const { data, busy, active, demo } = useApp()
  const c = usePalette()
  return (
    <Screen title="Acontecimentos" eyebrow="TODAS AS HISTÓRIAS">
      {demo && active && active.role !== 'viewer' && (
        <Button
          title="Criar acontecimento"
          disabled={demo && busy}
          onPress={() => router.push('/editor?kind=event')}
        />
      )}
      {busy && <ActivityIndicator color={c.accent} />}
      {!busy && !data.events.length && (
        <Empty
          icon="book-outline"
          title="Nenhum acontecimento"
          detail="Os eventos do espaço selecionado aparecerão aqui."
        />
      )}
      {data.events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </Screen>
  )
}
