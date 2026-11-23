import type { TimelineEvent, MomentType } from '../../components/timeline/timeline-model'
import type { UndatedEvent } from './timeline'

export interface TimelineFilters {
  year: number | 'undated' | null
  categoryId: string | null
  momentType: MomentType | null
}

export const emptyTimelineFilters: TimelineFilters = {
  year: null,
  categoryId: null,
  momentType: null,
}

export function availableTimelineYears(events: TimelineEvent[]): number[] {
  const years = new Set<number>()
  for (const event of events) {
    const end = event.datePrecision === 'range' ? event.endYear ?? event.year : event.year
    for (let year = event.year; year <= end; year++) years.add(year)
  }
  return [...years].sort((a, b) => b - a)
}

export function filterTimeline(
  events: TimelineEvent[],
  undated: UndatedEvent[],
  filters: TimelineFilters,
) {
  const matches = (event: { categoryId?: string | null; momentType?: MomentType }) =>
    (!filters.categoryId || event.categoryId === filters.categoryId) &&
    (!filters.momentType || event.momentType === filters.momentType)
  const selectedYear = filters.year
  const known = selectedYear === 'undated' ? [] : events.filter((event) =>
    matches(event) && (typeof selectedYear !== 'number' || (
      event.year <= selectedYear &&
      (event.datePrecision === 'range' ? (event.endYear ?? event.year) >= selectedYear : event.year === selectedYear)
    )),
  )
  const withoutDate = filters.year !== null && filters.year !== 'undated' ? [] : undated.filter(matches)
  return { events: known, undated: withoutDate, count: known.length + withoutDate.length }
}
