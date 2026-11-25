import { Redirect, router } from 'expo-router'
import { Image, Text } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
export default function Welcome() {
  const { enterDemo, user, demo, active } = useApp()
  const c = usePalette()
  if (demo || user) return <Redirect href={active ? '/spiral' : '/spaces'} />
  return (
    <Screen title="Nossa História" eyebrow="ÁLBUM DE FAMÍLIA">
      <Image
        source={require('../../assets/demo/2026-lake-reunion.jpg')}
        style={{
          width: '100%',
          aspectRatio: 1.55,
          borderRadius: 18,
          marginVertical: 16,
        }}
        accessibilityLabel="Ilustração de um encontro junto ao lago"
      />
      <Text
        style={{
          color: c.muted,
          fontSize: 17,
          lineHeight: 25,
          marginBottom: 14,
        }}
      >
        Revisite os encontros, as pessoas e as fotografias da sua família.
      </Text>
      <Button
        title="Entrar na minha conta"
        onPress={() => router.push('/login')}
      />
      <Button
        outline
        title="Explorar demonstração"
        onPress={() => {
          enterDemo()
        }}
      />
    </Screen>
  )
}
