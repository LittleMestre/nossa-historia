import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { usePalette } from '@/components/ui'
const tabs = [
  ['spiral', 'Início', 'planet-outline'],
  ['timeline', 'Linha do tempo', 'time-outline'],
  ['gallery', 'Galeria', 'images-outline'],
  ['events', 'Eventos', 'calendar-outline'],
  ['people', 'Pessoas', 'people-outline'],
] as const
export const unstable_settings = { initialRouteName: 'spiral' }
export default function Layout() {
  const c = usePalette()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: 10 },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
      }}
    >
      {tabs.map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={icon}
                size={23}
                color={focused ? c.accent : c.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
