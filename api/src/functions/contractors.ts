import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('contractors-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'contractors',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const url = new URL(req.url)
      const eventId = url.searchParams.get('event_id')
      const tenantId = url.searchParams.get('tenant_id') ?? auth.tenantId
      let query = 'SELECT * FROM contractors WHERE 1=1'
      const params: unknown[] = []
      if (eventId) { params.push(eventId); query += ` AND event_id = $${params.length}` }
      else if (tenantId) { params.push(tenantId); query += ` AND tenant_id = $${params.length}` }
      query += ' ORDER BY company_name'
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('contractors-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'contractors',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const tenantId = body.tenant_id ?? auth.tenantId
      const { rows } = await pool.query(
        `INSERT INTO contractors (tenant_id, event_id, company_name, type, sia_licence_number, primary_contact_name, primary_contact_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, body.event_id, body.company_name, body.type, body.sia_licence_number, body.primary_contact_name, body.primary_contact_phone]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('contractors-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'contractors/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { id } = req.params
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `UPDATE contractors SET
          company_name = COALESCE($2, company_name),
          primary_contact_name = COALESCE($3, primary_contact_name),
          primary_contact_phone = COALESCE($4, primary_contact_phone),
          sia_licence_number = COALESCE($5, sia_licence_number),
          archived = COALESCE($6, archived),
          updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [
          id,
          body.company_name ?? null,
          body.contact_name ?? null,
          body.contact_phone ?? null,
          body.sia_licence_number ?? null,
          body.archived ?? null,
        ]
      )
      if (!rows.length) return { status: 404, jsonBody: { error: 'Not found' } }
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
