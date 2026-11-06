-- Even direct callers must not use this helper as a cross-space existence oracle.
create or replace function private.active_event_in_space(target_event uuid, target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.is_member(target_space)) and exists (
    select 1 from public.events
    where id = target_event and space_id = target_space and deleted_at is null
  );
$$;
