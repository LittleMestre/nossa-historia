-- PostgreSQL also checks SELECT visibility during UPDATE. Authors keep access
-- to their own soft-deleted rows, enabling deletion without a privileged RPC.
drop policy events_read on public.events;
create policy events_read on public.events for select to authenticated
using ((select private.is_member(space_id)) and
  (deleted_at is null or created_by = (select auth.uid()) or (select private.is_admin(space_id))));

drop policy media_read on public.media;
create policy media_read on public.media for select to authenticated
using ((select private.is_member(space_id)) and
  (deleted_at is null or uploaded_by = (select auth.uid()) or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));

drop policy comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated
using ((select private.is_member(space_id)) and
  (deleted_at is null or user_id = (select auth.uid()) or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));

drop policy memories_read on public.memories;
create policy memories_read on public.memories for select to authenticated
using ((select private.is_member(space_id)) and
  (deleted_at is null or created_by = (select auth.uid()) or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));
