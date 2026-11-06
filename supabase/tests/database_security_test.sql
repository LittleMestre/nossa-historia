begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- Identidades e famílias inteiramente fictícias; tudo é revertido ao final.
insert into auth.users(id, email) values
  ('00000000-0000-4000-8000-000000000001', 'ana@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'bia@example.test'),
  ('00000000-0000-4000-8000-000000000003', 'caio@example.test'),
  ('00000000-0000-4000-8000-000000000004', 'dora@example.test'),
  ('00000000-0000-4000-8000-000000000005', 'eli@example.test');

insert into public.profiles(id, display_name) values
  ('00000000-0000-4000-8000-000000000001', 'Ana Teste'),
  ('00000000-0000-4000-8000-000000000002', 'Bia Teste'),
  ('00000000-0000-4000-8000-000000000003', 'Caio Teste'),
  ('00000000-0000-4000-8000-000000000004', 'Dora Teste'),
  ('00000000-0000-4000-8000-000000000005', 'Eli Teste');

insert into public.spaces(id, name, created_by) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Família A', '00000000-0000-4000-8000-000000000001'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Família B', '00000000-0000-4000-8000-000000000004');
insert into public.space_members(space_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'contributor'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'viewer');

insert into public.categories(id, space_id, name, created_by) values
  ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Reunião', '00000000-0000-4000-8000-000000000001'),
  ('cccccccc-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'Viagem', '00000000-0000-4000-8000-000000000004');
insert into public.locations(id, space_id, name, created_by) values
  ('11111111-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Casa fictícia A', '00000000-0000-4000-8000-000000000001'),
  ('11111111-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'Casa fictícia B', '00000000-0000-4000-8000-000000000004');
insert into public.people(id, space_id, name, created_by) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Pessoa fictícia A', '00000000-0000-4000-8000-000000000001'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'Pessoa fictícia B', '00000000-0000-4000-8000-000000000004');

insert into public.events(id, space_id, title, created_by, date_precision, start_year, category_id, location_id) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Evento de Ana', '00000000-0000-4000-8000-000000000001', 'year', 2018, 'cccccccc-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Evento de Bia', '00000000-0000-4000-8000-000000000002', 'unknown', null, null, null),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000002', 'Evento de Dora', '00000000-0000-4000-8000-000000000004', 'year', 2024, 'cccccccc-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002');
insert into public.events(id, space_id, parent_event_id, title, created_by, date_precision, start_year, start_month) values
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Subevento de Bia', '00000000-0000-4000-8000-000000000002', 'month', 2018, 7);

insert into public.event_participants(space_id, event_id, person_id, created_by) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001');
insert into public.media(id, space_id, event_id, uploaded_by, storage_path, media_type, mime_type, file_size_bytes, original_filename) values
  ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001/bbbbbbbb-0000-4000-8000-000000000001/dddddddd-0000-4000-8000-000000000001/original.jpg', 'photo', 'image/jpeg', 1000, 'ficticia.jpg');
insert into public.comments(id, space_id, event_id, user_id, content) values
  ('ffffffff-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Comentário fictício');
insert into public.memories(id, space_id, event_id, created_by, content) values
  ('99999999-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Memória fictícia');

select has_table('public', 'profiles', 'Perfis existem');
select has_table('public', 'spaces', 'Espaços existem');
select has_table('public', 'space_members', 'Membros existem');
select has_table('public', 'invitations', 'Convites existem');
select has_table('public', 'categories', 'Categorias existem');
select has_table('public', 'locations', 'Locais existem');
select has_table('public', 'people', 'Pessoas existem');
select has_table('public', 'events', 'Eventos existem');
select has_table('public', 'event_participants', 'Participantes de evento existem');
select has_table('public', 'media', 'Mídias existem');
select has_table('public', 'comments', 'Comentários existem');
select has_table('public', 'memories', 'Memórias existem');
select has_table('public', 'audit_logs', 'Auditoria existe');
select ok((select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('profiles','spaces','space_members','invitations','categories','locations','people','events','event_participants','media','comments','memories','audit_logs')), 'RLS ativo nas 13 tabelas privadas');
select is((select count(*)::integer from public.space_members where role = 'admin'), 2, 'Criadores viram administradores automaticamente');
select ok(not has_table_privilege('anon', 'public.events', 'select'), 'Anônimo sem acesso a eventos');
select ok(not has_table_privilege('authenticated', 'public.invitations', 'delete'), 'Convites sem exclusão física');
select ok(not has_column_privilege('authenticated', 'public.invitations', 'token_hash', 'select'), 'Hash de convite não é legível');
select ok(not has_column_privilege('authenticated', 'public.events', 'created_by', 'update'), 'Autor do evento não pode ser alterado');
select ok(not has_column_privilege('authenticated', 'public.events', 'created_at', 'insert'), 'Data de cadastro não pode ser forjada');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'insert'), 'Cliente não escreve auditoria');
select is((select start_month from public.events where id = 'bbbbbbbb-0000-4000-8000-000000000001'), null::smallint, 'Ano isolado não ganha mês fictício');
select is((select start_day from public.events where id = 'bbbbbbbb-0000-4000-8000-000000000004'), null::smallint, 'Mês isolado não ganha dia fictício');
select throws_ok($$insert into public.events(space_id, title, created_by, date_precision, start_year, start_month, start_day)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'Dia inválido', '00000000-0000-4000-8000-000000000001', 'day', 2024, 2, 30)$$,
  '23514', null, 'Data impossível bloqueada');
