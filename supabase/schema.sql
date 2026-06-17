-- Tide IMS — Supabase schema
-- Run this in the Supabase SQL editor to set up all tables and RLS policies.

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text check (type in ('festival','venue','local_authority','charity','private_event_company')),
  licence_tier text check (licence_tier in ('per_event','annual')),
  status text default 'onboarding' check (status in ('active','onboarding','suspended','expired')),
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  registered_address text,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id),
  email text not null,
  role text not null check (role in ('super_admin','client_admin','client_staff','tide_consultant')),
  name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  type text check (type in ('outdoor_festival','harbour_event','street_event','indoor_venue','sporting_event','community_event')),
  venue_name text,
  venue_address text,
  start_date date,
  end_date date,
  expected_attendance integer,
  status text default 'planning' check (status in ('planning','documentation','pre_event_review','live','post_event','closed')),
  assigned_consultant_id uuid references users(id),
  licensed boolean default false,
  sag_involvement boolean default false,
  police_liaison_name text,
  police_liaison_contact text,
  created_at timestamptz default now()
);

create table if not exists contractors (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  event_id uuid references events(id),
  company_name text not null,
  type text check (type in ('security','stewarding','medical','fire_safety','infrastructure')),
  sia_licence_number text,
  sia_expiry_date date,
  primary_contact_name text,
  primary_contact_phone text,
  archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  event_id uuid references events(id),
  type text check (type in ('ossp','terrorism_risk_plan','fire_management_plan','risk_assessment','sag_submission','briefing','other')),
  title text not null,
  content_json jsonb default '{}',
  status text default 'draft' check (status in ('draft','final','submitted')),
  version integer default 1,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists incidents (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id),
  tenant_id uuid not null references tenants(id),
  category text not null check (category in ('medical','security','crowd_pressure','fire_evacuation','ct_concern','suspicious_behaviour','lost_person','infrastructure','noise_nuisance','near_miss','other','critical_declaration')),
  severity text check (severity in ('low','medium','high','critical')),
  description text,
  location_zone text,
  location_lat numeric,
  location_lng numeric,
  photo_url text,
  status text default 'logged' check (status in ('logged','assigned','in_progress','resolved')),
  logged_by uuid references users(id),
  assigned_to uuid references users(id),
  reference_number text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists incident_actions (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null references incidents(id),
  action_type text not null,
  note text,
  performed_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists risks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id),
  tenant_id uuid not null references tenants(id),
  hazard text not null,
  who_at_risk text,
  existing_controls text,
  likelihood integer check (likelihood between 1 and 5),
  severity integer check (severity between 1 and 5),
  risk_score integer generated always as (coalesce(likelihood,0) * coalesce(severity,0)) stored,
  additional_controls text,
  responsible_person text,
  review_date date,
  flagged_high boolean generated always as (coalesce(likelihood,0) * coalesce(severity,0) >= 15) stored,
  created_at timestamptz default now()
);

create table if not exists martyn_compliance (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  event_id uuid references events(id),
  item_key text not null,
  status text default 'not_started' check (status in ('not_started','in_progress','complete')),
  evidence_url text,
  notes text,
  updated_by uuid references users(id),
  updated_at timestamptz default now(),
  unique(tenant_id, event_id, item_key)
);

create table if not exists training_courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  modules_json jsonb default '[]',
  pass_mark integer default 80,
  certificate_template text,
  created_at timestamptz default now()
);

create table if not exists training_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  course_id uuid not null references training_courses(id),
  score integer,
  passed boolean,
  certificate_url text,
  completed_at timestamptz default now()
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id),
  user_id uuid references users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists consultant_assignments (
  id uuid primary key default uuid_generate_v4(),
  consultant_id uuid not null references users(id),
  tenant_id uuid not null references tenants(id),
  assigned_at timestamptz default now(),
  unique(consultant_id, tenant_id)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function current_user_role()
returns text as $$
  select role from users where id = auth.uid();
$$ language sql security definer;

create or replace function current_user_tenant()
returns uuid as $$
  select tenant_id from users where id = auth.uid();
$$ language sql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table tenants enable row level security;
alter table users enable row level security;
alter table events enable row level security;
alter table contractors enable row level security;
alter table documents enable row level security;
alter table incidents enable row level security;
alter table incident_actions enable row level security;
alter table risks enable row level security;
alter table martyn_compliance enable row level security;
alter table audit_log enable row level security;
alter table training_courses enable row level security;
alter table training_completions enable row level security;

-- Tenants
create policy "super_admin_all_tenants" on tenants for all using (current_user_role() = 'super_admin');
create policy "own_tenant_select" on tenants for select using (id = current_user_tenant());

-- Users
create policy "super_admin_all_users" on users for all using (current_user_role() = 'super_admin');
create policy "tenant_users_select" on users for select using (tenant_id = current_user_tenant() or id = auth.uid());
create policy "own_user_update" on users for update using (id = auth.uid());

-- Events
create policy "super_admin_all_events" on events for all using (current_user_role() = 'super_admin');
create policy "tenant_events_all" on events for all using (tenant_id = current_user_tenant());

-- Contractors
create policy "super_admin_all_contractors" on contractors for all using (current_user_role() = 'super_admin');
create policy "tenant_contractors_all" on contractors for all using (tenant_id = current_user_tenant());

-- Documents
create policy "super_admin_all_docs" on documents for all using (current_user_role() = 'super_admin');
create policy "tenant_docs_all" on documents for all using (tenant_id = current_user_tenant());

-- Incidents
create policy "super_admin_all_incidents" on incidents for all using (current_user_role() = 'super_admin');
create policy "tenant_incidents_all" on incidents for all using (tenant_id = current_user_tenant());

-- Incident actions
create policy "super_admin_all_actions" on incident_actions for all using (current_user_role() = 'super_admin');
create policy "tenant_actions_select" on incident_actions for select
  using (incident_id in (select id from incidents where tenant_id = current_user_tenant()));

-- Risks
create policy "super_admin_all_risks" on risks for all using (current_user_role() = 'super_admin');
create policy "tenant_risks_all" on risks for all using (tenant_id = current_user_tenant());

-- Martyn compliance
create policy "super_admin_all_martyn" on martyn_compliance for all using (current_user_role() = 'super_admin');
create policy "tenant_martyn_all" on martyn_compliance for all using (tenant_id = current_user_tenant());

-- Audit log
create policy "super_admin_all_audit" on audit_log for select using (current_user_role() = 'super_admin');
create policy "tenant_audit_select" on audit_log for select using (tenant_id = current_user_tenant());
create policy "insert_audit" on audit_log for insert with check (true);

-- Training
create policy "all_view_courses" on training_courses for select using (true);
create policy "super_admin_manage_courses" on training_courses for all using (current_user_role() = 'super_admin');
create policy "own_completions" on training_completions for all using (user_id = auth.uid() or current_user_role() = 'super_admin');

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'client_staff'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
