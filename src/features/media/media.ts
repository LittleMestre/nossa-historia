import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { getSpaceState } from '../spaces/spaces'

const MAX_BYTES = 20 * 1024 * 1024
const fields = z.object({
  eventId: z.uuid(),
  mediaId: z.uuid(),
  description: z.string().trim().max(2000).optional(),
})
const suffix: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}

async function detectMime(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) return 'image/png'
  if (bytes.length >= 12 && [82, 73, 70, 70].every((n, i) => bytes[i] === n) && [87, 69, 66, 80].every((n, i) => bytes[i + 8] === n)) return 'image/webp'
  return null
}

export const getEventPhotos = createServerFn({ method: 'GET' })
  .validator(z.object({ eventId: z.uuid() }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace) return { photos: [], canUpload: false }
    const { data: photos, error } = await supabase.from('media')
      .select('id, original_filename, file_size_bytes, description, created_at, uploaded_by')
      .eq('space_id', activeSpace.id).eq('event_id', data.eventId)
      .eq('upload_status', 'ready').eq('media_type', 'photo').is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) throw new Error('Não foi possível carregar as fotografias.')
    return { photos: photos.map((photo) => ({
      ...photo, canDelete: activeSpace.role === 'admin' ||
        (activeSpace.role === 'contributor' && photo.uploaded_by === user.id),
    })), canUpload: activeSpace.role !== 'viewer' }
  })

export const getGalleryPhotos = createServerFn({ method: 'GET' })
  .validator(z.object({ page: z.number().int().min(0).max(1000) }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace) return { photos: [], hasMore: false }
    const { data: photos, error } = await supabase.from('media')
      .select('id, description, created_at, original_filename, event_id, uploaded_by, events!inner(title, deleted_at)')
      .eq('space_id', activeSpace.id).eq('upload_status', 'ready')
      .eq('media_type', 'photo').is('deleted_at', null)
      .is('events.deleted_at', null)
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(data.page * 24, data.page * 24 + 24)
    if (error) throw new Error('Não foi possível carregar a galeria.')
    return { photos: photos.slice(0, 24).map(({ events, ...photo }) => ({
      ...photo, eventTitle: events.title,
      canDelete: activeSpace.role === 'admin' ||
        (activeSpace.role === 'contributor' && photo.uploaded_by === user.id),
    })), hasMore: photos.length > 24 }
  })

const signedFields = z.object({
  ids: z.array(z.uuid()).min(1).max(60),
  variant: z.enum(['thumbnail', 'original']),
})

export const getSignedPhotoUrls = createServerFn({ method: 'POST' })
  .validator(signedFields)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace) return { urls: {} as Record<string, string> }
    const ids = [...new Set(data.ids)]
    const { data: photos, error } = await supabase.from('media')
      .select('id, event_id, space_id, storage_path, mime_type, events!inner(id, space_id, deleted_at)')
      .eq('space_id', activeSpace.id).in('id', ids)
      .eq('media_type', 'photo').eq('upload_status', 'ready').is('deleted_at', null)
      .is('events.deleted_at', null)
    if (error) throw new Error('Não foi possível verificar as fotografias.')
    const localStorage = /localhost|127\.0\.0\.1/.test(process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '')
    const urls: Record<string, string> = {}
    await Promise.all(photos.filter((photo) => {
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[photo.mime_type]
      return extension && photo.events.id === photo.event_id && photo.events.space_id === activeSpace.id &&
        photo.storage_path === `${activeSpace.id}/${photo.event_id}/${photo.id}/original.${extension}`
    }).map(async (photo) => {
      const { data: signed, error: signError } = await supabase.storage.from('family-media')
        .createSignedUrl(photo.storage_path, 60, data.variant === 'thumbnail' && !localStorage
          ? { transform: { width: 480, height: 360, resize: 'contain', quality: 70 } } : undefined)
      if (!signError && signed) urls[photo.id] = signed.signedUrl
    }))
    return { urls }
  })

