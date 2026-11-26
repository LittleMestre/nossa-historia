import { z } from 'zod'

export const searchPageSize = 20
export const searchTextLimit = 200

export const searchScopeSchema = z.object({
  userId: z.uuid(),
  spaceId: z.uuid(),
})
export type SearchScope = z.infer<typeof searchScopeSchema>

export const searchInputSchema = searchScopeSchema.extend({
  text: z
    .string()
    .trim()
    .max(searchTextLimit)
    .refine((text) => !text.includes('\0')),
  page: z
    .number()
    .int()
    .min(0)
    .max(
      Math.floor((Number.MAX_SAFE_INTEGER - searchPageSize) / searchPageSize),
    ),
})

// PostgreSQL's (?q) treats the remaining pattern literally. Quote it separately
// for PostgREST's logical filter syntax.
export function literalPattern(text: string) {
  return `"(?q)${text.replace(/[\\"]/g, '\\$&')}"`
}
