-- Run this once in the Supabase SQL editor for your project.

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  link_slug text unique not null,       -- permanent part of the student's URL
  daily_room_name text,                 -- Daily.co room tied to this student
  google_doc_url text,                  -- link to their ongoing Google Doc
  created_at timestamptz default now()
);

create table if not exists classroom_boards (
  student_id uuid primary key references students(id) on delete cascade,
  board_data jsonb,                     -- tldraw whiteboard snapshot
  updated_at timestamptz default now()
);

create table if not exists lesson_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  content text,
  created_at timestamptz default now()
);

create table if not exists lesson_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  board_data jsonb,                     -- a saved whiteboard to reuse as a starting point
  created_at timestamptz default now()
);

create table if not exists uploaded_materials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  file_name text,
  file_url text,                        -- Supabase Storage public URL
  uploaded_at timestamptz default now()
);

-- Row Level Security: since this is a single-teacher tool with no public
-- sign-up, and all requests go through your server (which already checks
-- the teacher password), the simplest safe setup is to keep RLS off for
-- these tables and rely on the anon key never being exposed beyond your
-- own app. If you'd rather have DB-level protection too, enable RLS and
-- ask me to write matching policies.
