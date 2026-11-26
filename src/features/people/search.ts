import { createServerFn } from '@tanstack/react-start'
import { searchContext } from '../search/context.server'
import {
  literalPattern,
  searchInputSchema,
  searchPageSize,
} from '../search/model'
import type { Person } from './model'

export type SearchPerson = Pick<Person, 'id' | 'name' | 'nickname'>

export const searchPeople = createServerFn({ method: 'POST' })
  .validator(
    searchInputSchema.extend({ text: searchInputSchema.shape.text.min(1) }),
  )
  .handler(async ({ data }) => {
    const { supabase, spaceId } = await searchContext(data)
    const pattern = literalPattern(data.text)
    const offset = data.page * searchPageSize
    const {
      data: people,
      count,
      error,
    } = await supabase
      .from('people')
      .select('id, name, nickname, description', { count: 'exact' })
      .eq('space_id', spaceId)
      .or(`name.imatch.${pattern},nickname.imatch.${pattern}`)
      .order('name')
      .order('id')
      .range(offset, offset + searchPageSize - 1)
    if (error || count === null)
      throw new Error('Não foi possível buscar as pessoas.')
    return {
      total: count,
      people: people.map(({ description, ...person }) => ({
        ...person,
        description:
          description && description.length > 280
            ? `${description.slice(0, 280).trimEnd()}…`
            : description,
      })),
    }
  })
