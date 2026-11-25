import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { User } from '@supabase/supabase-js'
import { supabase, authStorageKey } from './supabase'
import { demoData, demoSpace } from './demo'
import { loadSpaces, loadData, signPhotos } from './data'
import type { Data, Space } from './model'
const empty: Data = {
  events: [],
  people: [],
  photos: [],
  categories: {},
  participants: {},
}
type State = {
  demo: boolean
  user: User | null
  spaces: Space[]
  active: Space | null
  data: Data
  busy: boolean
  error: string | null
  enterDemo: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  selectSpace: (s: Space) => Promise<void>
  refresh: () => Promise<void>
}
const Context = createContext<State | null>(null)
export function useApp() {
  const ctx = useContext(Context)
  if (!ctx) throw Error('Contexto ausente')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [demo, setDemo] = useState(false),
    [signing, setSigning] = useState(false)
  const authRevision = useRef(0)
  useEffect(() => {
    if (!supabase) return
    let mounted = true
    const revision = authRevision.current
    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (mounted && !error && revision === authRevision.current)
          setUser(data.user)
      })
      .catch(() => {})
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        authRevision.current++
        setUser(null)
      }
    })
    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])
  async function login(email: string, password: string) {
    if (!supabase)
      throw Error(
        'O servidor de acesso não está configurado neste aparelho. Você pode explorar a demonstração.',
      )
    const revision = ++authRevision.current
    setSigning(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error)
        throw Error(
          error.status === 400
            ? 'E-mail ou senha inválidos.'
            : 'Servidor indisponível. Confira a conexão.',
        )
      if (revision === authRevision.current) setUser(data.user)
    } finally {
      setSigning(false)
    }
  }
  async function logout() {
    authRevision.current++
    if (user && supabase) {
      // Keep the account visible until local session cleanup succeeds.
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } finally {
        await AsyncStorage.removeItem(authStorageKey)
        setUser(null)
      }
    }
    setDemo(false)
  }
  function enterDemo() {
    authRevision.current++
    setDemo(true)
  }
  return (
    <SpaceProvider
      key={user?.id ?? (demo ? 'demo' : 'guest')}
      {...{ user, demo, login, logout, enterDemo, signing }}
    >
      {children}
    </SpaceProvider>
  )
}
function SpaceProvider({
  user,
  demo,
  login,
  logout,
  enterDemo,
  signing,
  children,
}: Pick<State, 'user' | 'demo' | 'login' | 'logout' | 'enterDemo'> & {
  children: ReactNode
  signing: boolean
}) {
  const [spaces, setSpaces] = useState<Space[]>(demo ? [demoSpace] : []),
    [active, setActive] = useState<Space | null>(demo ? demoSpace : null)
  const [data, setData] = useState<Data>(demo ? demoData : empty),
    [busy, setBusy] = useState(!!user),
    [error, setError] = useState<string | null>(null),
    [revision, reload] = useState(0)
  useEffect(() => {
    if (!user) return
    let live = true
    loadSpaces(user.id)
      .then((rows) => {
        if (live) {
          setSpaces(rows)
          setActive(
            (current) =>
              rows.find((s) => s.id === current?.id) ??
              (rows.length === 1 ? rows[0] : null),
          )
        }
      })
      .catch(() => {
        if (live) setError('Não foi possível carregar seus espaços.')
      })
      .finally(() => {
        if (live) setBusy(false)
      })
    return () => {
      live = false
    }
  }, [user, revision])
  useEffect(() => {
    if (!active || !user) return
    let live = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let round = 0
    async function read() {
      const ticket = ++round
      clearTimeout(timer)
      try {
        const loaded = await loadData(active!.id)
        const photos = await signPhotos(loaded.photos)
        if (live && ticket === round) {
          setData({ ...loaded, photos })
          setError(null)
        }
      } catch {
        if (live && ticket === round) {
          setData(empty)
          setError(
            'O espaço não pôde ser carregado. Confira a conexão e atualize.',
          )
        }
      } finally {
        if (live && ticket === round) {
          setBusy(false)
          timer = setTimeout(() => {
            if (AppState.currentState === 'active') void read()
          }, 45000)
        }
      }
    }
    void read()
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void read()
    })
    return () => {
      live = false
      clearTimeout(timer)
      sub.remove()
    }
  }, [active, user, revision])
  const refresh = useCallback(async () => reload((n) => n + 1), [])
  async function selectSpace(s: Space) {
    const found = spaces.find((row) => row.id === s.id)
    if (found && active?.id !== found.id) {
      setData(empty)
      setBusy(true)
      setActive(found)
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        demo,
        data,
        active,
        spaces,
        busy: busy || signing,
        error,
        login,
        logout,
        enterDemo,
        selectSpace,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  )
}
