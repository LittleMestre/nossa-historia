import { Picture, Mosaic } from './Photo'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { usePalette } from '@/lib/palette'
import type { ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, usePathname } from 'expo-router'
import { useApp } from '@/lib/app-context'
import { eventDate, type Event, type Photo } from '@/lib/model'

export function Screen({
  title,
  eyebrow,
  children,
  scroll = true,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  scroll?: boolean
}) {
  const c = usePalette()
  const inset = useSafeAreaInsets()
  const path = usePathname()
  const { demo, user, active, error } = useApp()
  const content = (
    <View
      style={{
        paddingHorizontal: 22,
        paddingTop: 20,
        paddingBottom: 24 + inset.bottom,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: c.warm,
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            marginBottom: 10,
          }}
        >
          {eyebrow ?? 'NOSSA HISTÓRIA'}
        </Text>
        {(demo || user) && path !== '/account' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir conta"
            hitSlop={8}
            onPress={() => router.push('/account')}
            style={{ padding: 8 }}
          >
            <Ionicons name="person-circle-outline" size={27} color={c.accent} />
          </Pressable>
        )}
      </View>
      <Text
        style={{
          color: c.ink,
          fontFamily: 'serif',
          fontSize: 34,
          lineHeight: 40,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {active && (
        <Text style={{ color: c.muted, marginBottom: 10 }}>
          {active.name} ·{' '}
          {active.role === 'admin'
            ? 'Administrador'
            : active.role === 'contributor'
              ? 'Colaborador'
              : 'Leitor'}
        </Text>
      )}
      {demo && (
        <Text style={{ color: c.muted, fontSize: 12, marginBottom: 12 }}>
          Modo demonstração — dados salvos neste aparelho
        </Text>
      )}
      {!!error && <Banner>{error}</Banner>}
      {children}
    </View>
  )
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: inset.top }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  )
}
export function Banner({ children }: { children: ReactNode }) {
  const c = usePalette()
  return (
    <View
      style={{
        backgroundColor: c.soft,
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
      }}
    >
      <Text style={{ color: c.ink, fontSize: 12, fontWeight: '700' }}>
        {children}
      </Text>
    </View>
  )
}
export function Empty({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  detail: string
}) {
  const c = usePalette()
  return (
    <View
      style={{
        alignItems: 'center',
        padding: 28,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 20,
      }}
    >
      <Ionicons name={icon} size={34} color={c.warm} />
      <Text
        style={{
          color: c.ink,
          fontFamily: 'serif',
          fontSize: 22,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: c.muted,
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 20,
        }}
      >
        {detail}
      </Text>
    </View>
  )
}
export function Button({
  title,
  onPress,
  outline = false,
  icon,
  disabled = false,
}: {
  title: string
  onPress: () => void
  outline?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  disabled?: boolean
}) {
  const c = usePalette()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={{
        padding: 15,
        backgroundColor: outline ? c.card : c.accent,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text style={{ color: outline ? c.accent : c.bg, fontWeight: '800' }}>
        {title}
      </Text>
      {!!icon && (
        <Ionicons name={icon} size={18} color={outline ? c.accent : c.bg} />
      )}
    </Pressable>
  )
}
export function PhotoGrid({
  photos,
  max = 4,
}: {
  photos: Photo[]
  max?: number
}) {
  const c = usePalette()
  const visible = photos.slice(0, max)
  if (!visible.length) return null
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 14 }}
    >
      {visible.map((photo) => (
        <Pressable
          key={photo.id}
          onPress={() => router.push(`/photo/${photo.id}`)}
          style={{
            width: visible.length === 1 ? '100%' : '49%',
            height: visible.length === 1 ? 190 : 125,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: c.soft,
          }}
        >
          <Picture photo={photo} />
        </Pressable>
      ))}
    </View>
  )
}
export function EventCard({
  event,
  timeline = false,
}: {
  event: Event
  timeline?: boolean
}) {
  const c = usePalette()
  const { data } = useApp()
  const photos = data.photos.filter((photo) => photo.event_id === event.id)
  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          marginLeft: timeline ? 17 : 0,
          marginBottom: 14,
        },
      ]}
    >
      <Text
        style={{
          color: c.warm,
          fontWeight: '800',
          fontSize: 12,
          letterSpacing: 1,
        }}
      >
        {eventDate(event).toUpperCase()}
      </Text>
      <Text
        style={{
          color: c.ink,
          fontFamily: 'serif',
          fontSize: 24,
          marginTop: 8,
        }}
      >
        {event.title}
      </Text>
      <Text style={{ color: c.muted, marginTop: 7 }}>
        {data.categories[event.category_id ?? ''] ?? 'Momento especial'}
      </Text>
      {!!event.description && (
        <Text
          numberOfLines={2}
          style={{ color: c.muted, marginTop: 10, lineHeight: 20 }}
        >
          {event.description}
        </Text>
      )}
      <Mosaic photos={photos} />
      <Text style={{ color: c.accent, fontWeight: '800', marginTop: 16 }}>
        Ver história →
      </Text>
    </Pressable>
  )
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
})

export { usePalette }
