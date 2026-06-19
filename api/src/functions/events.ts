import { app, HttpRequest, HttpResponseInit } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('events-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'events',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const url = new URL(req.url)
      const tenantId = url.searchParams.get('tenant_id') ?? auth.tenantId
      const statusFilter = url.searchParams.getAll('status')
      let query = 'SELECT e.*, t.name as tenant_name FROM events e LEFT JOIN tenants t ON t.id = e.tenant_id WHERE 1=1'
      const params: unknown[] = []
      if (!(auth.role === 'super_admin' && (!tenantId || tenantId === 'all'))) {
        params.push(tenantId)
        query += ` AND e.tenant_id = $${params.length}`
      }
      if (statusFilter.length) {
        params.push(statusFilter)
        query += ` AND e.status = ANY($${params.length})`
      }
      query += ' ORDER BY e.start_date'
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('events-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'events',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const tenantId = body.tenant_id ?? auth.tenantId
      const { rows } = await pool.query(
        `INSERT INTO events (tenant_id, name, type, venue_name, venue_address, start_date, end_date, expected_attendance, status, licensed, sag_involvement, police_liaison_name, police_liaison_contact)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [tenantId, body.name, body.type, body.venue_name, body.venue_address, body.start_date, body.end_date, body.expected_attendance, body.status ?? 'planning', body.licensed ?? false, body.sag_involvement ?? false, body.police_liaison_name, body.police_liaison_contact]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('events-get', {
  methods: ['GET'], authLevel: 'anonymous', route: 'events/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { id } = req.params
      const { rows } = await pool.query('SELECT e.*, t.name as tenant_name FROM events e LEFT JOIN tenants t ON t.id = e.tenant_id WHERE e.id = $1', [id])
      if (!rows.length) return { status: 404, jsonBody: { error: 'Not found' } }
      if (auth.role !== 'super_admin' && rows[0].tenant_id !== auth.tenantId) {
        return { status: 403, jsonBody: { error: 'Forbidden' } }
      }
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('events-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'events/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { id } = req.params
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `UPDATE events SET
          name = COALESCE($2, name),
          venue_name = COALESCE($3, venue_name),
          venue_address = COALESCE($4, venue_address),
          type = COALESCE($5, type),
          start_date = COALESCE($6, start_date),
          end_date = COALESCE($7, end_date),
          expected_attendance = COALESCE($8, expected_attendance),
          status = COALESCE($9, status),
          assigned_consultant_id = COALESCE($10, assigned_consultant_id),
          licensed = COALESCE($11, licensed),
          sag_involvement = COALESCE($12, sag_involvement),
          police_liaison_name = COALESCE($13, police_liaison_name),
          police_liaison_contact = COALESCE($14, police_liaison_contact),
          updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [
          id,
          body.name ?? null,
          body.venue_name ?? null,
          body.venue_address ?? null,
          body.type ?? null,
          body.start_date ?? null,
          body.end_date ?? null,
          body.expected_attendance ?? null,
          body.status ?? null,
          body.assigned_consultant_id ?? null,
          body.licensed ?? null,
          body.sag_involvement ?? null,
          body.police_liaison_name ?? null,
          body.police_liaison_contact ?? null,
        ]
      )
      if (!rows.length) return { status: 404, jsonBody: { error: 'Not found' } }
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
