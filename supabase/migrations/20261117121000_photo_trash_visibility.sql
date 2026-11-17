-- Admins may inventory deleted photo metadata even when its event was deleted.
-- Storage read remains unchanged: deleted photos never receive new signed URLs.
drop policy media_read on public.media;
create policy media_read on public.media for select to authenticated
using ((select private.is_member(space_id))
  and (upload_status = 'ready' or (upload_status = 'pending' and uploaded_by = (select auth.uid())))
  and (deleted_at is null or (select private.is_admin(space_id)))
  and ((select private.active_event_in_space(event_id, space_id))
    or (deleted_at is not null and (select private.is_admin(space_id)))));
