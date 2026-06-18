import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('incident-actions-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'incident-actions',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const incidentId = new URL(req.url).searchParams.get('incident_id')
      const { rows } = await pool.query(
        'SELECT * FROM incident_actions WHERE incident_id = $1 ORDER BY created_at ASC',
        [incidentId]
      )
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('incident-actions-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'incident-actions',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { incident_id, action_type, note } = body as { incident_id: string; action_type: string; note: string }
      const userId = auth.userId

      const { rows } = await pool.query(
        `INSERT INTO incident_actions (incident_id, action_type, note, performed_by)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [incident_id, action_type, note, userId]
      )

      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
         VALUES (null, $1, 'incident_action', 'incident', $2, '{}'::jsonb)`,
        [userId, incident_id]
      )

      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
