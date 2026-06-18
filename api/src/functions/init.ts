import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import pool from '../db'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'onboarding',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'client_admin',
  tenant_id UUID REFERENCES tenants(id),
  password_hash TEXT,
  pin CHAR(6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  start_date DATE,
  end_date DATE,
  expected_attendance INT,
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  tenant_id UUID REFERENCES tenants(id),
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  location_zone TEXT,
  status TEXT NOT NULL DEFAULT 'logged',
  logged_by UUID REFERENCES users(id),
  reference_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  event_id UUID REFERENCES events(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS martyn_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  item_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, item_key)
);

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

async function initDb(_req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  const secret = process.env.INIT_SECRET
  if (!secret) return { status: 503, jsonBody: { error: 'Init not enabled — set INIT_SECRET env var' } }

  const authHeader = _req.headers.get('x-init-secret')
  if (authHeader !== secret) return { status: 401, jsonBody: { error: 'Forbidden' } }

  try {
    const p = pool
    await p.query(SCHEMA)
    const { rows } = await p.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`)
    return { jsonBody: { ok: true, tables: rows.map((r: { table_name: string }) => r.table_name) } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: 500, jsonBody: { error: message } }
  }
}

async function seedAdmin(req: HttpRequest, _ctx: InvocationContext): Promise<HttpResponseInit> {
  const secret = process.env.INIT_SECRET
  if (!secret) return { status: 503, jsonBody: { error: 'Not enabled' } }
  const authHeader = req.headers.get('x-init-secret')
  if (authHeader !== secret) return { status: 401, jsonBody: { error: 'Forbidden' } }

  const body = await req.json() as { email?: string; password?: string; name?: string }
  if (!body.email || !body.password) return { status: 400, jsonBody: { error: 'email and password required' } }

  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash(body.password, 10)

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, role, password_hash)
       VALUES ($1,$2,'super_admin',$3)
       ON CONFLICT (email) DO UPDATE SET name=$2, role='super_admin', password_hash=$3
       RETURNING id, email, name, role`,
      [body.email, body.name ?? body.email, hash]
    )
    return { jsonBody: { ok: true, user: rows[0] } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: 500, jsonBody: { error: message } }
  }
}

app.http('init-db',      { methods: ['POST'], authLevel: 'anonymous', route: 'init',      handler: initDb   })
app.http('init-seed',    { methods: ['POST'], authLevel: 'anonymous', route: 'init/seed', handler: seedAdmin })
