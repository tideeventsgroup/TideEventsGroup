
-- ============================================================
-- TIDE – Tactical Incident & Dispatch Environment
-- Complete Database Schema v2.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tenants (client organisations) ──────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  licence_tier TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'active',
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  registered_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'super_admin','client_admin','client_staff','tide_consultant',
    'gold_command','silver_command','event_manager','operations_manager',
    'incident_manager','security_manager','medical_lead','police_liaison',
    'comms_officer','cad_operator','situational_awareness','event_staff'
  )),
  phone TEXT,
  call_sign TEXT,
  pin CHAR(6),
  password_hash TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  venue_name TEXT,
  venue_address TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  operational_hours_start TIME,
  operational_hours_end TIME,
  expected_attendance INTEGER,
  capacity INTEGER,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  status TEXT DEFAULT 'planning',
  current_mode TEXT DEFAULT 'planning' CHECK (current_mode IN ('planning','live','post_event')),
  attendance_current INTEGER DEFAULT 0,
  weather_notes TEXT,
  assigned_consultant_id UUID REFERENCES users(id),
  licensed BOOLEAN DEFAULT FALSE,
  sag_involvement BOOLEAN DEFAULT FALSE,
  police_liaison_name TEXT,
  police_liaison_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Incidents (CAD) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cad_number TEXT UNIQUE,
  priority TEXT DEFAULT 'P3' CHECK (priority IN ('P1','P2','P3','P4','P5')),
  category TEXT,
  incident_type TEXT,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  description TEXT,
  location_zone TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  photo_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','assigned','en_route','on_scene','resolved','closed')),
  logged_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  reference_number TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- CAD number sequence per event
CREATE SEQUENCE IF NOT EXISTS cad_seq START 1000;

-- ── Incident Actions / Timeline ──────────────────────────────
CREATE TABLE IF NOT EXISTS incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  action_type TEXT,
  note TEXT,
  performed_by UUID REFERENCES users(id),
  performed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Resources ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personnel','vehicle','medical_team','security_team','steward_team','event_staff','contractor','equipment')),
  call_sign TEXT,
  phone TEXT,
  location_zone TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','assigned','en_route','on_scene','unavailable','off_duty')),
  assigned_incident_id UUID REFERENCES incidents(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Communications Log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('radio','phone','email','broadcast','log')),
  direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound','outbound','internal')),
  from_callsign TEXT,
  to_callsign TEXT,
  channel TEXT,
  message TEXT,
  linked_incident_id UUID REFERENCES incidents(id),
  logged_by UUID REFERENCES users(id),
  logged_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Major Incidents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS major_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  declared_by UUID REFERENCES users(id),
  declared_by_name TEXT,
  declared_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','stood_down')),
  stood_down_at TIMESTAMPTZ,
  stood_down_by UUID REFERENCES users(id),
  description TEXT,
  strategic_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Broadcasts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal','urgent','critical')),
  sent_by UUID REFERENCES users(id),
  sent_by_name TEXT,
  target_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Site Zones ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('entrance','exit','emergency_gate','medical','security','welfare','command','rvp','stage','hospitality','parking','restricted')),
  coordinates JSONB,
  color TEXT DEFAULT '#E8521A',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Risk Register ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  hazard TEXT NOT NULL,
  category TEXT,
  who_at_risk TEXT,
  existing_controls TEXT,
  likelihood INTEGER CHECK (likelihood BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  additional_controls TEXT,
  owner TEXT,
  review_date DATE,
  flagged_high BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Staff Schedules ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  role_override TEXT,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  location_zone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contractors ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  company_name TEXT,
  type TEXT CHECK (type IN ('security','stewarding','medical','fire_safety','infrastructure','traffic_management','other')),
  sia_licence_number TEXT,
  sia_expiry_date DATE,
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  headcount INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Documents / Document Library ────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id),
  type TEXT CHECK (type IN ('emp','ossp','terrorism_risk_plan','fire_management_plan','risk_assessment','sag_submission','briefing','rams','licence','insurance','site_plan','emergency_procedures','other')),
  title TEXT,
  content_json JSONB,
  file_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','final','submitted','approved')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Martyn's Law Compliance ──────────────────────────────────
CREATE TABLE IF NOT EXISTS martyn_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  evidence_url TEXT,
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, event_id, item_key)
);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Training ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  modules_json JSONB DEFAULT '[]',
  pass_mark INTEGER DEFAULT 80,
  certificate_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES training_courses(id),
  score INTEGER,
  passed BOOLEAN,
  certificate_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_incidents_event ON incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_event ON resources(event_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_comms_event ON comms_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_comms_created ON comms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
