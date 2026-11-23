-- BudScout authentication foundation. Apply in Supabase SQL Editor after reviewing.
-- Email authentication is provided by Supabase Auth, not custom password tables.
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text check (char_length(display_name)<=80),
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can create own profile" on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create table if not exists public.business_verification_requests (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 business_name text not null check (char_length(business_name) between 1 and 120),
 license_id text not null check (char_length(license_id) between 1 and 80),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
alter table public.business_verification_requests enable row level security;
create policy "Users can read own verification requests" on public.business_verification_requests for select to authenticated using ((select auth.uid())=requester_id);
create policy "Users can submit pending verification requests" on public.business_verification_requests for insert to authenticated with check ((select auth.uid())=requester_id and status='pending');
-- No client-side UPDATE/DELETE policies. Approval requires a trusted administrator process.

create table if not exists public.business_memberships (
 user_id uuid not null references auth.users(id) on delete cascade,
 business_id uuid not null,
 role text not null check (role in ('owner','manager')),
 created_at timestamptz not null default now(),
 primary key(user_id,business_id)
);
alter table public.business_memberships enable row level security;
create policy "Users can read own business memberships" on public.business_memberships for select to authenticated using ((select auth.uid())=user_id);
-- No client INSERT/UPDATE/DELETE policies: memberships must be granted by trusted server-side administration.
