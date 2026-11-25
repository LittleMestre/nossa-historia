import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
import { demoDateInput } from '@/lib/demo-date'
import { eventDate, type Event, type Person } from '@/lib/model'

function closeEditor() {
  if (router.canGoBack()) router.back()
  else router.replace('/events')
}

export default function Editor() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id?: string }>()
  const { data, active, user } = useApp()
  const person = kind === 'person'
  const c = usePalette()
  const event = data.events.find((item) => item.id === id)
  const personRecord = data.people.find((item) => item.id === id)
  const record = person ? personRecord : event
  const allowed =
    !!active &&
    active.role !== 'viewer' &&
    (!id ||
      (!!record && (active.role === 'admin' || record.created_by === user?.id)))
  return (
    <Screen
      title={
        (id ? 'Editar ' : 'Cadastrar ') + (person ? 'pessoa' : 'acontecimento')
      }
    >
      {allowed ? (
        <EditorForm
          key={`${kind}-${id ?? 'new'}`}
          {...{ id, person, event, personRecord }}
        />
      ) : (
        <>
          <Text style={{ color: c.ink }}>
            Edição indisponível para esta conta.
          </Text>
          <Button title="Fechar" outline onPress={closeEditor} />
        </>
      )}
    </Screen>
  )
}

function EditorForm({
  id,
  person,
  event,
  personRecord,
}: {
  id?: string
  person: boolean
  event?: Event
  personRecord?: Person
}) {
  const { demoActions, busy } = useApp()
  const c = usePalette()
  const record = person ? personRecord : event
  const [name, setName] = useState(
    (person ? personRecord?.name : event?.title) ?? '',
  )
  const [description, setDescription] = useState(record?.description ?? '')
  const [date, setDate] = useState(() =>
    demoActions && !person
      ? demoDateInput(event)
      : event
        ? eventDate(event)
        : '',
  )
  const [error, setError] = useState('')

  async function save() {
    if (!demoActions || busy) return
    setError('')
    try {
      const recordId = person
        ? await demoActions.savePerson(id, { name, description })
        : await demoActions.saveEvent(id, { title: name, description, date })
      if (id && router.canGoBack()) router.back()
      else if (person)
        router.replace({ pathname: '/person/[id]', params: { id: recordId } })
      else router.replace({ pathname: '/event/[id]', params: { id: recordId } })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível salvar.',
      )
    }
  }

  return (
    <View style={{ gap: 10 }}>
      {!demoActions && (
        <Text style={{ color: c.muted }}>
          Prévia do formulário. As alterações ficam apenas nesta tela e são
          descartadas ao sair.
        </Text>
      )}
      {[
        { label: person ? 'Nome' : 'Título', value: name, change: setName },
        ...(!person
          ? [{ label: 'Data original', value: date, change: setDate }]
          : []),
        { label: 'Descrição', value: description, change: setDescription },
      ].map((field) => (
        <View key={field.label}>
          <Text style={{ color: c.ink, marginVertical: 6 }}>{field.label}</Text>
          <TextInput
            accessibilityLabel={field.label}
            editable={!demoActions || !busy}
            multiline={field.label === 'Descrição'}
            value={field.value}
            onChangeText={field.change}
            style={{
              backgroundColor: c.card,
              borderColor: c.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 13,
              color: c.ink,
            }}
          />
          {demoActions && field.label === 'Data original' && (
            <Text style={{ color: c.muted, marginTop: 6 }}>
              DD/MM/AAAA, MM/AAAA, AAAA ou 1998 a 2001. Deixe em branco se a
              data é desconhecida.
            </Text>
          )}
        </View>
      ))}
      {error ? (
        <Text accessibilityRole="alert" style={{ color: c.warm }}>
          {error}
        </Text>
      ) : null}
      {demoActions ? (
        <Button
          title={busy ? 'Salvando…' : 'Salvar'}
          disabled={busy}
          onPress={() => void save()}
        />
      ) : (
        <Text style={{ color: c.muted }}>
          Salvamento indisponível nesta versão.
        </Text>
      )}
      <Button
        title={demoActions ? 'Cancelar' : 'Fechar'}
        disabled={!!demoActions && busy}
        outline
        onPress={closeEditor}
      />
    </View>
  )
}
