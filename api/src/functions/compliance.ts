import { app, HttpRequest } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('compliance-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'compliance',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const tenantId = new URL(req.url).searchParams.get('tenant_id') ?? auth.tenantId
      const { rows } = await pool.query('SELECT * FROM martyn_compliance WHERE tenant_id = $1', [tenantId])
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('compliance-upsert', {
  methods: ['PUT'], authLevel: 'anonymous', route: 'compliance',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO martyn_compliance (tenant_id, event_id, item_key, status, evidence_url, notes, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (tenant_id, event_id, item_key) DO UPDATE SET
           status = EXCLUDED.status, evidence_url = EXCLUDED.evidence_url,
           notes = EXCLUDED.notes, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING *`,
        [body.tenant_id ?? auth.tenantId, body.event_id, body.item_key, body.status, body.evidence_url, body.notes, auth.userId]
      )
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
