import { useState } from 'react'
import { LocalField } from '@/components/LocalField'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button, Empty, Screen, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'

export default function Spaces() {
  const {
    demo,
    user,
    spaces,
    active,
    busy,
    selectSpace,
    refresh,
    error,
    demoActions,
    identity,
    examples,
  } = useApp()
  const c = usePalette()
  const [name, setName] = useState('')
  const [display, setDisplay] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  async function create() {
    if (!demoActions) return
    try {
      await demoActions.create(name, identity ?? { name: display, email })
      setName('')
      router.replace('/spiral')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Falha ao criar família.')
    }
  }
  if (!demo && !user) return <Redirect href="/login" />
  return (
    <Screen title="Espaços familiares" eyebrow="ESCOLHA SUA FAMÍLIA">
      <Text style={{ color: c.muted, marginBottom: 18, lineHeight: 21 }}>
        Selecione o espaço cujas memórias deseja ver.
      </Text>
      {busy && <ActivityIndicator color={c.accent} />}
      {!busy && !spaces.length && (
        <Empty
          icon="people-outline"
          title="Nenhum espaço por aqui"
          detail={
            demo
              ? 'Crie a primeira família neste aparelho.'
              : 'Entre em uma conta vinculada a um espaço familiar ou aceite um convite pela web.'
          }
        />
      )}
      {spaces.map((space) => (
        <Pressable
          key={space.id}
          onPress={() => {
            void selectSpace(space)
              .then(() => router.replace('/spiral'))
              .catch((e) => setMessage(e.message))
          }}
          style={{
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: active?.id === space.id ? c.accent : c.border,
            padding: 19,
            borderRadius: 18,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: c.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="people" size={22} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontFamily: 'serif', fontSize: 20 }}>
              {space.name}
            </Text>
            <Text style={{ color: c.muted, marginTop: 3 }}>
              {space.role === 'admin'
                ? 'Administrador'
                : space.role === 'contributor'
                  ? 'Colaborador'
                  : 'Leitor'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.muted} />
        </Pressable>
      ))}
      {demoActions && !examples && (!active || active.role === 'admin') && (
        <>
          {!identity && (
            <>
              <LocalField
                label="Seu nome de exibição"
                value={display}
                onChangeText={setDisplay}
                maxLength={160}
              />
              <LocalField
                label="E-mail local (opcional)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}
          <LocalField
            label="Nome da nova família"
            value={name}
            onChangeText={setName}
            maxLength={120}
          />
          <Button
            title="Criar família vazia"
            disabled={busy}
            onPress={() => void create()}
          />
        </>
      )}
      {!!message && <Text style={{ color: c.ink }}>{message}</Text>}
      {!demo && active?.role === 'admin' && (
        <Text style={{ color: c.muted }}>
          Membros e convites · gerenciamento disponível na versão web.
        </Text>
      )}
      {active && (
        <Button
          title="Voltar às histórias"
          onPress={() => router.replace('/spiral')}
          outline
        />
      )}
      {!!error && (
        <Button
          title="Tentar novamente"
          onPress={() => void refresh()}
          outline
        />
      )}
    </Screen>
  )
}
