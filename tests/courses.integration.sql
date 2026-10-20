-- Run through Supabase SQL Editor/execute_sql. All test data is rolled back.
begin;
create temp table course_test_state(user_id uuid, other_id uuid, admin_id uuid, specialty_id uuid);
insert into course_test_state select gen_random_uuid(),gen_random_uuid(),p.id,gen_random_uuid()
 from public.profiles p join public.roles r on r.id=p.role_id where r.name='admin' and p.status='active' limit 1;
grant select on course_test_state to authenticated, anon;
do $$ begin if (select count(*) from course_test_state) <> 1 then raise exception 'Test requires an active admin'; end if; end $$;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 select user_id,'course-test-'||user_id||'@example.invalid',jsonb_build_object('full_name','Course test','course_id','bach1','parallel','A'), '{}'::jsonb from course_test_state
 union all
 select other_id,'course-test-'||other_id||'@example.invalid',jsonb_build_object('full_name','Other test','course_id','egb8','parallel','B'), '{}'::jsonb from course_test_state;
set local role anon;
do $$ begin
 if (select count(*) from public.school_courses) < 6 then raise exception 'Anonymous catalog read failed'; end if;
 begin insert into public.school_specialties(name) values ('Denied anonymous'); raise exception 'Anonymous write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select user_id::text from course_test_state),true);
set local role authenticated;
do $$ declare s course_test_state; user_role uuid; begin
 select * into s from course_test_state;
 if (select count(*) from public.profiles where id in (s.user_id,s.other_id)) <> 1 then raise exception 'Profile privacy failed'; end if;
 select role_id into user_role from public.profiles where id=s.user_id;
 perform public.set_student_profile(s.user_id,'Course test','bach2','B',null,(select id from public.roles where name='admin'));
 if (select role_id from public.profiles where id=s.user_id) <> user_role then raise exception 'Self elevation allowed'; end if;
 if (select course_id from public.profiles where id=s.user_id) <> 'bach2' then raise exception 'Profile save failed'; end if;
 begin perform public.set_student_profile(s.other_id,'Other','bach1','A',null,null); raise exception 'Other profile edit allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.school_specialties(name) values ('Denied user'); raise exception 'Student catalog write allowed'; exception when insufficient_privilege then null; end;
 begin perform public.set_student_profile(s.user_id,'Course test','missing','A',null,null); raise exception 'Invalid course allowed'; exception when raise_exception then if sqlerrm <> 'invalid_student_course' then raise; end if; end;
 begin insert into public.suggestions(kind,body,author_id,author_name,course_id,parallel) values ('sugerencia','Spoof test',s.other_id,'Spoofed','egb8','A'); raise exception 'Client author override allowed'; exception when insufficient_privilege then null; end;
 insert into public.suggestions(kind,body) values ('sugerencia','Transactional course test');
 if not exists(select 1 from public.suggestions where body='Transactional course test' and author_id=s.user_id and course_id='bach2' and parallel='B' and author_name<>'Spoofed') then raise exception 'Suggestion snapshot failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select admin_id::text from course_test_state),true);
set local role authenticated;
do $$ declare s course_test_state; begin
 select * into s from course_test_state;
 insert into public.school_specialties(id,name) values (s.specialty_id,'Transactional specialty');
 insert into public.school_courses(name,level,position) values ('Transactional course','bachillerato',99);
 insert into public.school_parallels(id,name) values ('TEST','TEST');
 perform public.set_student_profile(s.user_id,'Course test','bach3','A',s.specialty_id,null);
 if not exists(select 1 from public.profiles where id=s.user_id and specialty_id=s.specialty_id) then raise exception 'Admin specialty save failed'; end if;
 begin perform public.set_student_profile(s.user_id,'Course test','egb8','A',s.specialty_id,null); raise exception 'Basic specialty allowed'; exception when raise_exception then if sqlerrm <> 'specialty_only_bachillerato' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select other_id::text from course_test_state),true);
set local role authenticated;
do $$ begin if exists(select 1 from public.suggestions where body='Transactional course test') then raise exception 'Suggestion privacy failed'; end if; end $$;
reset role;
rollback;
select 'PASS: signup metadata, public catalogs, private profiles, self-edit, no role elevation, admin catalogs, specialty validation, suggestion snapshots and RLS; all test data rolled back' as result;
