import { useState, useMemo } from 'react'
import { View, Text, TextInput, ActivityIndicator } from 'react-native'
import { useApp } from '@/lib/app-context'
import { Screen, Empty, usePalette, EventCard } from './ui'
import { Stage, Chip, datedMoment, type Moment } from './Stage'
const types = { family: 'Familiar', individual: 'Individual', other: 'Outro' }
export function Experience({ spiral }: { spiral: boolean }) {
  const { active } = useApp()
  return <Album key={active?.id} spiral={spiral} />
}
function Album({ spiral }: { spiral: boolean }) {
  const { data, busy } = useApp(),
    c = usePalette()
  const [panel, setPanel] = useState(false),
    [year, setYear] = useState(''),
    [category, setCategory] = useState(''),
    [kind, setKind] = useState('')
  const [input, setInput] = useState(''),
    [jump, setJump] = useState<number | null>(null),
    [serial, setSerial] = useState(0),
    [warning, warn] = useState('')
  const filtered = useMemo(
    () =>
      data.events.filter(
        (e) =>
          (!category || e.category_id === category) &&
          (!kind || kind === e.moment_type) &&
          (!year ||
            (year === '?'
              ? e.start_year === null
              : e.start_year !== null &&
                e.start_year <= Number(year) &&
                (e.end_year ?? e.start_year) >= Number(year))),
      ),
    [data.events, year, category, kind],
  )
  const items = useMemo(() => {
    const today = new Date()
    const y = today.getFullYear()
    const values: Moment[] = filtered
      .filter((e) => e.start_year !== null)
      .map((e) => datedMoment(e, data.photos))
    values.push({
      id: 'today',
      date: today.toLocaleDateString('pt-BR'),
      title: 'Hoje',
      year: y,
      order: y * 10000 + (today.getMonth() + 1) * 100 + today.getDate(),
      photos: [],
    })
    if (jump !== null && !values.some((i) => i.year === jump))
      values.push({
        id: 'year',
        date: 'Marco na linha do tempo',
        title: String(jump),
        year: jump,
        order: jump * 10000,
        photos: [],
      })
    return values.sort((a, b) => a.order - b.order)
  }, [filtered, data.photos, jump])
  const selected =
    jump !== null
      ? items.find((i) => i.year === jump)
      : (items
          .filter(
            (i) =>
              i.event && i.order <= items.find((i) => i.id === 'today')!.order,
          )
          .at(-1) ?? items.find((i) => i.event))
  const row = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  } as const
  function clear() {
    setYear('')
    setCategory('')
    setKind('')
    setJump(null)
  }
  return (
    <Screen title={spiral ? 'Espiral de memórias' : 'Linha do tempo'}>
      <View style={row}>
        <Chip
          label={
            panel
              ? 'Fechar filtros'
              : 'Filtros' + (year || category || kind ? ' •' : '')
          }
          onPress={() => setPanel(!panel)}
        />
        <Text style={{ color: c.muted, alignSelf: 'center' }}>
          {filtered.length} acontecimentos
        </Text>
      </View>
      {panel && (
        <View
          style={{
            backgroundColor: c.soft,
            borderRadius: 16,
            padding: 12,
            gap: 6,
          }}
        >
          <Text style={{ color: c.ink }}>Ano</Text>
          <TextInput
            accessibilityLabel="Filtrar por ano"
            keyboardType="number-pad"
            placeholder="Todos os anos"
            placeholderTextColor={c.muted}
            value={year === '?' ? '' : year}
            onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))}
            style={{ backgroundColor: c.card, color: c.ink, padding: 10 }}
          />
          <View style={row}>
            <Chip
              label="Sem data"
              selected={year === '?'}
              onPress={() => setYear(year === '?' ? '' : '?')}
            />
          </View>
          <Text style={{ color: c.ink }}>Categoria</Text>
          <View style={row}>
            {Object.entries(data.categories).map(([id, label]) => (
              <Chip
                key={id}
                label={label}
                selected={category === id}
                onPress={() => setCategory(category === id ? '' : id)}
              />
            ))}
          </View>
          <Text style={{ color: c.ink }}>Tipo de momento</Text>
          <View style={row}>
            {Object.entries(types).map(([id, label]) => (
              <Chip
                key={id}
                label={label}
                selected={kind === id}
                onPress={() => setKind(kind === id ? '' : id)}
              />
            ))}
          </View>
          <Chip label="Limpar filtros" onPress={clear} />
        </View>
      )}
      {busy && <ActivityIndicator color={c.accent} />}
      {!busy && !filtered.length && (
        <Empty
          icon="time-outline"
          title="Nenhum acontecimento"
          detail="Confira o espaço e os filtros selecionados."
        />
      )}
      {filtered.some((e) => e.start_year !== null) && (
        <>
          <Stage
            key={[
              year,
              kind,
              category,
              serial,
              items.map((i) => i.id).join(','),
            ].join('/')}
            items={items}
            initial={selected?.id ?? 'today'}
            spiral={spiral}
          />
          <View style={row}>
            <TextInput
              value={input}
              placeholder="Ano (ex. 2020)"
              accessibilityLabel="Ano de destino"
              placeholderTextColor={c.muted}
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={setInput}
              style={{
                backgroundColor: c.card,
                color: c.ink,
                borderColor: c.border,
                borderWidth: 1,
                paddingHorizontal: 12,
                borderRadius: 12,
                flex: 1,
              }}
            />
            <Chip
              label="Ir ao ano"
              onPress={() => {
                if (!/^[1-9]\d{3}$/.test(input)) {
                  warn('Informe um ano de quatro dígitos.')
                  return
                }
                warn('')
                setJump(Number(input))
                setSerial((n) => n + 1)
              }}
            />
          </View>
          {!!warning && <Text style={{ color: c.ink }}>{warning}</Text>}
        </>
      )}
      {filtered.some((e) => e.start_year === null) && (
        <Text style={{ color: c.muted, marginVertical: 12 }}>Sem data</Text>
      )}
      {filtered
        .filter((e) => e.start_year === null)
        .map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
    </Screen>
  )
}
