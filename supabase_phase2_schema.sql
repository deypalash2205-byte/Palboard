-- Phase 2: Palboard Tasks Schema

-- 1. Create Status Enum
create type task_status as enum ('not started', 'in progress', 'completed');

-- 2. Subjects Table
create table public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status task_status default 'not started',
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Subtopics Table
create table public.subtopics (
  id uuid default gen_random_uuid() primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  status task_status default 'not started',
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Attachments Table
-- record_id is generic to attach to either a subject or a subtopic
create table public.attachments (
  id uuid default gen_random_uuid() primary key,
  record_id uuid not null,
  file_url text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS)
alter table public.subjects enable row level security;
alter table public.subtopics enable row level security;
alter table public.attachments enable row level security;

-- 6. RLS Policies for Subjects
create policy "Users can view their own subjects" on subjects for select using (auth.uid() = user_id);
create policy "Users can insert their own subjects" on subjects for insert with check (auth.uid() = user_id);
create policy "Users can update their own subjects" on subjects for update using (auth.uid() = user_id);
create policy "Users can delete their own subjects" on subjects for delete using (auth.uid() = user_id);

-- 7. RLS Policies for Subtopics
create policy "Users can view subtopics of their subjects" on subtopics for select using (
  exists (select 1 from subjects where subjects.id = subtopics.subject_id and subjects.user_id = auth.uid())
);
create policy "Users can insert subtopics to their subjects" on subtopics for insert with check (
  exists (select 1 from subjects where subjects.id = subject_id and subjects.user_id = auth.uid())
);
create policy "Users can update subtopics of their subjects" on subtopics for update using (
  exists (select 1 from subjects where subjects.id = subtopics.subject_id and subjects.user_id = auth.uid())
);
create policy "Users can delete subtopics of their subjects" on subtopics for delete using (
  exists (select 1 from subjects where subjects.id = subtopics.subject_id and subjects.user_id = auth.uid())
);

-- 8. RLS Policies for Attachments (Simplified to Authenticated Users for Phase 2)
create policy "Users can manage their attachments" on attachments for all using (auth.uid() is not null);

-- 9. Storage Bucket setup
insert into storage.buckets (id, name, public) values ('library-assets', 'library-assets', true);
create policy "Authenticated users can upload assets" on storage.objects for insert with check ( bucket_id = 'library-assets' and auth.uid() is not null );
create policy "Anyone can read assets" on storage.objects for select using ( bucket_id = 'library-assets' );
