import { app, HttpRequest } from '@azure/functions'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import pool from '../db'
import { getAuth } from '../auth'

function getPubSub() {
  const cs = process.env.WEBPUBSUB_CONNECTION_STRING
  if (!cs) return null
  return new WebPubSubServiceClient(cs, 'incidents')
}

app.http('incidents-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'incidents',
  handler: async (req) => {
    try {
      getAuth(req)
      const eventId = new URL(req.url).searchParams.get('event_id')
      if (!eventId) return { status: 400, jsonBody: { error: 'event_id required' } }
      const { rows } = await pool.query('SELECT * FROM incidents WHERE event_id = $1 ORDER BY created_at DESC', [eventId])
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('incidents-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'incidents',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const ref = 'INC-' + Date.now().toString(36).toUpperCase()
      const { rows } = await pool.query(
        `INSERT INTO incidents (event_id, tenant_id, category, severity, description, location_zone, location_lat, location_lng, photo_url, status, logged_by, reference_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open',$10,$11) RETURNING *`,
        [body.event_id, body.tenant_id, body.category, body.severity, body.description, body.location_zone, body.location_lat, body.location_lng, body.photo_url, auth.userId, ref]
      )
      const incident = rows[0]
      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'incident.created', data: incident })
      return { status: 201, jsonBody: incident }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('incidents-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'incidents/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      const { status, assigned_to } = await req.json() as { status?: string; assigned_to?: string }
      const resolvedAt = status === 'resolved' ? new Date().toISOString() : null
      const { rows } = await pool.query(
        `UPDATE incidents SET status = COALESCE($2, status), assigned_to = COALESCE($3, assigned_to), resolved_at = COALESCE($4, resolved_at) WHERE id = $1 RETURNING *`,
        [req.params.id, status, assigned_to, resolvedAt]
      )
      const incident = rows[0]
      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'incident.updated', data: incident })
      return { jsonBody: incident }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
