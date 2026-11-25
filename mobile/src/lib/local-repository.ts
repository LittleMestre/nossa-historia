import type { SQLiteDatabase } from 'expo-sqlite'
import type { Data, Event, Person, Photo, Role } from './model'
import { sortEvents } from './model'
import { parseDemoDate } from './demo-date'

export const localId = (prefix: string) =>
  prefix +
  '-' +
  Date.now().toString(36) +
  '-' +
  Math.random().toString(36).slice(2)
export const actorId = (role: Role) => 'local-' + role
export function canChange(role: Role, owner?: string) {
  return role === 'admin' || (role === 'contributor' && owner === actorId(role))
}

export function initialize(db: SQLiteDatabase) {
  db.execSync(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS families(id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY CHECK(id=1), name TEXT, email TEXT);
    CREATE TABLE IF NOT EXISTS categories(space TEXT REFERENCES families ON DELETE CASCADE,id TEXT,name TEXT NOT NULL,PRIMARY KEY(space,id));
    CREATE TABLE IF NOT EXISTS events(space TEXT REFERENCES families ON DELETE CASCADE,id TEXT,body TEXT NOT NULL,deleted INTEGER DEFAULT 0,PRIMARY KEY(space,id));
    CREATE TABLE IF NOT EXISTS people(space TEXT REFERENCES families ON DELETE CASCADE,id TEXT,body TEXT NOT NULL,PRIMARY KEY(space,id));
    CREATE TABLE IF NOT EXISTS participants(space TEXT,event TEXT,person TEXT,PRIMARY KEY(space,event,person),
      FOREIGN KEY(space,event) REFERENCES events ON DELETE CASCADE, FOREIGN KEY(space,person) REFERENCES people ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS photos(space TEXT,event TEXT,id TEXT,body TEXT NOT NULL,deleted INTEGER DEFAULT 0,PRIMARY KEY(space,id),
      FOREIGN KEY(space,event) REFERENCES events ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS audit(space TEXT,actor TEXT,action TEXT,record TEXT,at TEXT DEFAULT CURRENT_TIMESTAMP);
  `)
}

export type Identity = { name: string; email: string }
export function familyList(db: SQLiteDatabase) {
  return db.getAllSync<{ id: string; name: string }>(
    'SELECT * FROM families ORDER BY rowid',
  )
}
export function field(
  value: string,
  max: number,
  label: string,
  required = false,
) {
  const clean = value.trim()
  if (required && !clean) throw Error('Informe ' + label + '.')
  if (clean.length > max)
    throw Error(label + ' aceita até ' + max + ' caracteres.')
  return clean
}
export function createFamily(db: SQLiteDatabase, name: string) {
  const id = localId('family')
  db.runSync(
    'INSERT INTO families VALUES (?,?)',
    id,
    field(name, 120, 'o nome da família', true),
  )
  for (const label of ['Família', 'Viagem', 'Celebração', 'Estudo', 'Trabalho'])
    db.runSync(
      'INSERT INTO categories VALUES (?,?,?)',
      id,
      localId('category'),
      label,
    )
  return id
}

type Stored = { body: string }
export function readAlbum(db: SQLiteDatabase, space: string) {
  const events = db
    .getAllSync<Stored>(
      'SELECT body FROM events WHERE space=? AND deleted=0',
      space,
    )
    .map((r) => JSON.parse(r.body) as Event)
  const people = db
    .getAllSync<Stored>('SELECT body FROM people WHERE space=?', space)
    .map((r) => JSON.parse(r.body) as Person)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const categories = Object.fromEntries(
    db
      .getAllSync<{ id: string; name: string }>(
        'SELECT id,name FROM categories WHERE space=?',
        space,
      )
      .map((r) => [r.id, r.name]),
  )
  const participants: Data['participants'] = {}
  const peopleById = new Map(people.map((p) => [p.id, p]))
  for (const link of db.getAllSync<{ event: string; person: string }>(
    'SELECT p.event,p.person FROM participants p JOIN events e ON e.id=p.event AND e.space=p.space WHERE p.space=? AND e.deleted=0',
    space,
  )) {
    const p = peopleById.get(link.person)
    if (p) (participants[link.event] ??= []).push(p)
  }
  const photos: Photo[] = [],
    trash: Photo[] = []
  for (const r of db.getAllSync<{ body: string; deleted: number }>(
    `SELECT p.body,p.deleted FROM photos p JOIN events e ON e.space=p.space AND e.id=p.event
    WHERE p.space=? AND e.deleted=0 ORDER BY p.rowid DESC`,
    space,
  ))
    (r.deleted ? trash : photos).push(JSON.parse(r.body))
  return {
    data: {
      events: sortEvents(events),
      people,
      categories,
      participants,
      photos,
    },
    trash,
  }
}

export type EventInput = {
  title: string
  description: string
  date: string
  approximation: string
  category: string
  location: string
  moment: Event['moment_type']
  participants: string[]
}
export type PersonInput = {
  name: string
  nickname: string
  description: string
}
export function albumWriter(db: SQLiteDatabase, space: string, role: Role) {
  const actor = actorId(role)
  function requireOwner(owner?: string) {
    if (!canChange(role, owner))
      throw Error('Seu papel não permite esta alteração.')
  }
  function log(action: string, id: string) {
    db.runSync(
      'INSERT INTO audit(space,actor,action,record) VALUES (?,?,?,?)',
      space,
      actor,
      action,
      id,
    )
  }
  function existing<T>(table: 'people' | 'events' | 'photos', id: string) {
    const row = db.getFirstSync<{ body: string }>(
      `SELECT body FROM ${table} WHERE space=? AND id=? ${table === 'people' ? '' : 'AND deleted=0'}`,
      space,
      id,
    )
    if (!row) throw Error('Registro indisponível nesta família.')
    return JSON.parse(row.body) as T
  }
  function savePerson(id: string | undefined, input: PersonInput) {
    const prev = id ? existing<Person>('people', id) : undefined
    requireOwner(prev ? prev.created_by : actor)
    const person: Person = {
      id: id ?? localId('person'),
      created_by: prev?.created_by ?? actor,
      name: field(input.name, 160, 'o nome', true),
      nickname: field(input.nickname, 120, 'Apelido'),
      description: field(input.description, 5000, 'Descrição'),
    }
    const duplicate = db
      .getAllSync<Stored>(
        'SELECT body FROM people WHERE space=? AND id<>?',
        space,
        person.id,
      )
      .some(
        (row) =>
          (JSON.parse(row.body) as Person).name.toLocaleLowerCase('pt-BR') ===
          person.name.toLocaleLowerCase('pt-BR'),
      )
    if (duplicate)
      throw Error('Já existe uma pessoa com esse nome nesta família.')
    db.runSync(
      'INSERT INTO people VALUES (?,?,?) ON CONFLICT(space,id) DO UPDATE SET body=excluded.body',
      space,
      person.id,
      JSON.stringify(person),
    )
    log('salvar pessoa', person.id)
    return person.id
  }
  function saveEvent(id: string | undefined, input: EventInput) {
    const prev = id ? existing<Event>('events', id) : undefined
    requireOwner(prev ? prev.created_by : actor)
    if (
      input.category &&
      !db.getFirstSync(
        'SELECT 1 FROM categories WHERE space=? AND id=?',
        space,
        input.category,
      )
    )
      throw Error('Categoria indisponível.')
    const event: Event = {
      id: id ?? localId('event'),
      space_id: space,
      created_by: prev?.created_by ?? actor,
      created_at: prev?.created_at ?? new Date().toISOString(),
      title: field(input.title, 200, 'o título', true),
      description: field(input.description, 10000, 'Descrição'),
      ...parseDemoDate(input.date),
      approximate_date_label:
        field(input.approximation, 160, 'Data aproximada') || null,
      category_id: input.category || null,
      moment_type: input.moment,
      location: field(input.location, 160, 'Local'),
    }
    db.runSync(
      'INSERT INTO events(space,id,body) VALUES (?,?,?) ON CONFLICT(space,id) DO UPDATE SET body=excluded.body',
      space,
      event.id,
      JSON.stringify(event),
    )
    db.runSync(
      'DELETE FROM participants WHERE space=? AND event=?',
      space,
      event.id,
    )
    for (const p of new Set(input.participants))
      db.runSync('INSERT INTO participants VALUES (?,?,?)', space, event.id, p)
    log('salvar acontecimento', event.id)
    return event.id
  }
  function addPhoto(event: string, photo: Photo) {
    existing<Event>('events', event)
    requireOwner(actor)
    db.runSync(
      'INSERT INTO photos(space,event,id,body) VALUES (?,?,?,?)',
      space,
      event,
      photo.id,
      JSON.stringify({ ...photo, event_id: event, created_by: actor }),
    )
  }
  function deleteEvent(id: string) {
    requireOwner(existing<Event>('events', id).created_by)
    db.runSync('UPDATE events SET deleted=1 WHERE space=? AND id=?', space, id)
    log('excluir acontecimento', id)
  }
  function editPhoto(id: string, description?: string) {
    const photo = existing<Photo>('photos', id)
    existing<Event>('events', photo.event_id)
    requireOwner(photo.created_by)
    if (description === undefined)
      db.runSync(
        'UPDATE photos SET deleted=1 WHERE space=? AND id=?',
        space,
        id,
      )
    else
      db.runSync(
        'UPDATE photos SET body=? WHERE space=? AND id=?',
        JSON.stringify({
          ...photo,
          description: field(description, 2000, 'Descrição'),
        }),
        space,
        id,
      )
    log(description === undefined ? 'excluir foto' : 'editar foto', id)
  }
  function restorePhoto(id: string) {
    if (role !== 'admin')
      throw Error('Apenas o administrador pode restaurar fotos.')
    const result = db.runSync(
      'UPDATE photos SET deleted=0 WHERE deleted=1 AND space=? AND id=? AND event IN (SELECT id FROM events WHERE space=? AND deleted=0)',
      space,
      id,
      space,
    )
    if (!result.changes)
      throw Error('Foto indisponível na lixeira desta família.')
    log('restaurar foto', id)
  }
  return {
    savePerson,
    saveEvent,
    addPhoto,
    deleteEvent,
    editPhoto,
    restorePhoto,
  }
}
