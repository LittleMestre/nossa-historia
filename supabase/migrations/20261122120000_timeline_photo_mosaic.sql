-- SECURITY INVOKER keeps media and events RLS active for every requested event.
create function public.timeline_mosaic_photos(target_event_ids uuid[])
returns table(event_id uuid, media_id uuid)
language sql stable security invoker
set search_path = ''
as $$
  select requested.id, photo.id
  from unnest(target_event_ids) as requested(id)
  join public.events event on event.id = requested.id
    and event.deleted_at is null
  cross join lateral (
    select media.id, media.created_at
    from public.media media
    where media.event_id = requested.id
      and media.space_id = event.space_id
      and media.media_type = 'photo'
      and media.upload_status = 'ready'
      and media.deleted_at is null
    order by media.created_at, media.id
    limit 4
  ) photo
  where (select auth.uid()) is not null
    and cardinality(target_event_ids) between 1 and 60
  order by requested.id, photo.created_at, photo.id;
$$;

revoke all on function public.timeline_mosaic_photos(uuid[]) from public, anon;
grant execute on function public.timeline_mosaic_photos(uuid[]) to authenticated;
