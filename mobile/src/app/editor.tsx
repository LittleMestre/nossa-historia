import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { Screen, Button, usePalette } from '@/components/ui'
import { useApp } from '@/lib/app-context'
import { eventDate } from '@/lib/model'
export default function Editor() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id?: string }>(),
    { data, active, user } = useApp(),
    person = kind === 'person',
    c = usePalette()
  const e = data.events.find((x) => x.id === id),
    p = data.people.find((x) => x.id === id),
    record = person ? p : e
  const [name, setName] = useState(person ? p?.name : e?.title),
    [detail, setDetail] = useState(record?.description ?? ''),
    [date, setDate] = useState(e ? eventDate(e) : '')
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
        <View style={{ gap: 10 }}>
          <Text style={{ color: c.muted }}>
            Prévia do formulário. As alterações ficam apenas nesta tela e são
            descartadas ao sair.
          </Text>
          {[
            {
              label: person ? 'Nome' : 'Título',
              value: name ?? '',
              change: setName,
            },
            ...(!person
              ? [
                  {
                    label:
                      'Data original (completa, parcial, intervalo ou desconhecida)',
                    value: date,
                    change: setDate,
                  },
                ]
              : []),
            { label: 'Descrição', value: detail, change: setDetail },
          ].map((f) => (
            <View key={f.label}>
              <Text style={{ color: c.ink, marginVertical: 6 }}>{f.label}</Text>
              <TextInput
                accessibilityLabel={f.label}
                multiline={f.label === 'Descrição'}
                value={f.value}
                onChangeText={f.change}
                style={{
                  backgroundColor: c.card,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 13,
                  color: c.ink,
                }}
              />
            </View>
          ))}
          <Text style={{ color: c.muted }}>
            Salvamento indisponível nesta versão.
          </Text>
        </View>
      ) : (
        <Text style={{ color: c.ink }}>
          Edição indisponível para esta conta.
        </Text>
      )}
      <Button
        title="Fechar"
        outline
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/events')
        }
      />
    </Screen>
  )
}
