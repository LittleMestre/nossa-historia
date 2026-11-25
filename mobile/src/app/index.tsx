import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, Text } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
export default function Welcome() {
  const { enterDemo, user, demo, active } = useApp()
  const [opening, setOpening] = useState(false)
  const c = usePalette()
  if (demo || user) return <Redirect href={active ? '/spiral' : '/spaces'} />
  function enter(examples: boolean) {
    setOpening(true)
    void enterDemo(examples)
      .catch((e) =>
        Alert.alert('Falha ao abrir armazenamento local', e.message),
      )
      .finally(() => setOpening(false))
  }
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
        title={
          opening
            ? 'Abrindo armazenamento local…'
            : 'Nova história · famílias neste aparelho'
        }
        disabled={opening}
        onPress={() => enter(false)}
      />
      <Button
        outline
        title="Entrar com Supabase"
        disabled={opening}
        onPress={() => router.push('/login')}
      />
      <Button
        outline
        title="Explorar exemplos fictícios"
        disabled={opening}
        onPress={() => {
          enter(true)
        }}
      />
    </Screen>
  )
}
