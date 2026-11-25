import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View, Text } from 'react-native'
import type { ImagePickerAsset } from 'expo-image-picker'
import { Screen, Button, usePalette } from '@/components/ui'
import { LocalField } from '@/components/LocalField'
import { Chip } from '@/components/Stage'
import { useApp } from '@/lib/app-context'
import {
  dateDraft,
  dateText,
  LocalDateFields,
} from '@/components/LocalDateFields'
import { pickDemoPhotos } from '@/lib/demo-actions'
import { canChange } from '@/lib/local-repository'
import type { Event, Person } from '@/lib/model'

function closeEditor() {
  if (router.canGoBack()) router.back()
  else router.replace('/events')
}
export default function Editor() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id?: string }>()
  const { data, active, demoActions } = useApp()
  const event = data.events.find((e) => e.id === id)
  const person = data.people.find((p) => p.id === id)
  const isPerson = kind === 'person'
  const record = isPerson ? person : event
  const allowed =
    demoActions &&
    active &&
    active.role !== 'viewer' &&
    (!id || (record && canChange(active.role, record.created_by)))
  return (
    <Screen
      title={
        (id ? 'Editar ' : 'Cadastrar ') +
        (isPerson ? 'pessoa' : 'acontecimento')
      }
    >
      {allowed ? (
        <Form
          key={[active.id, kind, id].join('/')}
          {...{ event, person, isPerson, id }}
        />
      ) : (
        <Button title="Edição indisponível · voltar" onPress={closeEditor} />
      )}
    </Screen>
  )
}
function Form({
  event,
  person,
  isPerson,
  id,
}: {
  event?: Event
  person?: Person
  isPerson: boolean
  id?: string
}) {
  const { data, demoActions, busy } = useApp()
  const c = usePalette()
  const [name, setName] = useState(person?.name ?? event?.title ?? '')
  const [nickname, setNickname] = useState(person?.nickname ?? '')
  const [description, setDescription] = useState(
    (isPerson ? person : event)?.description ?? '',
  )
  const [date, setDate] = useState(() => dateDraft(event))
  const [approximation, setApproximation] = useState(
    event?.approximate_date_label ?? '',
  )
  const [location, setLocation] = useState(event?.location ?? '')
  const [category, setCategory] = useState(event?.category_id ?? '')
  const [moment, setMoment] = useState<Event['moment_type']>(
    event?.moment_type ?? 'family',
  )
  const [participants, setParticipants] = useState<string[]>(
    () => data.participants[id ?? '']?.map((p) => p.id) ?? [],
  )
  const [assets, setAssets] = useState<ImagePickerAsset[]>([])
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')
  const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 6 } as const
  async function save() {
    if (!demoActions || busy || picking) return
    try {
      const saved = isPerson
        ? await demoActions.savePerson(id, { name, nickname, description })
        : await demoActions.saveEvent(
            id,
            {
              title: name,
              description,
              date: dateText(date),
              approximation,
              location,
              category,
              moment,
              participants,
            },
            assets,
          )
      if (id && router.canGoBack()) router.back()
      else router.replace(isPerson ? `/person/${saved}` : `/event/${saved}`)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Falha ao salvar neste aparelho.',
      )
    }
  }
  async function pick() {
    setPicking(true)
    try {
      const selected = await pickDemoPhotos()
      setAssets((prev) => [...prev, ...selected])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao importar.')
    } finally {
      setPicking(false)
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <LocalField
        label={isPerson ? 'Nome' : 'Título'}
        value={name}
        onChangeText={setName}
        maxLength={isPerson ? 160 : 200}
      />
      {isPerson && (
        <LocalField
          label="Apelido"
          value={nickname}
          onChangeText={setNickname}
          maxLength={120}
        />
      )}
      <LocalField
        label="Descrição"
        multiline
        value={description}
        onChangeText={setDescription}
        maxLength={isPerson ? 5000 : 10000}
      />
      {!isPerson && (
        <>
          <LocalDateFields value={date} onChange={setDate} />
          <LocalField
            label="Indicação aproximada (opcional)"
            placeholder="Por volta do verão"
            value={approximation}
            onChangeText={setApproximation}
            maxLength={160}
          />
          <LocalField
            label="Local"
            value={location}
            onChangeText={setLocation}
            maxLength={160}
          />
          <Text style={{ color: c.ink }}>Tipo de momento</Text>
          <View style={row}>
            {(
              [
                ['family', 'Familiar'],
                ['individual', 'Individual'],
                ['other', 'Outro'],
              ] as const
            ).map(([k, label]) => (
              <Chip
                key={k}
                label={label}
                selected={moment === k}
                onPress={() => setMoment(k)}
              />
            ))}
          </View>
          <Text style={{ color: c.ink }}>Categoria</Text>
          <View style={row}>
            {Object.entries({ '': 'Sem categoria', ...data.categories }).map(
              ([k, label]) => (
                <Chip
                  key={k}
                  label={label}
                  selected={category === k}
                  onPress={() => setCategory(k)}
                />
              ),
            )}
          </View>
          <Text style={{ color: c.ink }}>Participantes</Text>
          {!data.people.length && (
            <Text style={{ color: c.muted }}>
              Cadastre pessoas na aba Pessoas para vinculá-las aqui.
            </Text>
          )}
          <View style={row}>
            {data.people.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                selected={participants.includes(p.id)}
                onPress={() =>
                  setParticipants((prev) =>
                    prev.includes(p.id)
                      ? prev.filter((k) => k !== p.id)
                      : [...prev, p.id],
                  )
                }
              />
            ))}
          </View>
          <Button
            outline
            title={
              assets.length
                ? `Adicionar mais fotos (${assets.length} selecionadas)`
                : 'Selecionar fotografias'
            }
            disabled={busy || picking}
            onPress={() => void pick()}
          />
          {!!assets.length && (
            <Chip
              label="Limpar seleção de fotos"
              onPress={() => setAssets([])}
            />
          )}
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: c.warm }}>
          {error}
        </Text>
      )}
      <Button
        title={busy ? 'Salvando…' : 'Salvar neste aparelho'}
        disabled={busy || picking}
        onPress={() => void save()}
      />
      <Button
        outline
        title="Cancelar"
        disabled={busy || picking}
        onPress={closeEditor}
      />
    </View>
  )
}
