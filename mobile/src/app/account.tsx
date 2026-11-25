import { useState } from 'react'
import { LocalField } from '@/components/LocalField'
import { Alert, Text } from 'react-native'
import { router } from 'expo-router'
import { Screen, Button, usePalette } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { useApp } from '@/lib/app-context'
import { confirmDemoAction } from '@/lib/demo-actions'
export default function Account() {
  const {
    user,
    demo,
    demoActions,
    busy,
    logout,
    refresh,
    active,
    examples,
    identity,
  } = useApp()
  const [familyName, setFamilyName] = useState(active?.name ?? '')
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
      'As alterações na família de exemplos serão substituídas pelos exemplos originais.',
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
        {demo
          ? examples
            ? 'Família de exemplos fictícios'
            : (identity?.name ?? 'Perfil local')
          : user?.email}
      </Text>
      {demoActions && active && (
        <>
          <Text style={{ color: c.muted }}>
            Membro local ·{' '}
            {examples ? 'Administrador dos exemplos' : identity?.name} ·
            administrador
            {!examples && identity?.email ? ' · ' + identity.email : ''}
          </Text>
          <Text style={{ color: c.muted }}>
            Os perfis de apresentação abaixo atuam somente neste aparelho.
            Convites por e-mail estão disponíveis na web.
          </Text>
          {(
            [
              ['admin', 'Administrador'],
              ['contributor', 'Colaborador de apresentação'],
              ['viewer', 'Leitor de apresentação'],
            ] as const
          ).map(([role, label]) => (
            <Button
              key={role}
              disabled={busy || active.role === role}
              outline
              title={label}
              onPress={() =>
                void demoActions
                  .setRole(role)
                  .catch((e) =>
                    Alert.alert('Falha ao trocar perfil', e.message),
                  )
              }
            />
          ))}
          {active.role === 'admin' && (
            <>
              <LocalField
                label="Nome da família"
                value={familyName}
                onChangeText={setFamilyName}
                maxLength={120}
              />
              <Button
                outline
                title="Salvar nome da família"
                disabled={busy}
                onPress={() =>
                  void demoActions
                    .rename(familyName)
                    .then(() => Alert.alert('Nome atualizado'))
                    .catch((e) => Alert.alert('Falha ao salvar', e.message))
                }
              />
            </>
          )}
        </>
      )}
      {demoActions && examples && active?.role === 'admin' && (
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
        title={demo ? 'Sair do modo local' : 'Sair'}
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
