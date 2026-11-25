import type { Event } from './model'

type DateFields = Pick<
  Event,
  | 'date_precision'
  | 'start_year'
  | 'start_month'
  | 'start_day'
  | 'end_year'
  | 'end_month'
  | 'end_day'
>

function formatParts(
  year: number | null,
  month: number | null,
  day: number | null,
) {
  return [day, month, year]
    .filter((part) => part !== null)
    .map((part, index, parts) =>
      String(part).padStart(index === parts.length - 1 ? 4 : 2, '0'),
    )
    .join('/')
}

export function demoDateInput(event?: Event) {
  if (!event) {
    const today = new Date()
    return formatParts(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    )
  }
  const start = formatParts(
    event.start_year,
    event.start_month,
    event.start_day,
  )
  return event.date_precision === 'range'
    ? `${start} a ${formatParts(event.end_year, event.end_month, event.end_day)}`
    : start
}

function parseParts(input: string) {
  const match = /^(?:(?:(\d{1,2})\/)?(\d{1,2})\/)?(\d{4})$/.exec(input)
  if (!match) throw Error('Use DD/MM/AAAA, MM/AAAA ou AAAA.')
  const [, dayText, monthText, yearText] = match
  const year = Number(yearText)
  const month = monthText ? Number(monthText) : null
  const day = dayText ? Number(dayText) : null
  if (year < 1000 || (month !== null && (month < 1 || month > 12))) {
    throw Error('Informe um ano e um mês válidos.')
  }
  if (month !== null && day !== null) {
    const last = new Date(0)
    last.setUTCFullYear(year, month, 0)
    if (day < 1 || day > last.getUTCDate())
      throw Error('Informe um dia válido para esse mês.')
  }
  return { year, month, day }
}

export function parseDemoDate(value: string): DateFields {
  const input = value.trim()
  const [startText, endText, ...extra] = input.split(
    /\s+(?:a|até)\s+|\s*[-–—]\s*/i,
  )
  if (extra.length || (endText !== undefined && (!startText || !endText))) {
    throw Error('Use duas datas para o intervalo, por exemplo 1998 a 2001.')
  }
  const start = startText ? parseParts(startText) : null
  const end = endText ? parseParts(endText) : null
  if (start && end) {
    const firstDay =
      start.year * 10000 + (start.month ?? 1) * 100 + (start.day ?? 1)
    const lastDay = end.year * 10000 + (end.month ?? 12) * 100 + (end.day ?? 31)
    if (firstDay > lastDay)
      throw Error('A data final precisa ser igual ou posterior à inicial.')
  }
  return {
    date_precision: end
      ? 'range'
      : !start
        ? 'unknown'
        : start.day
          ? 'day'
          : start.month
            ? 'month'
            : 'year',
    start_year: start?.year ?? null,
    start_month: start?.month ?? null,
    start_day: start?.day ?? null,
    end_year: end?.year ?? null,
    end_month: end?.month ?? null,
    end_day: end?.day ?? null,
  }
}
