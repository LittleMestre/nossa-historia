import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SECRET_KEY && existsSync('.env'))
    loadEnvFile('.env')
  const url = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key)
    throw new Error('Configure SUPABASE_SECRET_KEY no servidor.')
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
