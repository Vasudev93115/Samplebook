-- ==========================================
-- DROP ALL EXISTING TABLES & TRIGGERS (RESET)
-- ==========================================
drop table if exists budgets cascade;
drop table if exists expenses cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists users cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- CREATE TABLES
-- ==========================================

-- 1. Users table
create table users (
  id uuid default uuid_generate_v4() primary key,
  phone text unique not null,
  name text not null default 'Friend',
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Groups table
create table groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null default 'family' check (type in ('family', 'business')),
  currency text not null default 'INR',
  invite_code text unique not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- 3. Group members
create table group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- 4. Expenses table
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id),
  amount decimal(12,2) not null,
  currency text not null default 'INR',
  category text not null,
  vendor text,
  description text,
  input_type text default 'text' check (input_type in ('text', 'image', 'audio')),
  confidence decimal(3,2),
  created_at timestamptz default now()
);

-- 5. Budgets table
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id),
  category text not null,
  limit_amount decimal(12,2) not null,
  created_at timestamptz default now()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
create index idx_expenses_group on expenses(group_id);
create index idx_expenses_user on expenses(user_id);
create index idx_expenses_created on expenses(created_at desc);
create index idx_users_phone on users(phone);
create index idx_groups_invite on groups(invite_code);
create index idx_group_members_user on group_members(user_id);

-- ==========================================
-- ENABLE REALTIME SYNC ON EXPENSES
-- ==========================================
alter publication supabase_realtime add table expenses;

-- ==========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
alter table users enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table budgets enable row level security;

-- ==========================================
-- RLS POLICIES (optimized & non-recursive)
-- ==========================================

-- --- USERS POLICIES ---
create policy "Users can read own profile" on users for select using (
  auth.uid()::text = id::text
);
create policy "Users can insert own profile" on users for insert with check (
  auth.uid()::text = id::text
);
create policy "Users can update own profile" on users for update using (
  auth.uid()::text = id::text
);

-- --- GROUPS POLICIES ---
create policy "Members can read their groups" on groups for select using (
  auth.role() = 'authenticated'
);
create policy "Admins can manage groups" on groups for all using (
  created_by::text = auth.uid()::text
);

-- --- GROUP MEMBERS POLICIES ---
create policy "Members can read group members" on group_members for select using (
  auth.role() = 'authenticated'
);
create policy "Admins can manage members" on group_members for all using (
  group_id in (select id from groups where created_by::text = auth.uid()::text)
);
create policy "Users can join groups" on group_members for insert with check (
  user_id::text = auth.uid()::text
);

-- --- EXPENSES POLICIES ---
create policy "Members can read group expenses" on expenses for select using (
  group_id in (select group_id from group_members where user_id::text = auth.uid()::text)
);
create policy "Users can insert expenses" on expenses for insert with check (
  user_id::text = auth.uid()::text
);

-- --- BUDGETS POLICIES ---
create policy "Members can read group budgets" on budgets for select using (
  group_id in (select group_id from group_members where user_id::text = auth.uid()::text)
);
create policy "Admins can manage budgets" on budgets for all using (
  group_id in (select id from groups where created_by::text = auth.uid()::text)
);

-- ==========================================
-- AUTOMATIC USER SYNC (AUTH.USERS -> PUBLIC.USERS)
-- ==========================================

-- 1. Create trigger function
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql as $$
begin
  insert into public.users (id, phone, name)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'name', 'Friend')
  )
  on conflict (phone) do update
  set id = excluded.id;
  return new;
end;
$$;

-- 2. Bind trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Sync any existing auth.users immediately
insert into public.users (id, phone, name)
select 
  id, 
  phone, 
  coalesce(raw_user_meta_data->>'name', 'Friend')
from auth.users
on conflict (phone) do update
set id = excluded.id;

