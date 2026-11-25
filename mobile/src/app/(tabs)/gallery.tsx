import { Text, View, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useApp } from '@/lib/app-context'
import { Screen, Empty, Button, usePalette } from '@/components/ui'
import { Picture } from '@/components/Photo'
export default function Gallery() {
  const { data, busy, error, refresh, active } = useApp(),
    c = usePalette()
  return (
    <Screen title="Galeria">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {data.photos.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={p.description ?? 'Abrir fotografia'}
            style={{
              width: '48%',
              aspectRatio: 0.85,
              borderRadius: 12,
              padding: 4,
              backgroundColor: c.card,
            }}
            onPress={() => router.push(`/photo/${p.id}`)}
          >
            <Picture photo={p} />
            <Text numberOfLines={1} style={{ color: c.ink, padding: 5 }}>
              {data.events.find((e) => e.id === p.event_id)?.title ??
                'Fotografia'}
            </Text>
          </Pressable>
        ))}
      </View>
      {busy && <ActivityIndicator color={c.accent} />}
      {!!error && (
        <Button title="Tentar novamente" onPress={() => void refresh()} />
      )}
      {!busy && !data.photos.length && !error && (
        <Empty
          icon="images-outline"
          title="Álbum vazio"
          detail="As fotografias deste espaço aparecerão aqui."
        />
      )}
      {active?.role === 'admin' && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: c.ink, fontSize: 20 }}>
            Gerenciar fotografias
          </Text>
          <Text style={{ color: c.muted, marginTop: 6 }}>
            Lixeira administrativa disponível na versão web.
          </Text>
        </View>
      )}
    </Screen>
  )
}
