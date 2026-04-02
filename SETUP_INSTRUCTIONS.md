# Palboard Setup Instructions

## 1. Supabase Project Setup
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under "Authentication" -> "Providers", ensure Email authentication is enabled.
3. Under "Project Settings" -> "API", copy your **Project URL** and **anon public** API key.

## 2. Environment Variables
1. Open the `.env.local` file in the root of the project.
2. Replace `your-supabase-url` and `your-supabase-anon-key` with the values you copied in step 1.

## 3. Database Setup (Optional but recommended)
We use `user_metadata.display_name` to store the user name on sign up. If you'd rather have a public `profiles` table that triggers automatically upon new user signup, you can run this SQL in Supabase's SQL Editor:

```sql
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  display_name text,
  primary key (id)
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Trigger
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

*(Note: Palboard Phase 1 codebase defaults to just updating `auth.users` metadata directly as requested, so the SQL above is completely optional and meant mainly for future complex relational structures).*

## 4. Running the Project
Execute `npm run dev` in your terminal to start the development server. Navigate to `http://localhost:3000`. You will be automatically redirected to `/login` if not authenticated.
