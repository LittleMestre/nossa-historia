-- Require the caller's selected space as well as administrator membership.
drop function public.confirm_pending_photo_upload(uuid);
create function public.confirm_pending_photo_upload(target_id uuid, target_space uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare photo public.media%rowtype;
begin
  if (select auth.uid()) is null or target_space is null
     or not (select private.is_admin(target_space)) then return false; end if;
  select * into photo from public.media where id = target_id and space_id = target_space for update;
  if not found or photo.media_type <> 'photo' or photo.upload_status <> 'pending'
     or photo.deleted_at is not null
     or not (select private.active_event_in_space(photo.event_id, photo.space_id))
     or not (select private.media_object_matches(photo)) then
    return false;
  end if;
  update public.media set upload_status = 'ready' where id = photo.id;
  return true;
end;
$$;
revoke all on function public.confirm_pending_photo_upload(uuid, uuid) from public, anon;
grant execute on function public.confirm_pending_photo_upload(uuid, uuid) to authenticated;