select throws_ok($$insert into public.event_participants(space_id, event_id, person_id, created_by)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001')$$,
  '23503', null, 'Pessoa de outra família não pode ser vinculada');
select throws_ok($$insert into public.events(space_id, parent_event_id, title, created_by)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003', 'Subevento cruzado', '00000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'Subevento de outra família bloqueado');
select throws_ok($$insert into public.events(space_id, parent_event_id, title, created_by)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000004', 'Terceiro nível', '00000000-0000-4000-8000-000000000001')$$,
  '23514', null, 'Hierarquia limita subeventos a um nível');

set local role anon;
select throws_ok('select * from public.events', '42501', null, 'Anônimo não consegue ler tabela privada');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.events), 3, 'Colaboradora lê somente os três eventos da família A');
select is((select count(*)::integer from public.profiles), 3, 'Perfil de outra família permanece invisível');
select is((select count(*)::integer from public.media), 1, 'Mídia da família é visível');
select ok(private.active_event_in_space('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001'),
  'Função de evento ativo aceita membro da mesma família');
select is_empty($$update public.events set title = 'Tentativa indevida' where id = 'bbbbbbbb-0000-4000-8000-000000000001' returning id$$, 'Colaboradora não edita evento de Ana');
select results_eq($$update public.events set title = 'Evento de Bia editado' where id = 'bbbbbbbb-0000-4000-8000-000000000002' returning id$$,
  array['bbbbbbbb-0000-4000-8000-000000000002'::uuid], 'Colaboradora edita evento próprio');
select throws_ok($$insert into public.events(space_id, title, created_by)
  values ('aaaaaaaa-0000-4000-8000-000000000002', 'Invasão', '00000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'Colaboradora não cria evento em outra família');
select throws_ok($$insert into public.events(space_id, title, created_by)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'Autoria falsa', '00000000-0000-4000-8000-000000000001')$$,
  '42501', null, 'Colaboradora não atribui a outro usuário um evento novo');
select is_empty($$update public.space_members set role = 'admin' where user_id = '00000000-0000-4000-8000-000000000002' returning id$$,
  'Colaboradora não promove o próprio papel');
select throws_ok($$insert into public.invitations(space_id, email, role, token_hash, invited_by, expires_at)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'x@example.test', 'viewer', repeat('a',64), '00000000-0000-4000-8000-000000000002', now() + interval '1 day')$$,
  '42501', null, 'Colaboradora não cria convites');
select results_eq($$insert into public.memories(space_id, event_id, created_by, content)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Lembrança adicional') returning content$$,
  array['Lembrança adicional'::text], 'Colaboradora acrescenta memória sem editar evento alheio');
select results_eq($$insert into public.media(id, space_id, event_id, uploaded_by, storage_path, media_type, mime_type, file_size_bytes, original_filename)
  values ('dddddddd-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001/bbbbbbbb-0000-4000-8000-000000000001/dddddddd-0000-4000-8000-000000000002/original.jpg', 'photo', 'image/jpeg', 1000, 'ficticia-2.jpg') returning id$$,
  array['dddddddd-0000-4000-8000-000000000002'::uuid], 'Colaboradora adiciona mídia em evento alheio');
select is_empty($$update public.media set description = 'Alteração indevida' where id = 'dddddddd-0000-4000-8000-000000000001' returning id$$,
  'Colaboradora não altera mídia de Ana');
select lives_ok($$update public.memories set deleted_at = now() where id = '99999999-0000-4000-8000-000000000001'$$,
  'Autora pode solicitar remoção lógica da própria memória');
