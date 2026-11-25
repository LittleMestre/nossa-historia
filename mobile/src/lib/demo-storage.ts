import { useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'
import type { ImagePickerAsset } from 'expo-image-picker'
import { demoData, demoSpace } from './demo'
import type { Data, Event, Person, Photo, Role } from './model'
import {
  albumWriter,
  createFamily,
  familyList,
  field,
  initialize,
  readAlbum,
  type Identity,
  type EventInput,
  type PersonInput,
} from './local-repository'
import {
  cleanPhotoFiles,
  copyPhotos,
  resolvePhoto,
  verifyStoredPhoto,
} from './local-photos'

type Legacy = { events: Event[]; people: Person[]; photos: Photo[] }
function seed(db: SQLiteDatabase, records: Legacy) {
  if (![records?.events, records?.people, records?.photos].every(Array.isArray))
    throw Error('Não foi possível ler os exemplos salvos na versão anterior.')
  db.runSync('INSERT INTO families VALUES (?,?)', demoSpace.id, demoSpace.name)
  for (const [id, name] of Object.entries(demoData.categories))
    db.runSync('INSERT INTO categories VALUES (?,?,?)', 'demo', id, name)
  for (const e of records.events)
    db.runSync(
      'INSERT INTO events(space,id,body) VALUES (?,?,?)',
      'demo',
      e.id,
      JSON.stringify(e),
    )
  for (const p of records.people)
    db.runSync(
      'INSERT INTO people VALUES (?,?,?)',
      'demo',
      p.id,
      JSON.stringify({ ...p, created_by: p.created_by ?? 'demo-author' }),
    )
  for (const p of [...records.photos].reverse()) {
    const { id, event_id, description, storage_path } = p
    db.runSync(
      'INSERT INTO photos(space,event,id,body) VALUES (?,?,?,?)',
      'demo',
      event_id,
      id,
      JSON.stringify({
        id,
        event_id,
        description,
        storage_path,
        created_by: 'demo-author',
      }),
    )
  }
  for (const e of records.events)
    for (const p of demoData.participants[e.id] ?? []) {
      if (records.people.some((person) => person.id === p.id))
        db.runSync(
          'INSERT INTO participants VALUES (?,?,?)',
          'demo',
          e.id,
          p.id,
        )
    }
}
type Selection = { space: string | null; role: Role; examples: boolean }
const initial: Selection = { space: null, role: 'admin', examples: false }
export function useDemoData(enabled: boolean) {
  const database = useRef<SQLiteDatabase | null>(null)
  const selection = useRef(initial)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<{
    selection: Selection
    spaces: ReturnType<typeof familyList>
    identity: Identity | null
    data: Data | null
    trash: Photo[]
  }>({
    selection: initial,
    spaces: [],
    identity: null,
    data: null,
    trash: [],
  })
  function db() {
    if (!database.current) {
      const connection = openDatabaseSync('nossa-historia-v1.db')
      initialize(connection)
      database.current = connection
    }
    return database.current
  }
  function cleanup() {
    cleanPhotoFiles(
      new Set(
        db()
          .getAllSync<{ path: string }>(
            "SELECT json_extract(body,'$.storage_path') AS path FROM photos",
          )
          .map((r) => r.path),
      ),
    )
  }
  function publish(next: Selection) {
    const all = familyList(db())
    const album = next.space ? readAlbum(db(), next.space) : null
    selection.current = next
    setView({
      selection: next,
      spaces: all.filter((s) => (s.id === 'demo') === next.examples),
      identity: db().getFirstSync<Identity>('SELECT name,email FROM profile'),
      data: album
        ? { ...album.data, photos: album.data.photos.map(resolvePhoto) }
        : null,
      trash: album?.trash ?? [],
    })
    setError(null)
  }
  async function exclusive<T>(operation: () => T | Promise<T>) {
    if (pending.current) throw Error('Aguarde a operação local terminar.')
    pending.current = true
    setBusy(true)
    try {
      return await operation()
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function open(examples: boolean) {
    await exclusive(async () => {
      if (examples && !familyList(db()).some((s) => s.id === 'demo')) {
        const old = await AsyncStorage.getItem('nossa-historia-demo-v1')
        db().withTransactionSync(() =>
          seed(db(), old ? JSON.parse(old) : demoData),
        )
      }
      cleanup()
      publish({ ...initial, examples, space: examples ? 'demo' : null })
    })
  }
  const scope = view.selection
  async function write<T>(
    change: (connection: SQLiteDatabase) => T,
    next?: (result: T) => Selection,
  ) {
    return exclusive(() => {
      if (!enabled || scope !== selection.current)
        throw Error('Abra novamente a família.')
      const connection = db()
      let result!: T
      connection.withTransactionSync(() => {
        result = change(connection)
      })
      publish(next?.(result) ?? scope)
      return result
    })
  }
  const space = scope.space ?? ''
  const writer = () => albumWriter(db(), space, scope.role)
  async function withPhotos(
    id: string | undefined,
    input: EventInput | null,
    assets: ImagePickerAsset[],
  ) {
    return exclusive(async () => {
      if (
        !enabled ||
        !space ||
        scope !== selection.current ||
        scope.role === 'viewer'
      )
        throw Error('Operação indisponível.')
      try {
        const imported = await copyPhotos(assets, id ?? '')
        if (scope !== selection.current) throw Error('A família ativa mudou.')
        let eventId = id
        db().withTransactionSync(() => {
          if (input) eventId = writer().saveEvent(id, input)
          if (!eventId) throw Error('Acontecimento indisponível.')
          for (const p of imported) writer().addPhoto(eventId, p)
        })
        publish(scope)
        return eventId!
      } catch (cause) {
        cleanup()
        throw cause
      }
    })
  }
  const actions = {
    create: (name: string, identity: Identity) =>
      write(
        (connection) => {
          if (scope.role !== 'admin')
            throw Error('Entre como administrador para criar uma família.')
          if (scope.examples) throw Error('Abra suas famílias locais.')
          const display = field(identity.name, 160, 'seu nome', true)
          const email = field(identity.email, 254, 'E-mail')
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            throw Error('Confira o e-mail.')
          connection.runSync(
            'INSERT INTO profile VALUES (1,?,?) ON CONFLICT(id) DO NOTHING',
            display,
            email,
          )
          return createFamily(connection, name)
        },
        (space) => ({ ...initial, space }),
      ),
    rename: (name: string) =>
      write((connection) => {
        if (!space || scope.role !== 'admin')
          throw Error('Apenas o administrador pode alterar o nome.')
        connection.runSync(
          'UPDATE families SET name=? WHERE id=?',
          field(name, 120, 'o nome da família', true),
          space,
        )
      }),
    select: (id: string) =>
      write(
        () => {
          if (!view.spaces.some((s) => s.id === id))
            throw Error('Família indisponível.')
        },
        () => ({ ...scope, space: id }),
      ),
    setRole: (role: Role) =>
      write(
        () => {},
        () => ({ ...scope, role }),
      ),
    savePerson: (id: string | undefined, input: PersonInput) =>
      write(() => writer().savePerson(id, input)),
    saveEvent: (
      id: string | undefined,
      input: EventInput,
      assets: ImagePickerAsset[] = [],
    ) => withPhotos(id, input, assets),
    addPhotos: (id: string, assets: ImagePickerAsset[]) =>
      withPhotos(id, null, assets),
    deleteEvent: (id: string) => write(() => writer().deleteEvent(id)),
    deletePhoto: (id: string) => write(() => writer().editPhoto(id)),
    editPhoto: (id: string, description: string) =>
      write(() => writer().editPhoto(id, description)),
    restorePhoto: (id: string) =>
      write(() => {
        const photo = view.trash.find((p) => p.id === id)
        if (!photo) throw Error('Foto indisponível na lixeira.')
        verifyStoredPhoto(photo)
        writer().restorePhoto(id)
      }),
    restore: async () => {
      await write((connection) => {
        if (space !== 'demo' || scope.role !== 'admin')
          throw Error('Abra a família de exemplos como administrador.')
        connection.runSync("DELETE FROM families WHERE id='demo'")
        seed(connection, demoData)
      })
      cleanup()
    },
  }
  const spaces = view.spaces.map((s) => ({
    ...s,
    role: scope.role,
  }))
  return {
    ...view,
    spaces,
    active: spaces.find((s) => s.id === space) ?? null,
    open,
    leave: () => {
      selection.current = { ...initial }
    },
    busy,
    error,
    load: async () => {
      try {
        publish(selection.current)
      } catch {
        setError('Falha ao carregar os dados locais.')
      }
    },
    actions: enabled ? actions : null,
  }
}
