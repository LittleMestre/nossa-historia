import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AppProvider, useApp } from '@/lib/app-context'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { usePalette } from '@/components/ui'
function Routes() {
  const { user, demo, active } = useApp()
  const { dark } = useTheme()
  const c = usePalette()
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={!demo && !user}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={!!active}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="photo/[id]" />
          <Stack.Screen name="person/[id]" />
          <Stack.Screen name="editor" />
        </Stack.Protected>
        <Stack.Protected guard={demo || !!user}>
          <Stack.Screen name="spaces" />
          <Stack.Screen name="account" />
        </Stack.Protected>
      </Stack>
    </>
  )
}
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppProvider>
          <Routes />
        </AppProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
