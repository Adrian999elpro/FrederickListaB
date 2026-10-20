-- Catalogs contain public registration choices, never student personal data.
create table public.school_courses (
  id text primary key default gen_random_uuid()::text,
  name text not null check (length(trim(name)) between 2 and 40),
  level text not null check (level in ('basica','bachillerato')),
  position integer not null default 100
);
create unique index school_courses_name_key on public.school_courses(lower(trim(name)));
create table public.school_parallels (
  id text primary key check (length(id) between 1 and 8),
  name text not null check (length(trim(name)) between 1 and 8)
);
create unique index school_parallels_name_key on public.school_parallels(lower(trim(name)));
create table public.school_specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 80)
);
create unique index school_specialties_name_key on public.school_specialties(lower(trim(name)));
alter table public.school_courses enable row level security;
alter table public.school_parallels enable row level security;
alter table public.school_specialties enable row level security;
revoke all on public.school_courses, public.school_parallels, public.school_specialties from anon, authenticated;
grant select on public.school_courses, public.school_parallels, public.school_specialties to anon, authenticated;
grant insert on public.school_courses, public.school_parallels, public.school_specialties to authenticated;
create policy courses_read on public.school_courses for select to anon, authenticated using (true);
create policy parallels_read on public.school_parallels for select to anon, authenticated using (true);
create policy specialties_read on public.school_specialties for select to anon, authenticated using (true);
create policy courses_add on public.school_courses for insert to authenticated with check ((select public.has_permission('users.manage')));
create policy parallels_add on public.school_parallels for insert to authenticated with check ((select public.has_permission('users.manage')));
create policy specialties_add on public.school_specialties for insert to authenticated with check ((select public.has_permission('users.manage')));
insert into public.school_courses(id,name,level,position) values
 ('egb8','8vo de básica','basica',8), ('egb9','9no de básica','basica',9), ('egb10','10mo de básica','basica',10),
 ('bach1','1ro de bachillerato','bachillerato',11), ('bach2','2do de bachillerato','bachillerato',12), ('bach3','3ro de bachillerato','bachillerato',13);
insert into public.school_parallels(id,name) values ('A','A'),('B','B');

alter table public.profiles add column course_id text references public.school_courses(id),
 add column parallel text references public.school_parallels(id),
 add column specialty_id uuid references public.school_specialties(id);
create index profiles_course_parallel_idx on public.profiles(course_id,parallel);
create index profiles_parallel_idx on public.profiles(parallel);
create index profiles_specialty_idx on public.profiles(specialty_id);
-- Only migrate unambiguous labels. Keep the original course text for every existing profile.
update public.profiles set course_id = 'bach' || substring(course from '^([123])'),
 parallel = upper(substring(course from '([ABab])[^[:alnum:]]*$'))
where course ~* '^[123](ro|do|ero)?[[:space:]]+bachillerato[[:space:]]' and course ~* '[AB][^[:alnum:]]*$';

create or replace function public.profile_course_from_meta()
returns trigger language plpgsql security definer set search_path = '' as $$
declare meta jsonb;
begin
 select raw_user_meta_data into meta from auth.users where id = new.id;
 new.course := left(coalesce(meta->>'course',''),60);
 new.course_id := nullif(meta->>'course_id','');
 new.parallel := nullif(meta->>'parallel','');
 new.specialty_id := nullif(meta->>'specialty_id','')::uuid;
 return new;
end $$;
revoke all on function public.profile_course_from_meta() from public, anon, authenticated;

create or replace function public.validate_student_course()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare c public.school_courses;
begin
 if new.course_id is null then
   if new.parallel is not null or new.specialty_id is not null then raise exception 'invalid_student_course'; end if;
   return new;
 end if;
 select * into c from public.school_courses where id = new.course_id;
 if not found or new.parallel is null then raise exception 'invalid_student_course'; end if;
 if c.level <> 'bachillerato' and new.specialty_id is not null then raise exception 'specialty_only_bachillerato'; end if;
 new.course := c.name || ' "' || new.parallel || '"';
 return new;
end $$;
revoke all on function public.validate_student_course() from public, anon, authenticated;
-- z prefix runs after profiles_course (metadata ingestion) on INSERT.
create trigger profiles_z_validate_course before insert or update of course_id, parallel, specialty_id
 on public.profiles for each row execute function public.validate_student_course();

-- Authorization must bypass profile RLS for an administrator editing another user.
-- Keep the privileged implementation outside the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.set_student_profile(p_id uuid,p_full_name text,p_course_id text,p_parallel text,p_specialty_id uuid,p_role uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_active() or (p_id <> auth.uid() and not public.has_permission('users.manage')) then
   raise exception 'forbidden' using errcode = '42501';
 end if;
 if p_id is null or p_course_id is null or p_parallel is null or length(trim(coalesce(p_full_name,''))) not between 2 and 120 then
   raise exception 'invalid_student_course';
 end if;
 update public.profiles set full_name = trim(p_full_name), course_id = p_course_id, parallel = p_parallel, specialty_id = p_specialty_id,
   role_id = case when p_id = auth.uid() then role_id else coalesce(p_role,role_id) end where id = p_id;
 if not found then raise exception 'profile_not_found'; end if;
 perform public.log_event('users.update',p_id::text);
end $$;
revoke all on function private.set_student_profile(uuid,text,text,text,uuid,uuid) from public, anon;
grant execute on function private.set_student_profile(uuid,text,text,text,uuid,uuid) to authenticated;
create or replace function public.set_student_profile(p_id uuid,p_full_name text,p_course_id text,p_parallel text,p_specialty_id uuid,p_role uuid)
returns void language sql security invoker set search_path = '' as $$
 select private.set_student_profile(p_id,p_full_name,p_course_id,p_parallel,p_specialty_id,p_role);
$$;
revoke all on function public.set_student_profile(uuid,text,text,text,uuid,uuid) from public, anon;
grant execute on function public.set_student_profile(uuid,text,text,text,uuid,uuid) to authenticated;

alter table public.suggestions add column course_id text references public.school_courses(id),
 add column parallel text references public.school_parallels(id),
 add column specialty_id uuid references public.school_specialties(id);
create index suggestions_course_parallel_created_idx on public.suggestions(course_id,parallel,created_at desc);
create index suggestions_parallel_idx on public.suggestions(parallel);
create index suggestions_specialty_idx on public.suggestions(specialty_id);
update public.suggestions s set course_id = p.course_id,parallel = p.parallel,specialty_id = p.specialty_id
 from public.profiles p where p.id = s.author_id;
-- Server-generated snapshot prevents clients from spoofing the author or the filters.
create or replace function public.fill_author()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
 if auth.uid() is null then raise exception 'forbidden' using errcode = '42501'; end if;
 select * into p from public.profiles where id = auth.uid() and status = 'active';
 if not found then raise exception 'forbidden' using errcode = '42501'; end if;
 new.author_id := p.id;
 new.author_name := p.full_name || case when p.course <> '' then ' · ' || p.course else '' end;
 if tg_table_name = 'suggestions' then new.course_id := p.course_id; new.parallel := p.parallel; new.specialty_id := p.specialty_id; end if;
 return new;
end $$;
revoke all on function public.fill_author() from public, anon, authenticated;