export const getTimelineMosaicPhotos = createServerFn({ method: 'POST' })
  .validator(z.object({ eventIds: z.array(z.uuid()).min(1).max(60) }))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (authError || !user || !activeSpace) throw new Error('Acesso às fotografias indisponível.')
    const eventIds = [...new Set(data.eventIds)]
    const { data: events, error: eventError } = await supabase.from('events')
      .select('id').eq('space_id', activeSpace.id).is('deleted_at', null).in('id', eventIds)
    if (eventError) throw new Error('Não foi possível verificar os eventos.')
    const allowed = new Set(events.map((event) => event.id))
    const { data: photos, error } = await supabase.rpc('timeline_mosaic_photos', {
      target_event_ids: eventIds.filter((id) => allowed.has(id)),
    })
    if (error) throw new Error('Não foi possível carregar o mosaico.')
    const byEvent: Record<string, string[]> = {}
    for (const id of eventIds) byEvent[id] = []
    for (const photo of photos) {
      if (allowed.has(photo.event_id)) byEvent[photo.event_id].push(photo.media_id)
    }
    return byEvent
  })

const mediaAction = z.object({ mediaId: z.uuid() })
const managementPage = z.object({ page: z.number().int().min(0).max(1000) })

export const deletePhoto = createServerFn({ method: 'POST' })
  .validator(mediaAction)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace || activeSpace.role === 'viewer')
      return { error: 'Você não tem permissão para excluir esta fotografia.' }
    const { data: photo } = await supabase.from('media')
      .select('id, uploaded_by').eq('id', data.mediaId)
      .eq('space_id', activeSpace.id).eq('media_type', 'photo')
      .eq('upload_status', 'ready').is('deleted_at', null).maybeSingle()
    if (!photo || (photo.uploaded_by !== user.id && activeSpace.role !== 'admin'))
      return { error: 'Fotografia indisponível ou sem permissão para exclusão.' }
    const { data: removed, error } = await supabase.rpc('delete_media_photo', { target_id: photo.id })
    return { error: error || !removed ? 'Não foi possível excluir a fotografia.' : null }
  })

export const getPhotoTrash = createServerFn({ method: 'GET' })
  .validator(managementPage)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace || activeSpace.role !== 'admin') return null
    const { data: rows, error } = await supabase.from('media')
      .select('id, original_filename, deleted_at, deleted_by, events!inner(title, deleted_at)')
      .eq('space_id', activeSpace.id).eq('media_type', 'photo')
      .eq('upload_status', 'ready').not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }).order('id', { ascending: false })
      .range(data.page * 24, data.page * 24 + 24)
    if (error) throw new Error('Não foi possível carregar a lixeira.')
    const ids = [...new Set(rows.map((row) => row.deleted_by).filter((id): id is string => !!id))]
    const { data: profiles, error: profileError } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [], error: null }
    if (profileError) throw new Error('Não foi possível carregar os responsáveis.')
    const names = new Map(profiles.map((profile) => [profile.id, profile.display_name]))
    return { photos: rows.slice(0, 24).map(({ events, ...row }) => ({
      ...row, eventTitle: events.title, eventActive: events.deleted_at === null,
      deletedByName: row.deleted_by ? names.get(row.deleted_by) ?? null : null,
    })), hasMore: rows.length > 24 }
  })

export const restorePhoto = createServerFn({ method: 'POST' })
  .validator(mediaAction)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace || activeSpace.role !== 'admin')
      return { error: 'Somente administradores podem restaurar fotografias.' }
    const { data: photo } = await supabase.from('media').select('id')
      .eq('id', data.mediaId).eq('space_id', activeSpace.id)
      .eq('media_type', 'photo').not('deleted_at', 'is', null).maybeSingle()
    if (!photo) return { error: 'Fotografia indisponível neste espaço.' }
    const { data: result, error } = await supabase.rpc('restore_media_photo', { target_id: photo.id })
    if (error) return { error: 'Não foi possível restaurar a fotografia.' }
    if (result === 'missing_object') return { error: 'O arquivo original está ausente ou não corresponde ao registro. A fotografia permanece na lixeira.' }
    return { error: result === 'restored' ? null : 'O evento precisa estar ativo para restaurar esta fotografia.' }
  })

export const getPendingPhotoUploads = createServerFn({ method: 'GET' })
  .validator(managementPage)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace || activeSpace.role !== 'admin') return null
    const { data: rows, error } = await supabase.rpc('list_pending_photo_uploads', {
      target_space: activeSpace.id, page_index: data.page,
    })
    if (error) throw new Error('Não foi possível verificar os uploads pendentes.')
    return { photos: rows.slice(0, 24), hasMore: rows.length > 24 }
  })

