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
import { actorId, type Identity } from './local-repository'
import { useDemoData } from './demo-storage'
import { loadSpaces, loadData, signPhotos } from './data'
import type { Data, Space, Photo } from './model'
const empty: Data = {
  events: [],
  people: [],
  photos: [],
  categories: {},
  participants: {},
}
type State = {
  demo: boolean
  demoActions: ReturnType<typeof useDemoData>['actions']
  user: User | null
  spaces: Space[]
  active: Space | null
  data: Data
  busy: boolean
  error: string | null
  enterDemo: (examples: boolean) => Promise<void>
  actor: string | undefined
  identity: Identity | null
  trash: Photo[]
  examples: boolean
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
    [signing, setSigning] = useState(!!supabase)
  const authRevision = useRef(0)
  const authAction = useRef(false)
  const localDemo = useDemoData(demo)
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
      .finally(() => {
        if (mounted && !authAction.current) setSigning(false)
      })
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
    if (authAction.current) return
    authAction.current = true
    const revision = ++authRevision.current
    setSigning(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error)
        throw Error(
          error.status === 400
            ? 'E-mail ou senha inválidos.'
            : 'Servidor indisponível. Confira a conexão.',
        )
      const { data, error: verificationError } = await supabase.auth.getUser()
      if (verificationError || !data.user) {
        await supabase.auth.signOut({ scope: 'local' })
        throw Error(
          'Não foi possível confirmar sua conta. Confira a conexão e tente novamente.',
        )
      }
      if (revision === authRevision.current) {
        setDemo(false)
        setUser(data.user)
      } else {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } finally {
      authAction.current = false
      setSigning(false)
    }
  }
  async function logout() {
    if (demo) localDemo.leave()
    if (authAction.current) return
    authAction.current = true
    authRevision.current++
    setSigning(true)
    try {
      if (!demo && user && supabase) {
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } finally {
          await AsyncStorage.removeItem(authStorageKey)
        }
      }
    } finally {
      setUser(null)
      setDemo(false)
      authAction.current = false
      setSigning(false)
    }
  }
  async function enterDemo(examples: boolean) {
    authRevision.current++
    await localDemo.open(examples)
    setDemo(true)
  }
  return (
    <SpaceProvider
      key={demo ? 'demo' : (user?.id ?? 'guest')}
      user={demo ? null : user}
      {...{ demo, localDemo, login, logout, enterDemo, signing }}
    >
      {children}
    </SpaceProvider>
  )
}
function SpaceProvider({
  user,
  demo,
  localDemo,
  login,
  logout,
  enterDemo,
  signing,
  children,
}: Pick<State, 'user' | 'demo' | 'login' | 'logout' | 'enterDemo'> & {
  children: ReactNode
  signing: boolean
  localDemo: ReturnType<typeof useDemoData>
}) {
  const [spaces, setSpaces] = useState<Space[]>([]),
    [active, setActive] = useState<Space | null>(null)
  const [loadedSpace, setLoadedSpace] = useState<{
    id: string
    data: Data
  } | null>(null)
  const [busy, setBusy] = useState(!!user),
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
    const spaceId = active.id
    let live = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let round = 0
    async function read() {
      const ticket = ++round
      clearTimeout(timer)
      try {
        const loaded = await loadData(spaceId)
        const photos = await signPhotos(loaded.photos)
        if (live && ticket === round) {
          setLoadedSpace({ id: spaceId, data: { ...loaded, photos } })
          setError(null)
        }
      } catch {
        if (live && ticket === round) {
          setLoadedSpace(null)
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
      setLoadedSpace(null)
      setBusy(true)
      setActive(found)
    }
  }
  const spaceData = loadedSpace?.id === active?.id ? loadedSpace?.data : null
  return (
    <Context.Provider
      value={{
        user,
        demo,
        demoActions: localDemo.actions,
        data: (demo ? localDemo.data : spaceData) ?? empty,
        active: demo ? localDemo.active : active,
        spaces: demo ? localDemo.spaces : spaces,
        actor: demo ? actorId(localDemo.selection.role) : user?.id,
        identity: demo ? localDemo.identity : null,
        examples: demo && localDemo.selection.examples,
        trash: demo ? localDemo.trash : [],
        busy: demo ? localDemo.busy : busy || signing,
        error: demo ? localDemo.error : error,
        login,
        logout,
        enterDemo,
        selectSpace: demo
          ? async (s) => {
              await localDemo.actions?.select(s.id)
            }
          : selectSpace,
        refresh: demo ? localDemo.load : refresh,
      }}
    >
      {children}
    </Context.Provider>
  )
}
