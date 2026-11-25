import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Redirect, router } from 'expo-router'
import { Button, Screen, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'

export default function Login() {
  const { user, demo, login, busy } = useApp()
  const c = usePalette()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  if (demo || user) return <Redirect href="/" />
  async function submit() {
    setError('')
    try {
      await login(email, password)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível entrar.',
      )
    }
  }
  return (
    <Screen
      title="Suas histórias, sempre por perto"
      eyebrow="BEM-VINDO DE VOLTA"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text
          style={{
            color: c.muted,
            fontSize: 16,
            lineHeight: 23,
            marginBottom: 28,
          }}
        >
          Entre com a conta já criada no Nossa História.
        </Text>
        <View
          style={{
            backgroundColor: c.card,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text style={{ color: c.ink, fontWeight: '700', marginBottom: 7 }}>
            E-mail
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            placeholderTextColor={c.muted}
            style={{
              color: c.ink,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              padding: 13,
              marginBottom: 18,
            }}
          />
          <Text style={{ color: c.ink, fontWeight: '700', marginBottom: 7 }}>
            Senha
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="Sua senha"
            placeholderTextColor={c.muted}
            style={{
              color: c.ink,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              padding: 13,
            }}
          />
          {!!error && (
            <Text style={{ color: c.ink, marginTop: 12 }}>{error}</Text>
          )}
          {busy ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={c.accent} />
          ) : (
            <Button
              title="Entrar"
              onPress={() => void submit()}
              icon="arrow-forward"
            />
          )}
        </View>
        <Button
          title="Voltar à entrada"
          outline
          onPress={() => router.replace('/')}
        />
      </KeyboardAvoidingView>
    </Screen>
  )
}
