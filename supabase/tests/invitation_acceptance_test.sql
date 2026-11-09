begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();
insert into auth.users(id, email, email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000001','owner-a@example.test',now()),
 ('10000000-0000-4000-8000-000000000002','guest-a@example.test',now()),
 ('10000000-0000-4000-8000-000000000003','owner-b@example.test',now()),
 ('10000000-0000-4000-8000-000000000004','wrong@example.test',now()),
 ('10000000-0000-4000-8000-000000000005','unverified@example.test',null);
insert into public.spaces(id,name,created_by) values
 ('10000000-0000-4000-8000-100000000001','Fictícia A','10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-100000000002','Fictícia B','10000000-0000-4000-8000-000000000003');
insert into public.invitations(space_id,email,role,token_hash,invited_by,created_at,expires_at) values
 ('10000000-0000-4000-8000-100000000001','guest-a@example.test','viewer',encode(extensions.digest(repeat('a',64),'sha256'),'hex'),'10000000-0000-4000-8000-000000000001',now(),now()+interval '1 day'),
 ('10000000-0000-4000-8000-100000000001','other@example.test','viewer',encode(extensions.digest(repeat('b',64),'sha256'),'hex'),'10000000-0000-4000-8000-000000000001',now()-interval '2 days',now()-interval '1 minute');
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000004';
select throws_ok($$select public.accept_invitation(repeat('a',64))$$,'42501',null,'Wrong verified email cannot accept');
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000005';
select throws_ok($$select public.accept_invitation(repeat('a',64))$$,'42501',null,'Unverified account cannot accept');
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
select results_eq($$select public.accept_invitation(repeat('a',64))$$,array['10000000-0000-4000-8000-100000000001'::uuid],'Correct guest accepts');
select results_eq($$select public.accept_invitation(repeat('a',64))$$,array['10000000-0000-4000-8000-100000000001'::uuid],'Acceptance is idempotent');
select is((select role::text from public.space_members where user_id='10000000-0000-4000-8000-000000000002'),'viewer','Role comes from invitation');
select is((select count(*)::integer from public.spaces),1,'Guest cannot see other family');
select throws_ok($$select public.accept_invitation(repeat('b',64))$$,'42501',null,'Expired invitation blocked');
reset role;
update public.invitations set status='revoked' where token_hash=encode(extensions.digest(repeat('b',64),'sha256'),'hex');
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
select throws_ok($$select public.accept_invitation(repeat('b',64))$$,'42501',null,'Revoked invitation blocked');
reset role;
select * from finish();
rollback;
