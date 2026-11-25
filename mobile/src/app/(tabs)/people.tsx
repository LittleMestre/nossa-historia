import { Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useApp } from '@/lib/app-context'
import { Screen, Button, Empty, usePalette } from '@/components/ui'
export default function People() {
  const { data, active, busy, demo } = useApp(),
    c = usePalette()
  return (
    <Screen title="Pessoas">
      {active?.role !== 'viewer' && (
        <Button
          title="Cadastrar pessoa"
          disabled={demo && busy}
          onPress={() => router.push('/editor?kind=person')}
        />
      )}
      <View style={{ gap: 8, marginTop: 14 }}>
        {data.people.map((p) => (
          <Pressable
            accessibilityRole="button"
            key={p.id}
            onPress={() => router.push(`/person/${p.id}`)}
            style={{
              backgroundColor: c.card,
              borderColor: c.border,
              borderWidth: 1,
              padding: 15,
              borderRadius: 14,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                backgroundColor: c.soft,
                color: c.accent,
                padding: 12,
                fontWeight: '700',
              }}
            >
              {p.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: c.ink }}>{p.name}</Text>
              {!!p.nickname && (
                <Text style={{ color: c.muted }}>{p.nickname}</Text>
              )}
            </View>
          </Pressable>
        ))}
      </View>
      {!data.people.length && (
        <Empty
          icon="people-outline"
          title={busy ? 'Carregando pessoas…' : 'Nenhuma pessoa cadastrada'}
          detail="Este espaço reúne as pessoas retratadas nos acontecimentos."
        />
      )}
    </Screen>
  )
}
