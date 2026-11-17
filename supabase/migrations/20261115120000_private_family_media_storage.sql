-- 4A: one private bucket, with access tied to a live media row and event.
-- The bucket is defined here only; do not also define it in config.toml.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-media', 'family-media', false, 20971520,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'family-media' and name = 'family-media' and public = false
      and file_size_limit = 20971520
      and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
  ) then
    raise exception 'family-media bucket exists with conflicting settings';
  end if;
end;
$$;

-- SECURITY DEFINER reads the media/event link without depending on media's
-- administrative soft-delete SELECT exception. Every permission is explicit.
create function private.can_access_family_media(object_name text, for_upload boolean)
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
      and (not for_upload or (
        (select private.can_contribute(target_space))
        and m.uploaded_by = (select auth.uid())
      ))
  );
end;
$$;

revoke all on function private.can_access_family_media(text, boolean) from public, anon;
grant execute on function private.can_access_family_media(text, boolean) to authenticated;

create policy family_media_read on storage.objects for select to authenticated
using (bucket_id = 'family-media' and
       (select private.can_access_family_media(name, false)));

create policy family_media_upload on storage.objects for insert to authenticated
with check (bucket_id = 'family-media' and
            (select private.can_access_family_media(name, true)));

-- No UPDATE or DELETE policy: clients cannot upsert, move, copy-overwrite,
-- replace or physically remove originals. 4D will handle audited cleanup.
