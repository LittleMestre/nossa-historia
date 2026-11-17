-- Read-only inventory for administrators. This never deletes Storage objects.
create function public.list_orphan_photo_objects(target_space uuid, page_index integer)
returns table(object_name text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not coalesce((select private.is_admin(target_space)), false)
     or page_index is null or page_index < 0 or page_index > 1000 then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select o.name, o.created_at
    from storage.objects o
    where o.bucket_id = 'family-media'
      and o.name like target_space::text || '/%'
      and not exists (select 1 from public.media m
        where m.space_id = target_space and m.storage_path = o.name)
    order by o.created_at desc, o.id desc
    limit 25 offset page_index * 24;
end;
$$;
revoke all on function public.list_orphan_photo_objects(uuid, integer) from public, anon;
grant execute on function public.list_orphan_photo_objects(uuid, integer) to authenticated;