export const getOrphanPhotoObjects = createServerFn({ method: 'GET' })
  .validator(managementPage)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace || activeSpace.role !== 'admin') return null
    const { data: rows, error } = await supabase.rpc('list_orphan_photo_objects', {
      target_space: activeSpace.id, page_index: data.page,
    })
    if (error) throw new Error('Não foi possível verificar os objetos sem registro.')
    return { objects: rows.slice(0, 24), hasMore: rows.length > 24 }
  })

export const confirmPendingPhotoUpload = createServerFn({ method: 'POST' })
  .validator(mediaAction)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (!user || !activeSpace || activeSpace.role !== 'admin')
      return { error: 'Somente administradores podem conferir uploads pendentes.' }
    const { data: confirmed, error } = await supabase.rpc('confirm_pending_photo_upload', {
      target_id: data.mediaId, target_space: activeSpace.id,
    })
    return { error: error || !confirmed
      ? 'O arquivo ainda não está completo ou não corresponde ao registro. Nada foi alterado.' : null }
  })

export const uploadEventPhoto = createServerFn({ method: 'POST' })
  .validator((input: FormData) => input)
  .handler(async ({ data }) => {
    const parsed = fields.safeParse({
      eventId: data.get('eventId'), mediaId: data.get('mediaId'),
      description: data.get('description'),
    })
    if (!parsed.success) return { error: 'Dados do envio inválidos.' }
    const file = data.get('file')
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES ||
        file.name.length < 1 || file.name.length > 255) {
      return { error: 'Selecione uma imagem válida de até 20 MiB.' }
    }
    const mime = await detectMime(file)
    if (!mime || file.type !== mime) return { error: 'Formato não permitido. Use JPEG, PNG ou WebP.' }

    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const { activeSpace } = await getSpaceState()
    if (authError || !user || !activeSpace || activeSpace.role === 'viewer') {
      return { error: 'Você não tem permissão para enviar fotos.' }
    }
    const { data: event } = await supabase.from('events').select('id')
      .eq('id', parsed.data.eventId).eq('space_id', activeSpace.id)
      .is('deleted_at', null).maybeSingle()
    if (!event) return { error: 'Evento indisponível neste espaço familiar.' }

    const path = `${activeSpace.id}/${event.id}/${parsed.data.mediaId}/original.${suffix[mime]}`
    const { data: existing, error: lookupError } = await supabase.from('media')
      .select('id, storage_path, uploaded_by, file_size_bytes, mime_type, original_filename, description, upload_status')
      .eq('id', parsed.data.mediaId).maybeSingle()
    if (lookupError) return { error: 'Não foi possível verificar o envio anterior.' }
    if (existing && (existing.uploaded_by !== user.id || existing.storage_path !== path ||
        existing.file_size_bytes !== file.size || existing.mime_type !== mime ||
        existing.original_filename !== file.name || existing.description !== (parsed.data.description || null))) {
      return { error: 'Este envio já pertence a outro arquivo.' }
    }
    if (existing?.upload_status === 'ready') return { error: null }
    if (!existing) {
      const { error } = await supabase.from('media').insert({
        id: parsed.data.mediaId, space_id: activeSpace.id, event_id: event.id,
        uploaded_by: user.id, storage_path: path, media_type: 'photo',
        mime_type: mime, file_size_bytes: file.size, original_filename: file.name,
        description: parsed.data.description || null,
      })
      if (error) return { error: 'Não foi possível preparar a fotografia. Tente novamente.' }
    }

    const { error: uploadError } = await supabase.storage.from('family-media').upload(path, file, {
      contentType: mime, upsert: false,
    })
    // A lost response may mean that the object was stored. Finalize by checking
    // Storage metadata instead of blindly creating another record.
    const { data: finalized, error: finalizeError } = await supabase.rpc('finalize_media_upload', {
      target_id: parsed.data.mediaId,
    })
    if (!finalizeError && finalized) return { error: null }
    return { error: uploadError
      ? 'O envio não foi concluído. Tente novamente com este mesmo arquivo.'
      : 'O arquivo chegou ao Storage, mas não foi confirmado. Tente novamente.' }
  })
