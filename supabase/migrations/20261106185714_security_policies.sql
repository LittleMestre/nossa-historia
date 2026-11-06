-- Helpers não expostos pela Data API. SECURITY DEFINER rompe a recursão de RLS.
create function private.member_role(target_space uuid)
returns public.space_role language sql stable security definer set search_path = '' as $$
  select role from public.space_members
  where space_id = target_space and user_id = (select auth.uid())
  limit 1;
$$;

create function private.is_member(target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.member_role(target_space)) is not null;
$$;

create function private.is_admin(target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.member_role(target_space)) = 'admin';
$$;

create function private.can_contribute(target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.member_role(target_space)) in ('admin', 'contributor');
$$;

create function private.shares_space(other_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_members mine
    join public.space_members theirs on theirs.space_id = mine.space_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other_user
  );
$$;

create function private.active_event_in_space(target_event uuid, target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events
    where id = target_event and space_id = target_space and deleted_at is null
  );
$$;

create function private.can_edit_event(target_event uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e
    where e.id = target_event and e.deleted_at is null
      and (select private.can_contribute(e.space_id))
      and (e.created_by = (select auth.uid()) or (select private.is_admin(e.space_id)))
  );
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.member_role(uuid), private.is_member(uuid),
  private.is_admin(uuid), private.can_contribute(uuid), private.shares_space(uuid),
  private.active_event_in_space(uuid, uuid), private.can_edit_event(uuid)
  to authenticated;

create function private.guard_member_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then return new; end if;
  if current_actor is not null and old.user_id = current_actor then
    raise exception 'cannot change your own membership' using errcode = '42501';
  end if;
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin') then
    -- Serialize concurrent removals to preserve at least one administrator.
    perform 1 from public.spaces where id = old.space_id for update;
    if (select count(*) from public.space_members where space_id = old.space_id and role = 'admin') <= 1 then
      raise exception 'cannot remove the last administrator' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function private.guard_invitation_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.email := lower(btrim(new.email));
    return new;
  end if;
  if (select auth.uid()) is not null and not (old.status = 'pending' and new.status = 'revoked') then
    raise exception 'only pending invitations may be revoked by a member' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function private.guard_soft_delete()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := now();
    new.deleted_by := (select auth.uid());
  elsif old.deleted_at is not null and new.deleted_at is null then
    if not (select private.is_admin(old.space_id)) then
      raise exception 'only an administrator may restore content' using errcode = '42501';
    end if;
    new.deleted_by := null;
  elsif old.deleted_at is distinct from new.deleted_at then
    raise exception 'deletion timestamp cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function private.audit_admin_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid());
declare owner_id uuid;
begin
  owner_id := ((to_jsonb(old) ->> tg_argv[0])::uuid);
  if actor is not null and actor is distinct from owner_id
     and (select private.is_admin(old.space_id)) then
    insert into public.audit_logs(space_id, actor_id, action, entity_type, entity_id, metadata)
    values (old.space_id, actor, 'moderate_update', tg_table_name, old.id,
      jsonb_build_object('operation', 'UPDATE'));
  end if;
  return new;
end;
$$;

create function private.audit_administration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid());
declare changed record;
begin
  if actor is null then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then changed := old; else changed := new; end if;
  insert into public.audit_logs(space_id, actor_id, action, entity_type, entity_id, metadata)
  values (changed.space_id, actor, lower(tg_op), tg_table_name, changed.id,
    case when tg_table_name = 'space_members' and tg_op = 'UPDATE'
      then jsonb_build_object('old_role', old.role, 'new_role', new.role)
      else jsonb_build_object('operation', tg_op) end);
  return coalesce(new, old);
end;
$$;

