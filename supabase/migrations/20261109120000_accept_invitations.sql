-- Acceptance runs in one database transaction and never returns the token hash.
create or replace function private.guard_invitation_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.email := lower(btrim(new.email));
    return new;
  end if;
  if (select auth.uid()) is not null and not (
    (old.status = 'pending' and new.status = 'revoked')
    or (current_user = 'postgres' and old.status = 'pending' and new.status = 'accepted'
      and new.accepted_by = (select auth.uid()) and new.accepted_at is not null)
  ) then
    raise exception 'invalid invitation transition' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function public.accept_invitation(invite_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  verified_email text;
  item public.invitations%rowtype;
begin
  if actor is null or invite_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid invitation' using errcode = '42501';
  end if;
  select lower(email) into verified_email from auth.users
  where id = actor and email_confirmed_at is not null;
  if verified_email is null then
    raise exception 'verified email required' using errcode = '42501';
  end if;
  select * into item from public.invitations
  where token_hash = encode(extensions.digest(invite_token, 'sha256'), 'hex')
  for update;
  if not found or lower(item.email) <> verified_email then
    raise exception 'invalid invitation' using errcode = '42501';
  end if;
  if item.status = 'accepted' then
    if item.accepted_by = actor then return item.space_id; end if;
    raise exception 'invitation already used' using errcode = '42501';
  end if;
  if item.status <> 'pending' or item.expires_at <= now() then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  insert into public.space_members(space_id, user_id, role)
  values (item.space_id, actor, item.role)
  on conflict (space_id, user_id) do nothing;
  -- An existing member keeps their original role.
  update public.invitations set status = 'accepted', accepted_at = now(), accepted_by = actor
  where id = item.id;
  return item.space_id;
end;
$$;
revoke all on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
