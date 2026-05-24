-- Auto-create a public.profiles row whenever a new auth.users record is created.
-- This is the idiomatic Supabase pattern: signups become fully self-serve, so a
-- freshly authenticated user always has a matching profile for /api/v1/users/me.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
