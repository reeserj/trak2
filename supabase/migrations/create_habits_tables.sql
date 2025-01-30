-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create entries table for habits and completions
create table if not exists public.entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text,
  type text,
  period text,
  createdat timestamp with time zone default timezone('utc'::text, now()) not null,
  updatedat timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tags table
create table if not exists public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  entry_id uuid references public.entries on delete cascade,
  user_id uuid references auth.users not null,
  createdat timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reminders table
create table if not exists public.reminders (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references public.entries on delete cascade,
  frequency text,
  time text,
  type text,
  createdat timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.entries enable row level security;
alter table public.tags enable row level security;
alter table public.reminders enable row level security;

-- Entries policies
create policy "Users can view own entries"
  on entries for select
  using (auth.uid()::uuid = user_id);

create policy "Users can create own entries"
  on entries for insert
  with check (auth.uid()::uuid = user_id);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid()::uuid = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid()::uuid = user_id);

-- Tags policies
create policy "Users can view own tags"
  on tags for select
  using (auth.uid()::uuid = user_id);

create policy "Users can create own tags"
  on tags for insert
  with check (auth.uid()::uuid = user_id);

create policy "Users can update own tags"
  on tags for update
  using (auth.uid()::uuid = user_id);

create policy "Users can delete own tags"
  on tags for delete
  using (auth.uid()::uuid = user_id);

-- Reminders policies
create policy "Users can view own reminders through entries"
  on reminders for select
  using (
    exists (
      select 1 from entries
      where entries.id = reminders.entry_id
      and entries.user_id = auth.uid()::uuid
    )
  );

create policy "Users can create reminders for own entries"
  on reminders for insert
  with check (
    exists (
      select 1 from entries
      where entries.id = entry_id
      and entries.user_id = auth.uid()::uuid
    )
  );

create policy "Users can update reminders for own entries"
  on reminders for update
  using (
    exists (
      select 1 from entries
      where entries.id = reminders.entry_id
      and entries.user_id = auth.uid()::uuid
    )
  );

create policy "Users can delete reminders for own entries"
  on reminders for delete
  using (
    exists (
      select 1 from entries
      where entries.id = reminders.entry_id
      and entries.user_id = auth.uid()::uuid
    )
  ); 