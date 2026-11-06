-- Nossa História: domínio privado. Nenhuma tabela é usada pelo frontend nesta etapa.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.space_role as enum ('admin', 'contributor', 'viewer');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.moment_type as enum ('family', 'individual', 'other');
create type public.timeline_position as enum ('above', 'below', 'auto');
create type public.date_precision as enum ('day', 'month', 'year', 'range', 'unknown');
create type public.media_kind as enum ('photo', 'video');

-- No campo desconhecido ou parcial não existe um dia fictício armazenado.
create function private.valid_date_parts(y smallint, m smallint, d smallint)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if y is null then return m is null and d is null; end if;
  if y < 1000 or y > 9999 then return false; end if;
  if m is null then return d is null; end if;
  if m < 1 or m > 12 then return false; end if;
  if d is null then return true; end if;
  if d < 1 or d > 31 then return false; end if;
  perform pg_catalog.make_date(y, m, d);
  return true;
exception when datetime_field_overflow then
  return false;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(btrim(display_name)) between 1 and 120),
  avatar_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role public.space_role not null,
  joined_at timestamptz not null default now(),
  unique (space_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  email text not null check (length(email) between 3 and 320 and email like '%@%'),
  role public.space_role not null,
  -- SHA-256 hexadecimal. A coluna não recebe GRANT SELECT para clientes.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid not null references auth.users(id) on delete restrict,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((status = 'accepted') = (accepted_at is not null and accepted_by is not null))
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 80),
  icon text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  city text,
  state text,
  country text,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 160),
  nickname text,
  description text,
  avatar_storage_path text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  parent_event_id uuid,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text,
  moment_type public.moment_type not null default 'other',
  timeline_position public.timeline_position not null default 'auto',
  date_precision public.date_precision not null default 'unknown',
  start_year smallint,
  start_month smallint,
  start_day smallint,
  end_year smallint,
  end_month smallint,
  end_day smallint,
  approximate_date_label text,
  location_id uuid,
  category_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete restrict,
  unique (space_id, id),
  foreign key (space_id, parent_event_id) references public.events(space_id, id) on delete restrict,
  foreign key (space_id, location_id) references public.locations(space_id, id) on delete restrict,
  foreign key (space_id, category_id) references public.categories(space_id, id) on delete restrict,
  check (parent_event_id is distinct from id),
  check (private.valid_date_parts(start_year, start_month, start_day)),
  check (private.valid_date_parts(end_year, end_month, end_day)),
  check (
    (date_precision = 'unknown' and start_year is null and end_year is null)
    or (date_precision = 'year' and start_year is not null and start_month is null and end_year is null)
    or (date_precision = 'month' and start_year is not null and start_month is not null and start_day is null and end_year is null)
    or (date_precision = 'day' and start_year is not null and start_month is not null and start_day is not null and end_year is null)
    or (date_precision = 'range' and start_year is not null and end_year is not null
        and (start_year * 10000 + coalesce(start_month, 1) * 100 + coalesce(start_day, 1))
            <= (end_year * 10000 + coalesce(end_month, 12) * 100 + coalesce(end_day, 31)))
  ),
  check ((deleted_at is null) = (deleted_by is null))
);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  event_id uuid not null,
  person_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (space_id, event_id) references public.events(space_id, id) on delete restrict,
  foreign key (space_id, person_id) references public.people(space_id, id) on delete restrict,
  unique (event_id, person_id)
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  event_id uuid not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  storage_path text not null unique,
  media_type public.media_kind not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes between 1 and 52428800),
  original_filename text not null check (length(original_filename) between 1 and 255),
  description text,
  taken_at timestamptz,
  width integer check (width > 0),
  height integer check (height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete restrict,
  foreign key (space_id, event_id) references public.events(space_id, id) on delete restrict,
  check (storage_path like space_id::text || '/' || event_id::text || '/' || id::text || '/%'),
  check (
    (media_type = 'photo' and mime_type in ('image/jpeg', 'image/png', 'image/webp'))
    or (media_type = 'video' and mime_type in ('video/mp4', 'video/webm', 'video/quicktime'))
  ),
  check ((deleted_at is null) = (deleted_by is null))
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  event_id uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  content text not null check (length(btrim(content)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete restrict,
  foreign key (space_id, event_id) references public.events(space_id, id) on delete restrict,
  check ((deleted_at is null) = (deleted_by is null))
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  event_id uuid not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  content text not null check (length(btrim(content)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete restrict,
  foreign key (space_id, event_id) references public.events(space_id, id) on delete restrict,
  check ((deleted_at is null) = (deleted_by is null))
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index space_members_user_idx on public.space_members(user_id, space_id);
create index space_members_role_idx on public.space_members(space_id, role);
create unique index invitations_pending_email_idx on public.invitations(space_id, lower(email)) where status = 'pending';
create index invitations_expiry_idx on public.invitations(expires_at) where status = 'pending';
create unique index categories_name_idx on public.categories(space_id, lower(name));
create unique index people_name_idx on public.people(space_id, lower(name));
create index locations_name_idx on public.locations(space_id, lower(name));
create index events_timeline_idx on public.events(space_id, start_year, start_month, start_day, id) where deleted_at is null;
create index events_created_idx on public.events(space_id, created_at desc, id) where deleted_at is null;
create index events_parent_idx on public.events(space_id, parent_event_id) where parent_event_id is not null;
create index events_author_idx on public.events(created_by, space_id);
create index events_category_idx on public.events(space_id, category_id) where deleted_at is null;
create index events_location_idx on public.events(space_id, location_id) where deleted_at is null;
create index event_participants_person_idx on public.event_participants(space_id, person_id, event_id);
create index event_participants_event_idx on public.event_participants(event_id);
create index media_event_idx on public.media(space_id, event_id, created_at desc) where deleted_at is null;
create index media_author_idx on public.media(uploaded_by, space_id);
create index comments_event_idx on public.comments(space_id, event_id, created_at) where deleted_at is null;
create index memories_event_idx on public.memories(space_id, event_id, created_at) where deleted_at is null;
create index audit_logs_space_idx on public.audit_logs(space_id, created_at desc);

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.guard_immutable_columns()
returns trigger language plpgsql set search_path = '' as $$
declare column_name text;
begin
  foreach column_name in array tg_argv loop
    if (to_jsonb(new) -> column_name) is distinct from (to_jsonb(old) -> column_name) then
      raise exception 'immutable column: %', column_name using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

create function private.validate_event_parent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_event_id is not null and not exists (
    select 1 from public.events parent
    where parent.space_id = new.space_id and parent.id = new.parent_event_id
      and parent.parent_event_id is null and parent.deleted_at is null
  ) then
    raise exception 'subevent parent must be an active root event' using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.bootstrap_space_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.space_members(space_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger spaces_bootstrap_admin after insert on public.spaces
for each row execute function private.bootstrap_space_admin();
create trigger events_validate_parent before insert or update of parent_event_id, space_id on public.events
for each row execute function private.validate_event_parent();

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger spaces_updated_at before update on public.spaces for each row execute function private.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function private.set_updated_at();
create trigger locations_updated_at before update on public.locations for each row execute function private.set_updated_at();
create trigger people_updated_at before update on public.people for each row execute function private.set_updated_at();
create trigger events_updated_at before update on public.events for each row execute function private.set_updated_at();
create trigger media_updated_at before update on public.media for each row execute function private.set_updated_at();
create trigger comments_updated_at before update on public.comments for each row execute function private.set_updated_at();
create trigger memories_updated_at before update on public.memories for each row execute function private.set_updated_at();

create trigger profiles_immutable before update on public.profiles for each row execute function private.guard_immutable_columns('id', 'created_at');
create trigger spaces_immutable before update on public.spaces for each row execute function private.guard_immutable_columns('id', 'created_by', 'created_at');
create trigger members_immutable before update on public.space_members for each row execute function private.guard_immutable_columns('id', 'space_id', 'user_id', 'joined_at');
create trigger invitations_immutable before update on public.invitations for each row execute function private.guard_immutable_columns('id', 'space_id', 'email', 'role', 'token_hash', 'invited_by', 'created_at');
create trigger categories_immutable before update on public.categories for each row execute function private.guard_immutable_columns('id', 'space_id', 'created_by', 'created_at');
create trigger locations_immutable before update on public.locations for each row execute function private.guard_immutable_columns('id', 'space_id', 'created_by', 'created_at');
create trigger people_immutable before update on public.people for each row execute function private.guard_immutable_columns('id', 'space_id', 'created_by', 'created_at');
create trigger events_immutable before update on public.events for each row execute function private.guard_immutable_columns('id', 'space_id', 'created_by', 'created_at');
create trigger event_participants_immutable before update on public.event_participants for each row execute function private.guard_immutable_columns('id', 'space_id', 'event_id', 'person_id', 'created_by', 'created_at');
create trigger media_immutable before update on public.media for each row execute function private.guard_immutable_columns('id', 'space_id', 'event_id', 'uploaded_by', 'storage_path', 'created_at');
create trigger comments_immutable before update on public.comments for each row execute function private.guard_immutable_columns('id', 'space_id', 'event_id', 'user_id', 'created_at');
create trigger memories_immutable before update on public.memories for each row execute function private.guard_immutable_columns('id', 'space_id', 'event_id', 'created_by', 'created_at');
