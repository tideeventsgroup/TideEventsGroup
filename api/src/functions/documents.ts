import { app, HttpRequest } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('documents-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'documents',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const tenantId = new URL(req.url).searchParams.get('tenant_id') ?? auth.tenantId
      const { rows } = await pool.query('SELECT * FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId])
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('documents-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'documents',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO documents (tenant_id, event_id, type, title, content_json, status, version, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [body.tenant_id ?? auth.tenantId, body.event_id, body.type, body.title, body.content_json, body.status ?? 'draft', body.version ?? 1, auth.userId]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
