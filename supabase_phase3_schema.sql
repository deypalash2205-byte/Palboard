-- Phase 3: Palboard Semesters and Marks Schema

-- 1. Create Exam Type Enum
create type exam_type as enum ('mid_term', 'end_term');

-- 2. Semesters Table
create table public.semesters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_number integer not null check (semester_number between 1 and 8),
  sgpa numeric(4,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, semester_number)
);

-- 3. Marks Table
create table public.marks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  subject_name text not null,
  exam_type exam_type not null,
  score numeric(5,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.semesters enable row level security;
alter table public.marks enable row level security;

-- 5. RLS Policies
create policy "Users manage own semesters" on semesters for all using (auth.uid() = user_id);
create policy "Users manage own marks" on marks for all using (auth.uid() = user_id);

-- Note: In older Supabase projects we might rely on a database trigger 
-- attached to strictly `auth.users` on `INSERT` to auto-populate the 6 semesters. 
-- Since existing users might lack those records, the Generation logic will be
-- safely handled securely through the `MarksPage` React component UI flow directly!
