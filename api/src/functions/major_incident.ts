import { app } from '@azure/functions'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import pool from '../db'
import { getAuth } from '../auth'

function getPubSub() {
  const cs = process.env.WEBPUBSUB_CONNECTION_STRING
  if (!cs) return null
  return new WebPubSubServiceClient(cs, 'major-incident')
}

// GET /major-incident?event_id=
app.http('major-incident-get', {
  methods: ['GET'], authLevel: 'anonymous', route: 'major-incident',
  handler: async (req) => {
    try {
      getAuth(req)
      const eventId = new URL(req.url).searchParams.get('event_id')
      const { rows } = await pool.query(
        `SELECT * FROM major_incidents WHERE event_id = $1 AND status = 'active' ORDER BY declared_at DESC LIMIT 1`,
        [eventId]
      )
      return { jsonBody: rows[0] ?? null }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

// POST /major-incident — declare
app.http('major-incident-declare', {
  methods: ['POST'], authLevel: 'anonymous', route: 'major-incident',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [auth.userId])
      const declaredByName = userRes.rows[0]?.name ?? 'Unknown'
      const { rows } = await pool.query(
        `INSERT INTO major_incidents (event_id, tenant_id, declared_by, declared_by_name, description, strategic_log)
         VALUES ($1,$2,$3,$4,$5,'[]') RETURNING *`,
        [body.event_id, body.tenant_id, auth.userId, declaredByName, body.description]
      )
      const mi = rows[0]
      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'major_incident.declared', data: mi }).catch(() => {})
      return { status: 201, jsonBody: mi }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// PATCH /major-incident/:id — stand down or add log entry
app.http('major-incident-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'major-incident/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>

      if (body.action === 'stand_down') {
        const { rows } = await pool.query(
          `UPDATE major_incidents SET status='stood_down', stood_down_at=NOW(), stood_down_by=$2 WHERE id=$1 RETURNING *`,
          [req.params.id, auth.userId]
        )
        const pubsub = getPubSub()
        if (pubsub) await pubsub.sendToAll({ type: 'major_incident.stood_down', data: rows[0] }).catch(() => {})
        return { jsonBody: rows[0] }
      }

      if (body.action === 'add_log') {
        const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [auth.userId])
        const entry = {
          timestamp: new Date().toISOString(),
          author: userRes.rows[0]?.name ?? 'Unknown',
          entry: body.entry,
        }
        const { rows } = await pool.query(
          `UPDATE major_incidents SET strategic_log = strategic_log || $2::jsonb WHERE id=$1 RETURNING *`,
          [req.params.id, JSON.stringify([entry])]
        )
        return { jsonBody: rows[0] }
      }

      return { status: 400, jsonBody: { error: 'Unknown action' } }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
