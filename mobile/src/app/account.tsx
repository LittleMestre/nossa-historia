import { Alert, Text } from 'react-native'
import { router } from 'expo-router'
import { Screen, Button, usePalette } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { useApp } from '@/lib/app-context'
import { confirmDemoAction } from '@/lib/demo-actions'
export default function Account() {
  const { user, demo, demoActions, busy, logout, refresh, active } = useApp()
  const c = usePalette()
  const { theme, choose } = useTheme()
  async function leave(login: boolean) {
    await logout()
    router.replace(login ? '/login' : '/')
  }
  function restoreDemo() {
    if (!demoActions) return
    confirmDemoAction(
      'Restaurar demonstração?',
      'Os dados originais voltarão e suas alterações e fotos adicionadas serão removidas deste aparelho.',
      'Restaurar',
      async () => {
        await demoActions.restore()
        Alert.alert('Demonstração restaurada')
      },
    )
  }
  return (
    <Screen title="Sua conta">
      <Text style={{ color: c.ink, fontSize: 18 }}>
        {demo ? 'Visitante da demonstração' : user?.email}
      </Text>
      {demo && (
        <Text style={{ color: c.muted }}>Papel simulado de administrador</Text>
      )}
      {demoActions && (
        <Button
          title="Restaurar demonstração"
          outline
          disabled={busy}
          onPress={restoreDemo}
        />
      )}
      <Button
        outline
        title="Espaços familiares"
        onPress={() => router.push('/spaces')}
      />
      {!demo && (
        <Button
          outline
          title="Atualizar dados"
          onPress={() => void refresh()}
        />
      )}
      <Text style={{ color: c.ink, fontSize: 21, marginTop: 24 }}>
        Aparência
      </Text>
      {(
        [
          ['system', 'Usar tema do aparelho'],
          ['light', 'Claro'],
          ['dark', 'Escuro'],
        ] as const
      ).map(([value, title]) => (
        <Button
          key={value}
          outline={theme !== value}
          title={title}
          onPress={() => choose(value)}
        />
      ))}
      <Button
        title={demo ? 'Entrar na minha conta' : 'Trocar conta'}
        onPress={() => void leave(true)}
      />
      <Button
        outline
        title={demo ? 'Sair da demonstração' : 'Sair'}
        onPress={() => void leave(false)}
      />
      <Button
        outline
        title="Voltar"
        onPress={() => router.replace(active ? '/spiral' : '/spaces')}
      />
    </Screen>
  )
}
