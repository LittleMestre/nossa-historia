import { router, useLocalSearchParams } from 'expo-router'
import { Text } from 'react-native'
import { useApp } from '@/lib/app-context'
import { Screen, EventCard, Button, usePalette } from '@/components/ui'
export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data, active, user } = useApp(),
    c = usePalette()
  const person = data.people.find((p) => p.id === id),
    events = data.events.filter((e) =>
      data.participants[e.id]?.some((p) => p.id === id),
    )
  return (
    <Screen title={person?.name ?? 'Pessoa indisponível'}>
      {person && (
        <>
          <Text style={{ color: c.muted }}>
            {[person.nickname, person.description]
              .filter(Boolean)
              .join(' · ') || 'Sem descrição.'}
          </Text>
          {(active?.role === 'admin' ||
            (active?.role === 'contributor' &&
              person.created_by === user?.id)) && (
            <Button
              title="Editar pessoa"
              outline
              onPress={() =>
                router.push({
                  pathname: '/editor',
                  params: { kind: 'person', id },
                })
              }
            />
          )}
          <Text style={{ color: c.ink, fontSize: 20, marginVertical: 16 }}>
            Participação em eventos
          </Text>
          {events.length ? (
            events.map((e) => <EventCard key={e.id} event={e} />)
          ) : (
            <Text style={{ color: c.muted }}>Nenhum vínculo registrado.</Text>
          )}
        </>
      )}
      <Button
        title="Voltar"
        outline
        onPress={() => router.dismissTo('/people')}
      />
    </Screen>
  )
}
