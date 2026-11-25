import { Text, View } from 'react-native'
import { LocalField } from './LocalField'
import { Chip } from './Stage'
import { usePalette } from './ui'
import { demoDateInput } from '@/lib/demo-date'
import type { Event } from '@/lib/model'

type Parts = { day: string; month: string; year: string }
type Mode = 'single' | 'range' | 'unknown'
type Draft = { mode: Mode; start: Parts; end: Parts }
function parts(text = ''): Parts {
  const [year = '', month = '', day = ''] = text.split('/').reverse()
  return { year, month, day }
}
export function dateDraft(event?: Event): Draft {
  const [start, end] = demoDateInput(event).split(' a ')
  return {
    mode:
      event?.date_precision === 'unknown'
        ? 'unknown'
        : end
          ? 'range'
          : 'single',
    start: parts(start),
    end: parts(end),
  }
}
export function dateText(draft: Draft) {
  function format({ year, month, day }: Parts) {
    if (year.length !== 4 || (day && !month))
      throw Error('Informe o ano com quatro dígitos e o mês quando houver dia.')
    return [day, month, year].filter(Boolean).join('/')
  }
  if (draft.mode === 'unknown') return ''
  return draft.mode === 'range'
    ? format(draft.start) + ' a ' + format(draft.end)
    : format(draft.start)
}
export function LocalDateFields({
  value,
  onChange,
}: {
  value: Draft
  onChange: (v: Draft) => void
}) {
  const c = usePalette()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.ink }}>Data original</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {(
          [
            ['single', 'Uma data'],
            ['range', 'Intervalo'],
            ['unknown', 'Sem data'],
          ] as const
        ).map(([mode, label]) => (
          <Chip
            key={mode}
            label={label}
            selected={value.mode === mode}
            onPress={() => onChange({ ...value, mode })}
          />
        ))}
      </View>
      {value.mode !== 'unknown' && (
        <Text style={{ color: c.muted }}>
          Preencha apenas as partes conhecidas da data.
        </Text>
      )}
      {(['start', 'end'] as const)
        .filter(
          (bound) =>
            value.mode === 'range' ||
            (value.mode === 'single' && bound === 'start'),
        )
        .map((bound) => (
          <View key={bound}>
            {value.mode === 'range' && (
              <Text style={{ color: c.ink }}>
                {bound === 'start' ? 'Início' : 'Fim'}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(
                [
                  ['day', 'Dia'],
                  ['month', 'Mês'],
                  ['year', 'Ano'],
                ] as const
              ).map(([part, label]) => (
                <View key={part} style={{ flex: 1 }}>
                  <LocalField
                    label={label}
                    value={value[bound][part]}
                    keyboardType="number-pad"
                    maxLength={part === 'year' ? 4 : 2}
                    onChangeText={(text) =>
                      onChange({
                        ...value,
                        [bound]: {
                          ...value[bound],
                          [part]: text.replace(/\D/g, ''),
                        },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
    </View>
  )
}
