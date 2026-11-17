-- 4D: reversible photo management. No Storage object is deleted here.
revoke update (deleted_at) on public.media from authenticated;

create function private.media_object_matches(photo public.media)
returns boolean language sql stable security definer set search_path = '' as $$
  select photo.media_type = 'photo'
    and photo.storage_path = photo.space_id::text || '/' || photo.event_id::text || '/' || photo.id::text ||
      '/original.' || case photo.mime_type
        when 'image/jpeg' then 'jpg'
        when 'image/png' then 'png'
        when 'image/webp' then 'webp'
        else 'invalid' end
    and exists (
      select 1 from storage.objects object
      where object.bucket_id = 'family-media' and object.name = photo.storage_path
        and object.metadata->>'mimetype' = photo.mime_type
        and case when object.metadata->>'size' ~ '^[0-9]+$'
          then (object.metadata->>'size')::bigint else null end = photo.file_size_bytes
    );
$$;
revoke all on function private.media_object_matches(public.media) from public, anon, authenticated;

create function public.delete_media_photo(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare photo public.media%rowtype;
begin
  if (select auth.uid()) is null then return false; end if;
  select * into photo from public.media where id = target_id for update;
  if not found or photo.media_type <> 'photo' or photo.upload_status <> 'ready'
     or photo.deleted_at is not null
     or not (select private.can_contribute(photo.space_id))
     or (photo.uploaded_by <> (select auth.uid()) and not (select private.is_admin(photo.space_id)))
     or not (select private.active_event_in_space(photo.event_id, photo.space_id)) then
    return false;
  end if;
  update public.media set deleted_at = now() where id = photo.id;
  return true;
end;
$$;
revoke all on function public.delete_media_photo(uuid) from public, anon;
grant execute on function public.delete_media_photo(uuid) to authenticated;

create function public.restore_media_photo(target_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare photo public.media%rowtype;
begin
  if (select auth.uid()) is null then return 'unavailable'; end if;
  select * into photo from public.media where id = target_id for update;
  if not found or not (select private.is_admin(photo.space_id))
     or photo.media_type <> 'photo' or photo.upload_status <> 'ready'
     or photo.deleted_at is null
     or not (select private.active_event_in_space(photo.event_id, photo.space_id)) then
    return 'unavailable';
  end if;
  if not (select private.media_object_matches(photo)) then return 'missing_object'; end if;
  update public.media set deleted_at = null where id = photo.id;
  return 'restored';
end;
$$;
revoke all on function public.restore_media_photo(uuid) from public, anon;
grant execute on function public.restore_media_photo(uuid) to authenticated;

-- Keep the existing moderation audit, and also record owner deletions and all restorations.
drop trigger media_admin_audit on public.media;
create function private.audit_media_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid());
declare action_name text;
begin
  if actor is null then return new; end if;
  if old.deleted_at is null and new.deleted_at is not null then
    action_name := 'photo_delete';
  elsif old.deleted_at is not null and new.deleted_at is null then
    action_name := 'photo_restore';
  elsif actor is distinct from old.uploaded_by and (select private.is_admin(old.space_id)) then
    action_name := 'moderate_update';
  end if;
  if action_name is not null then
    insert into public.audit_logs(space_id, actor_id, action, entity_type, entity_id, metadata)
    values (old.space_id, actor, action_name, 'media', old.id,
      jsonb_build_object('operation', case when action_name = 'photo_delete' then 'delete'
        when action_name = 'photo_restore' then 'restore'
        when old.upload_status = 'pending' and new.upload_status = 'ready' then 'confirm_upload'
        else 'update' end));
  end if;
  return new;
end;
$$;
revoke all on function private.audit_media_changes() from public, anon, authenticated;
create trigger media_activity_audit after update on public.media
for each row execute function private.audit_media_changes();

-- Administrative inventory: no signed URLs and no object reads granted to clients.
create function public.list_pending_photo_uploads(target_space uuid, page_index integer)
returns table(id uuid, original_filename text, created_at timestamptz,
  event_title text, event_active boolean, object_state text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not (select private.is_admin(target_space))
     or page_index < 0 or page_index > 1000 then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select m.id, m.original_filename, m.created_at, e.title,
      e.deleted_at is null,
      case when o.id is null then 'missing'
        when (select private.media_object_matches(m)) then 'valid'
        else 'mismatch' end
    from public.media m
    join public.events e on e.id = m.event_id and e.space_id = m.space_id
    left join storage.objects o on o.bucket_id = 'family-media' and o.name = m.storage_path
    where m.space_id = target_space and m.media_type = 'photo'
      and m.upload_status = 'pending' and m.deleted_at is null
    order by m.created_at desc, m.id desc
    limit 25 offset page_index * 24;
end;
$$;
revoke all on function public.list_pending_photo_uploads(uuid, integer) from public, anon;
grant execute on function public.list_pending_photo_uploads(uuid, integer) to authenticated;

-- A matching, fully stored object can be confirmed after the author's response was lost.
create function public.confirm_pending_photo_upload(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare photo public.media%rowtype;
begin
  if (select auth.uid()) is null then return false; end if;
  select * into photo from public.media where id = target_id for update;
  if not found or not (select private.is_admin(photo.space_id))
     or photo.media_type <> 'photo' or photo.upload_status <> 'pending'
     or photo.deleted_at is not null
     or not (select private.active_event_in_space(photo.event_id, photo.space_id))
     or not (select private.media_object_matches(photo)) then
    return false;
  end if;
  update public.media set upload_status = 'ready' where id = photo.id;
  return true;
end;
$$;
revoke all on function public.confirm_pending_photo_upload(uuid) from public, anon;
grant execute on function public.confirm_pending_photo_upload(uuid) to authenticated;
