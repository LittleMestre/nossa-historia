import { useCallback, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Directory, File, Paths } from 'expo-file-system'
import type { ImagePickerAsset } from 'expo-image-picker'
import { demoData, demoSpace } from './demo'
import {
  sortEvents,
  type Data,
  type Event,
  type Person,
  type Photo,
} from './model'
import { parseDemoDate } from './demo-date'

const storageKey = 'nossa-historia-demo-v1'
const demoAuthor = 'demo-author'
type StoredPhoto = Omit<Photo, 'asset' | 'url'>
type Records = Pick<Data, 'events' | 'people'> & { photos: StoredPhoto[] }
const original: Records = {
  events: demoData.events,
  people: demoData.people,
  photos: demoData.photos.map(
    ({ id, event_id, description, storage_path }) => ({
      id,
      event_id,
      description,
      storage_path,
    }),
  ),
}
const bundledPhotos = new Map(
  demoData.photos.map((photo) => [photo.id, photo.asset]),
)
const localFileName = /^photo-[a-z0-9-]+\.[a-z0-9]{2,8}$/
const photosDirectory = () =>
  new Directory(Paths.document, 'nossa-historia-demo-photos')
const makeId = (kind: string) =>
  `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

function materialize(records: Records): Data {
  const peopleById = new Map(
    records.people.map((person) => [person.id, person]),
  )
  const participants: Data['participants'] = {}
  for (const event of records.events) {
    const links = demoData.participants[event.id]
    if (links)
      participants[event.id] = links.flatMap(
        ({ id }) => peopleById.get(id) ?? [],
      )
  }
  return {
    ...records,
    events: sortEvents(records.events),
    categories: demoData.categories,
    participants,
    photos: records.photos.map((photo) =>
      localFileName.test(photo.storage_path)
        ? { ...photo, url: new File(photosDirectory(), photo.storage_path).uri }
        : { ...photo, asset: bundledPhotos.get(photo.id) },
    ),
  }
}

// A failed save or an interruption between copying a file and saving its record
// can leave an orphan. Only files owned by this demo are eligible for cleanup.
function removeUnusedPhotos(records: Records) {
  try {
    const directory = photosDirectory()
    if (!directory.exists) return
    const used = new Set(records.photos.map((photo) => photo.storage_path))
    for (const file of directory.list()) {
      if (
        file instanceof File &&
        localFileName.test(file.name) &&
        !used.has(file.name)
      ) {
        file.delete()
      }
    }
  } catch {
    // Retry cleanup the next time the demo is loaded or saved.
  }
}

type EventInput = { title: string; description: string; date: string }
type PersonInput = { name: string; description: string }
type Update = (records: Records) => Records | Promise<Records>

export function useDemoData(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<Records | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const current = useRef<Records | null>(null)
  const pending = useRef(false)

  const load = useCallback(async () => {
    if (current.current || pending.current) return
    pending.current = true
    try {
      const raw = await AsyncStorage.getItem(storageKey)
      const records = raw === null ? original : (JSON.parse(raw) as Records)
      if (
        !Array.isArray(records?.events) ||
        !Array.isArray(records.people) ||
        !Array.isArray(records.photos)
      ) {
        throw Error('Dados locais inválidos.')
      }
      current.current = records
      setSnapshot(records)
      setError(null)
      removeUnusedPhotos(records)
    } catch {
      setError(
        'Não foi possível ler a demonstração. Tente novamente ou restaure os dados pela tela Sua conta.',
      )
    } finally {
      pending.current = false
    }
  }, [])

  async function commit(update: Update, restore = false) {
    if (!enabled || pending.current)
      throw Error('Aguarde a operação local terminar.')
    const before = current.current
    if (!before && !restore)
      throw Error('Os dados da demonstração ainda não estão disponíveis.')
    pending.current = true
    setSaving(true)
    try {
      const next = await update(before ?? original)
      await AsyncStorage.setItem(storageKey, JSON.stringify(next))
      current.current = next
      setSnapshot(next)
      setError(null)
    } catch {
      throw Error('Não foi possível salvar neste aparelho. Tente novamente.')
    } finally {
      if (current.current) removeUnusedPhotos(current.current)
      setSaving(false)
      pending.current = false
    }
  }

  async function saveEvent(id: string | undefined, input: EventInput) {
    const title = input.title.trim()
    if (!title) throw Error('Informe o título do acontecimento.')
    const dates = parseDemoDate(input.date)
    const eventId = id ?? makeId('event')
    await commit((records) => {
      const existing = records.events.find((event) => event.id === id)
      if (id && !existing) throw Error('Acontecimento indisponível.')
      const event: Event = {
        id: eventId,
        space_id: demoSpace.id,
        created_by: demoAuthor,
        moment_type: 'family',
        category_id: null,
        approximate_date_label: null,
        created_at: new Date().toISOString(),
        ...existing,
        ...dates,
        title,
        description: input.description.trim() || null,
      }
      return {
        ...records,
        events: [
          ...records.events.filter((item) => item.id !== eventId),
          event,
        ],
      }
    })
    return eventId
  }

  async function savePerson(id: string | undefined, input: PersonInput) {
    const name = input.name.trim()
    if (!name) throw Error('Informe o nome da pessoa.')
    const personId = id ?? makeId('person')
    await commit((records) => {
      const existing = records.people.find((person) => person.id === id)
      if (id && !existing) throw Error('Pessoa indisponível.')
      const person: Person = {
        id: personId,
        created_by: demoAuthor,
        ...existing,
        name,
        description: input.description.trim() || null,
      }
      return {
        ...records,
        people: [
          ...records.people.filter((item) => item.id !== personId),
          person,
        ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      }
    })
    return personId
  }

  function deleteEvent(id: string) {
    return commit((records) => ({
      ...records,
      events: records.events.filter((event) => event.id !== id),
      photos: records.photos.filter((photo) => photo.event_id !== id),
    }))
  }

  function addPhotos(eventId: string, assets: ImagePickerAsset[]) {
    return commit(async (records) => {
      if (!records.events.some((event) => event.id === eventId))
        throw Error('Acontecimento indisponível.')
      const directory = photosDirectory()
      directory.create({ idempotent: true, intermediates: true })
      const photos: StoredPhoto[] = []
      for (const asset of assets) {
        const source = new File(asset.uri)
        const extension = source.extension.toLowerCase()
        const id = makeId('photo')
        const storage_path =
          id + (/^\.[a-z0-9]{2,8}$/.test(extension) ? extension : '.jpg')
        await source.copy(new File(directory, storage_path))
        photos.push({ id, event_id: eventId, description: null, storage_path })
      }
      return { ...records, photos: [...photos, ...records.photos] }
    })
  }

  function deletePhoto(id: string) {
    return commit((records) => ({
      ...records,
      photos: records.photos.filter((photo) => photo.id !== id),
    }))
  }

  const data = useMemo(() => snapshot && materialize(snapshot), [snapshot])
  return {
    data,
    error,
    busy: saving || (!snapshot && !error),
    load,
    actions: enabled
      ? {
          saveEvent,
          savePerson,
          deleteEvent,
          addPhotos,
          deletePhoto,
          restore: () => commit(() => original, true),
        }
      : null,
  }
}
