-- TutorLink Database Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- 
-- MULTI-ROLE SUPPORT: Users can have both student AND tutor roles
-- - `roles` array: Contains user's roles (e.g., ['student', 'tutor'])
-- - `active_role`: Currently selected role for the UI
-- - `role`: Legacy field kept for backward compatibility

-- ============================================
-- 1. PROFILES TABLE
-- Extends auth.users with app-specific data
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('student', 'tutor')), -- Legacy: kept for backward compatibility
  roles text[] default '{}', -- Array of roles user has
  active_role text, -- Currently active role for UI
  name text not null,
  phone text,
  created_at timestamptz default now()
);

-- Constraints for multi-role support
alter table profiles drop constraint if exists profiles_must_have_role;
alter table profiles add constraint profiles_must_have_role 
  check (array_length(roles, 1) > 0 OR role is not null);

alter table profiles drop constraint if exists active_role_must_be_in_roles;
alter table profiles add constraint active_role_must_be_in_roles 
  check (active_role is null OR active_role = any(roles) OR active_role = role);

alter table profiles drop constraint if exists valid_roles_only;
alter table profiles add constraint valid_roles_only
  check (roles <@ array['student', 'tutor']::text[]);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Allow service role to manage profiles (for backend)
create policy "Service role can manage profiles"
  on profiles for all
  using (auth.role() = 'service_role');

-- ============================================
-- 2. TUTOR PROFILES TABLE
-- Additional profile data for tutors
-- ============================================
create table if not exists tutor_profiles (
  id uuid references profiles on delete cascade primary key,
  bio text default '',
  subjects text[] default '{}',
  availability text[] default '{}',
  scheduling_link text,
  -- Transcript verification fields (Phase 2)
  transcript_file_url text,
  transcript_verification_status text 
    CHECK (transcript_verification_status IN ('pending', 'verified', 'rejected') OR transcript_verification_status IS NULL),
  transcript_verified_at timestamptz,
  transcript_verification_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table tutor_profiles enable row level security;

-- Policies for tutor_profiles
create policy "Anyone can view tutor profiles"
  on tutor_profiles for select
  using (true);

create policy "Tutors can update own tutor profile"
  on tutor_profiles for update
  using (auth.uid() = id);

create policy "Tutors can insert own tutor profile"
  on tutor_profiles for insert
  with check (auth.uid() = id);

create policy "Tutors can upsert own tutor profile"
  on tutor_profiles for all
  using (auth.uid() = id);

-- ============================================
-- 3. HELP REQUESTS TABLE
-- Requests from students to tutors
-- ============================================
create table if not exists help_requests (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles not null,
  tutor_id uuid references profiles not null,
  subject text not null,
  description text default '',
  preferred_times text[] default '{}',
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table help_requests enable row level security;

-- Policies for help_requests
create policy "Students can view own requests"
  on help_requests for select
  using (auth.uid() = student_id);

create policy "Tutors can view requests sent to them"
  on help_requests for select
  using (auth.uid() = tutor_id);

create policy "Students can create requests"
  on help_requests for insert
  with check (auth.uid() = student_id);

create policy "Students can update own requests"
  on help_requests for update
  using (auth.uid() = student_id);

create policy "Tutors can update requests sent to them"
  on help_requests for update
  using (auth.uid() = tutor_id);

-- Service role access
create policy "Service role can manage help requests"
  on help_requests for all
  using (auth.role() = 'service_role');

-- ============================================
-- 4. FUNCTIONS & TRIGGERS
-- Auto-update timestamps
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tutor_profiles_updated_at
  before update on tutor_profiles
  for each row execute function update_updated_at();

create trigger help_requests_updated_at
  before update on help_requests
  for each row execute function update_updated_at();

-- Add comments for transcript verification columns
comment on column tutor_profiles.transcript_file_url is 'URL to transcript file in Supabase Storage';
comment on column tutor_profiles.transcript_verification_status is 'Status: pending, verified, rejected, or null if not uploaded';
comment on column tutor_profiles.transcript_verified_at is 'Timestamp when verification completed';
comment on column tutor_profiles.transcript_verification_data is 'JSON containing verification results: verified_courses, grades, authenticity_score, rejection_reason';

-- ============================================
-- 5. INDEXES
-- For better query performance
-- ============================================
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_roles on profiles using gin(roles);
create index if not exists idx_help_requests_student on help_requests(student_id);
create index if not exists idx_help_requests_tutor on help_requests(tutor_id);
create index if not exists idx_help_requests_status on help_requests(status);
create index if not exists idx_tutor_profiles_verification_status on tutor_profiles(transcript_verification_status);
