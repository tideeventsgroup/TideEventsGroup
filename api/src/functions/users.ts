import { app, HttpRequest } from '@azure/functions'
import bcrypt from 'bcrypt'
import pool from '../db'
import { getAuth } from '../auth'

app.http('users-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'users',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const url = new URL(req.url)
      const tenantId = url.searchParams.get('tenant_id') ?? auth.tenantId
      const role = url.searchParams.get('role')
      let query = 'SELECT u.id, u.email, u.name, u.role, u.tenant_id, u.phone, u.created_at, t.name as tenant_name FROM users u LEFT JOIN tenants t ON t.id = u.tenant_id WHERE 1=1'
      const params: unknown[] = []
      if (!(auth.role === 'super_admin' && (!tenantId || tenantId === 'all'))) {
        if (tenantId) { params.push(tenantId); query += ` AND u.tenant_id = $${params.length}` }
      }
      if (role) { params.push(role); query += ` AND u.role = $${params.length}` }
      query += ' ORDER BY u.created_at DESC'
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('users-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'users',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const tenantId = body.tenant_id ?? auth.tenantId
      const pin = body.pin as string | undefined
      const password = body.password as string | undefined
      const passwordHash = password ? await bcrypt.hash(password, 10) : null
      const { rows } = await pool.query(
        `INSERT INTO users (email, name, role, tenant_id, phone, pin, password_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, email, name, role, tenant_id, phone, pin, created_at`,
        [body.email, body.name, body.role, tenantId, body.phone ?? null, pin ?? null, passwordHash]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
