import { z } from 'zod'
import type { Database } from '../../types/database.types'

export const personInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(160, 'O nome deve ter até 160 caracteres.'),
  nickname: z.string().trim().max(120, 'O apelido deve ter até 120 caracteres.'),
  description: z.string().trim().max(5000, 'A descrição deve ter até 5.000 caracteres.'),
})
export type PersonInput = z.infer<typeof personInputSchema>
export type Person = Database['public']['Tables']['people']['Row']
export type ParticipantLink = Database['public']['Tables']['event_participants']['Row']
