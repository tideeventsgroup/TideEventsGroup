import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('briefings-get', {
  methods: ['GET'], authLevel: 'anonymous', route: 'briefings',
  handler: async (req) => {
    try {
      const eventId = new URL(req.url).searchParams.get('event_id')
      if (!eventId) return { status: 400, jsonBody: { error: 'event_id required' } }
      const { rows } = await pool.query(
        `SELECT * FROM documents WHERE event_id = $1 AND type = 'briefing' ORDER BY updated_at DESC LIMIT 1`,
        [eventId]
      )
      return { jsonBody: rows[0] ?? null }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('briefings-upsert', {
  methods: ['PUT'], authLevel: 'anonymous', route: 'briefings',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { event_id, content_json } = body as { event_id: string; content_json: unknown }
      const tenantId = (body.tenant_id as string) ?? auth.tenantId

      const existing = await pool.query(
        `SELECT id FROM documents WHERE event_id = $1 AND type = 'briefing' LIMIT 1`,
        [event_id]
      )

      let row
      if (existing.rows.length) {
        const res = await pool.query(
          `UPDATE documents SET content_json = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [existing.rows[0].id, content_json]
        )
        row = res.rows[0]
      } else {
        const res = await pool.query(
          `INSERT INTO documents (tenant_id, event_id, type, title, content_json, status, version, created_by)
           VALUES ($1,$2,'briefing','Staff Briefing',$3,'final',1,$4) RETURNING *`,
          [tenantId, event_id, content_json, auth.userId]
        )
        row = res.rows[0]
      }
      return { jsonBody: row }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
