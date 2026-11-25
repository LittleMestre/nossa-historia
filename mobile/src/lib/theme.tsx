import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
export type Theme = 'system' | 'light' | 'dark'
const Context = createContext({
  dark: false,
  theme: 'system' as Theme,
  choose: (_value: Theme) => {},
})
export const useTheme = () => useContext(Context)
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const system = useColorScheme()
  useEffect(() => {
    void AsyncStorage.getItem('nh-theme')
      .then((v) => {
        if (v === 'dark' || v === 'light') setTheme(v)
      })
      .catch(() => {})
  }, [])
  function choose(v: Theme) {
    setTheme(v)
    void AsyncStorage.setItem('nh-theme', v).catch(() => {})
  }
  return (
    <Context.Provider
      value={{
        theme,
        choose,
        dark: theme === 'dark' || (theme === 'system' && system === 'dark'),
      }}
    >
      {children}
    </Context.Provider>
  )
}