create trigger members_guard before insert or update or delete on public.space_members
for each row execute function private.guard_member_change();
create trigger invitations_guard before insert or update on public.invitations
for each row execute function private.guard_invitation_status();
create trigger events_soft_delete before update on public.events for each row execute function private.guard_soft_delete();
create trigger media_soft_delete before update on public.media for each row execute function private.guard_soft_delete();
create trigger comments_soft_delete before update on public.comments for each row execute function private.guard_soft_delete();
create trigger memories_soft_delete before update on public.memories for each row execute function private.guard_soft_delete();
create trigger members_audit after insert or update or delete on public.space_members for each row execute function private.audit_administration();
create trigger invitations_audit after insert or update on public.invitations for each row execute function private.audit_administration();
create trigger events_admin_audit after update on public.events for each row execute function private.audit_admin_update('created_by');
create trigger media_admin_audit after update on public.media for each row execute function private.audit_admin_update('uploaded_by');
create trigger comments_admin_audit after update on public.comments for each row execute function private.audit_admin_update('user_id');
create trigger memories_admin_audit after update on public.memories for each row execute function private.audit_admin_update('created_by');
create trigger people_admin_audit after update on public.people for each row execute function private.audit_admin_update('created_by');
create trigger categories_admin_audit after update on public.categories for each row execute function private.audit_admin_update('created_by');
create trigger locations_admin_audit after update on public.locations for each row execute function private.audit_admin_update('created_by');

-- As grants limitam colunas e operações; RLS limita linhas. Sem DELETE físico de conteúdo.
revoke all on public.profiles, public.spaces, public.space_members, public.invitations,
  public.categories, public.locations, public.people, public.events,
  public.event_participants, public.media, public.comments, public.memories,
  public.audit_logs from public, anon, authenticated;

grant select, insert on public.profiles to authenticated;
grant update (display_name, avatar_storage_path) on public.profiles to authenticated;
grant select, insert on public.spaces to authenticated;
grant update (name, description) on public.spaces to authenticated;
grant select, insert, delete on public.space_members to authenticated;
grant update (role) on public.space_members to authenticated;
grant select (id, space_id, email, role, invited_by, status, expires_at, accepted_at, accepted_by, created_at)
  on public.invitations to authenticated;
grant insert (space_id, email, role, token_hash, invited_by, expires_at) on public.invitations to authenticated;
grant update (status) on public.invitations to authenticated;
grant select, insert on public.categories, public.locations, public.people to authenticated;
grant update (name, icon) on public.categories to authenticated;
grant update (name, city, state, country, latitude, longitude) on public.locations to authenticated;
grant update (name, nickname, description, avatar_storage_path) on public.people to authenticated;
grant select, insert on public.events to authenticated;
grant update (title, description, moment_type, timeline_position, date_precision,
  start_year, start_month, start_day, end_year, end_month, end_day,
  approximate_date_label, location_id, category_id, parent_event_id, deleted_at)
  on public.events to authenticated;
grant select, insert, delete on public.event_participants to authenticated;
grant select, insert on public.media to authenticated;
grant update (description, taken_at, deleted_at) on public.media to authenticated;
grant select, insert on public.comments to authenticated;
grant update (content, deleted_at) on public.comments to authenticated;
grant select, insert on public.memories to authenticated;
grant update (content, deleted_at) on public.memories to authenticated;
grant select on public.audit_logs to authenticated;

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.invitations enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.people enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.media enable row level security;
alter table public.comments enable row level security;
alter table public.memories enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.shares_space(id)));
create policy profiles_create on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_edit on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy spaces_read on public.spaces for select to authenticated
using ((select private.is_member(id)));
create policy spaces_create on public.spaces for insert to authenticated
with check (created_by = (select auth.uid()));
create policy spaces_edit on public.spaces for update to authenticated
using ((select private.is_admin(id))) with check ((select private.is_admin(id)));

create policy members_read on public.space_members for select to authenticated
using ((select private.is_member(space_id)));
create policy members_add on public.space_members for insert to authenticated
with check ((select private.is_admin(space_id)));
create policy members_edit on public.space_members for update to authenticated
using ((select private.is_admin(space_id)) and user_id <> (select auth.uid()))
with check ((select private.is_admin(space_id)) and user_id <> (select auth.uid()));
create policy members_remove on public.space_members for delete to authenticated
using ((select private.is_admin(space_id)) and user_id <> (select auth.uid()));

