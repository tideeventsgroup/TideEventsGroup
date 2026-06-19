import { app, HttpRequest, HttpResponseInit } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('tenants-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'tenants',
  handler: async (req) => {
    try {
      getAuth(req)
      const { rows } = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC')
      return { jsonBody: rows }
    } catch { return { status: 401, jsonBody: { error: 'Unauthorized' } } }
  }
})

app.http('tenants-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'tenants',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO tenants (name, type, licence_tier, status, primary_contact_name, primary_contact_email, primary_contact_phone, registered_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [body.name, body.type, body.licence_tier, body.status ?? 'active', body.primary_contact_name, body.primary_contact_email, body.primary_contact_phone, body.registered_address]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: e.message === 'Unauthorized' ? 401 : 500, jsonBody: { error: e.message } } }
  }
})

app.http('tenants-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'tenants/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      const id = req.params.id
      const body = await req.json() as Record<string, unknown>
      const fields = Object.keys(body).map((k, i) => `${k} = $${i + 2}`).join(', ')
      const values = [id, ...Object.values(body)]
      const { rows } = await pool.query(`UPDATE tenants SET ${fields} WHERE id = $1 RETURNING *`, values)
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('tenant-detail', {
  methods: ['GET'], authLevel: 'anonymous', route: 'tenants/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      const { rows } = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.params.id])
      if (!rows[0]) return { status: 404, jsonBody: { error: 'Not found' } }
      return { jsonBody: rows[0] }
    } catch { return { status: 401, jsonBody: { error: 'Unauthorized' } } }
  }
})
