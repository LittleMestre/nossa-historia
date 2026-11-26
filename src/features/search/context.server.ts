import { createSupabaseServerClient } from '../../lib/supabase/server'
import { getSpaceState } from '../spaces/spaces'
import type { SearchScope } from './model'

export async function searchContext(scope: SearchScope) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || user?.id !== scope.userId) throw new Error('Sua sessão mudou.')
  const { activeSpace } = await getSpaceState()
  if (activeSpace?.id !== scope.spaceId)
    throw new Error('O espaço ativo mudou.')
  return { supabase, spaceId: activeSpace.id }
}