create policy invitations_read on public.invitations for select to authenticated
using ((select private.is_admin(space_id)));
create policy invitations_add on public.invitations for insert to authenticated
with check ((select private.is_admin(space_id)) and invited_by = (select auth.uid())
  and status = 'pending' and accepted_at is null and accepted_by is null);
create policy invitations_revoke on public.invitations for update to authenticated
using ((select private.is_admin(space_id)) and status = 'pending')
with check ((select private.is_admin(space_id)) and status = 'revoked');

create policy categories_read on public.categories for select to authenticated
using ((select private.is_member(space_id)));
create policy categories_add on public.categories for insert to authenticated
with check ((select private.can_contribute(space_id)) and created_by = (select auth.uid()));
create policy categories_edit on public.categories for update to authenticated
using ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))));

create policy locations_read on public.locations for select to authenticated
using ((select private.is_member(space_id)));
create policy locations_add on public.locations for insert to authenticated
with check ((select private.can_contribute(space_id)) and created_by = (select auth.uid()));
create policy locations_edit on public.locations for update to authenticated
using ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))));

create policy people_read on public.people for select to authenticated
using ((select private.is_member(space_id)));
create policy people_add on public.people for insert to authenticated
with check ((select private.can_contribute(space_id)) and created_by = (select auth.uid()));
create policy people_edit on public.people for update to authenticated
using ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))));

create policy events_read on public.events for select to authenticated
using ((select private.is_member(space_id)) and (deleted_at is null or (select private.is_admin(space_id))));
create policy events_add on public.events for insert to authenticated
with check ((select private.can_contribute(space_id)) and created_by = (select auth.uid())
  and deleted_at is null and deleted_by is null);
create policy events_edit on public.events for update to authenticated
using ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id)))
  and (deleted_at is null or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))));

create policy event_participants_read on public.event_participants for select to authenticated
using ((select private.is_member(space_id)) and (select private.active_event_in_space(event_id, space_id)));
create policy event_participants_add on public.event_participants for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.can_edit_event(event_id)));
create policy event_participants_remove on public.event_participants for delete to authenticated
using ((select private.can_edit_event(event_id)));

create policy media_read on public.media for select to authenticated
using ((select private.is_member(space_id)) and (deleted_at is null or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));
create policy media_add on public.media for insert to authenticated
with check ((select private.can_contribute(space_id)) and uploaded_by = (select auth.uid())
  and deleted_at is null and deleted_by is null
  and (select private.active_event_in_space(event_id, space_id)));
create policy media_edit on public.media for update to authenticated
using ((select private.can_contribute(space_id)) and (uploaded_by = (select auth.uid()) or (select private.is_admin(space_id)))
  and (deleted_at is null or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (uploaded_by = (select auth.uid()) or (select private.is_admin(space_id))));

create policy comments_read on public.comments for select to authenticated
using ((select private.is_member(space_id)) and (deleted_at is null or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));
create policy comments_add on public.comments for insert to authenticated
with check ((select private.can_contribute(space_id)) and user_id = (select auth.uid())
  and deleted_at is null and deleted_by is null
  and (select private.active_event_in_space(event_id, space_id)));
create policy comments_edit on public.comments for update to authenticated
using ((select private.can_contribute(space_id)) and (user_id = (select auth.uid()) or (select private.is_admin(space_id)))
  and (deleted_at is null or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (user_id = (select auth.uid()) or (select private.is_admin(space_id))));

create policy memories_read on public.memories for select to authenticated
using ((select private.is_member(space_id)) and (deleted_at is null or (select private.is_admin(space_id)))
  and (select private.active_event_in_space(event_id, space_id)));
create policy memories_add on public.memories for insert to authenticated
with check ((select private.can_contribute(space_id)) and created_by = (select auth.uid())
  and deleted_at is null and deleted_by is null
  and (select private.active_event_in_space(event_id, space_id)));
create policy memories_edit on public.memories for update to authenticated
using ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id)))
  and (deleted_at is null or (select private.is_admin(space_id))))
with check ((select private.can_contribute(space_id)) and (created_by = (select auth.uid()) or (select private.is_admin(space_id))));

create policy audit_logs_read on public.audit_logs for select to authenticated
using ((select private.is_admin(space_id)));