reset role;
select ok((select deleted_at is not null and deleted_by = '00000000-0000-4000-8000-000000000002' from public.memories where id = '99999999-0000-4000-8000-000000000001'),
  'Remoção lógica foi realmente gravada com autoria');
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.memories where id = '99999999-0000-4000-8000-000000000001'), 1,
  'Autora mantém acesso para recuperação de memória removida');
select throws_ok($$insert into public.event_participants(space_id, event_id, person_id, created_by)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'eeeeeeee-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002')$$,
  '23503', null, 'FK composta bloqueia pessoa de outra família mesmo com autora válida');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';
select is((select count(*)::integer from public.events), 3, 'Visualizador lê eventos da sua família');
select is((select count(*)::integer from public.memories where id = '99999999-0000-4000-8000-000000000001'), 0,
  'Memória removida fica invisível a outro membro');
select is_empty($$update public.events set title = 'Tentativa de visualizador' where id = 'bbbbbbbb-0000-4000-8000-000000000001' returning id$$,
  'Visualizador não edita eventos');
select throws_ok($$insert into public.comments(space_id, event_id, user_id, content)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'Não permitido')$$,
  '42501', null, 'Visualizador não comenta');
select throws_ok($$insert into public.media(id, space_id, event_id, uploaded_by, storage_path, media_type, mime_type, file_size_bytes, original_filename)
  values ('dddddddd-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001/bbbbbbbb-0000-4000-8000-000000000001/dddddddd-0000-4000-8000-000000000003/original.jpg', 'photo', 'image/jpeg', 1000, 'ficticia-3.jpg')$$,
  '42501', null, 'Visualizador não envia mídia');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';
select is((select count(*)::integer from public.events), 1, 'Administradora B não lê eventos da família A');
select is((select count(*)::integer from public.people), 1, 'Administradora B não lê pessoas da família A');
select is((select count(*)::integer from public.media), 0, 'Administradora B não lê mídias da família A');
select ok(not private.active_event_in_space('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001'),
  'Função auxiliar não revela evento de outra família');
select is_empty($$update public.events set title = 'Ataque cruzado' where id = 'bbbbbbbb-0000-4000-8000-000000000001' returning id$$,
  'Administradora B não edita evento da família A');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000005';
select is((select count(*)::integer from public.spaces), 0, 'Usuário sem espaço não lê famílias');
select is((select count(*)::integer from public.events), 0, 'Usuário sem espaço não lê eventos');
select lives_ok($$insert into public.spaces(name, created_by)
  values ('Família de Eli', '00000000-0000-4000-8000-000000000005')$$,
  'Usuário autenticado pode criar seu espaço privado');
select is((select count(*)::integer from public.space_members where user_id = '00000000-0000-4000-8000-000000000005' and role = 'admin'), 1,
  'Criador recebe papel de administrador sem política recursiva');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
select results_eq($$update public.events set title = 'Correção moderada' where id = 'bbbbbbbb-0000-4000-8000-000000000002' returning id$$,
  array['bbbbbbbb-0000-4000-8000-000000000002'::uuid], 'Administradora modera evento alheio no próprio espaço');
select results_eq($$update public.memories set deleted_at = null where id = '99999999-0000-4000-8000-000000000001' returning id$$,
  array['99999999-0000-4000-8000-000000000001'::uuid], 'Administradora recupera memória removida');
select is((select count(*)::integer from public.audit_logs where action = 'moderate_update' and entity_id = 'bbbbbbbb-0000-4000-8000-000000000002'), 1,
  'Moderação registra auditoria');
select results_eq($$insert into public.invitations(space_id, email, role, token_hash, invited_by, expires_at)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'convidado@example.test', 'viewer', repeat('b',64), '00000000-0000-4000-8000-000000000001', now() + interval '1 day') returning email$$,
  array['convidado@example.test'::text], 'Administradora cria convite');
select throws_ok('select token_hash from public.invitations', '42501', null,
  'Nem administradora lê hash de convite pelo cliente');
select results_eq($$update public.invitations set status = 'revoked' where email = 'convidado@example.test' returning status$$,
  array['revoked'::public.invitation_status], 'Administradora revoga convite');
select is_empty($$update public.space_members set role = 'viewer' where user_id = '00000000-0000-4000-8000-000000000001' returning id$$,
  'Administradora não altera o próprio papel');
select results_eq($$update public.space_members set role = 'viewer' where user_id = '00000000-0000-4000-8000-000000000002' returning role$$,
  array['viewer'::public.space_role], 'Administradora altera papel de outra pessoa');
select is((select count(*)::integer from public.audit_logs where entity_type = 'space_members' and action = 'update'), 1,
  'Mudança de papel registra auditoria');
reset role;

select * from finish();
rollback;
