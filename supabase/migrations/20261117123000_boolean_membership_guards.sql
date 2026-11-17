-- PL/pgSQL IF conditions must receive false, never NULL, for nonmembers.
create or replace function private.is_admin(target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select private.member_role(target_space)) = 'admin', false);
$$;

create or replace function private.can_contribute(target_space uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select private.member_role(target_space)) in ('admin', 'contributor'), false);
$$;
