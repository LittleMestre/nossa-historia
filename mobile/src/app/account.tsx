import { Text } from 'react-native'
import { router } from 'expo-router'
import { Screen, Button, usePalette } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { useApp } from '@/lib/app-context'
export default function Account() {
  const { user, demo, logout, refresh, active } = useApp()
  const c = usePalette()
  const { theme, choose } = useTheme()
  async function leave(login: boolean) {
    await logout()
    router.replace(login ? '/login' : '/')
  }
  return (
    <Screen title="Sua conta">
      <Text style={{ color: c.ink, fontSize: 18 }}>
        {demo ? 'Visitante da demonstração' : user?.email}
      </Text>
      {demo && (
        <Text style={{ color: c.muted }}>Papel simulado de administrador</Text>
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
