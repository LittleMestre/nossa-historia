-- 4B: an object is visible only after its upload has been confirmed.
alter table public.media add column upload_status text not null default 'pending'
  check (upload_status in ('pending', 'ready'));

-- Preserve pre-existing objects if this migration is applied to a populated DB.
update public.media m set upload_status = 'ready'
where exists (select 1 from storage.objects o
              where o.bucket_id = 'family-media' and o.name = m.storage_path);

drop policy media_read on public.media;
create policy media_read on public.media for select to authenticated
using ((select private.is_member(space_id))
  and (upload_status = 'ready' or (upload_status = 'pending' and uploaded_by = (select auth.uid())))
  and (deleted_at is null or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));

create or replace function private.can_access_family_media(object_name text, for_upload boolean)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare parts text[];
declare target_space uuid;
declare target_event uuid;
declare target_media uuid;
begin
  if (select auth.uid()) is null then return false; end if;
  parts := regexp_match(object_name,
    '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([A-Za-z0-9][A-Za-z0-9._-]{0,254})$');
  if parts is null or parts[4] in ('.', '..') then return false; end if;
  target_space := parts[1]::uuid;
  target_event := parts[2]::uuid;
  target_media := parts[3]::uuid;
  return exists (
    select 1 from public.media m
    join public.events e on e.id = m.event_id and e.space_id = m.space_id
    where m.id = target_media and m.space_id = target_space
      and m.event_id = target_event and m.storage_path = object_name
      and m.media_type = 'photo' and m.deleted_at is null
      and e.deleted_at is null
      and (select private.is_member(target_space))
      and (for_upload or m.upload_status = 'ready')
      and (not for_upload or (
        m.upload_status = 'pending'
        and (select private.can_contribute(target_space))
        and m.uploaded_by = (select auth.uid())
      ))
  );
end;
$$;

-- Only this function can finalize an upload; clients cannot forge ready.
create function public.finalize_media_upload(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare record_row public.media%rowtype;
declare object_row storage.objects%rowtype;
begin
  select * into record_row from public.media where id = target_id for update;
  if not found or record_row.uploaded_by is distinct from (select auth.uid())
     or not (select private.can_contribute(record_row.space_id))
     or record_row.deleted_at is not null
     or not (select private.active_event_in_space(record_row.event_id, record_row.space_id)) then
    return false;
  end if;
  if record_row.upload_status = 'ready' then return true; end if;
  select * into object_row from storage.objects
  where bucket_id = 'family-media' and name = record_row.storage_path;
  if not found or object_row.metadata->>'mimetype' is distinct from record_row.mime_type
     or (object_row.metadata->>'size')::bigint is distinct from record_row.file_size_bytes then
    return false;
  end if;
  update public.media set upload_status = 'ready' where id = target_id;
  return true;
end;
$$;
revoke all on function public.finalize_media_upload(uuid) from public, anon;
grant execute on function public.finalize_media_upload(uuid) to authenticated;
