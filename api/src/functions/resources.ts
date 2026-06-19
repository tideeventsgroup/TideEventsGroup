import { app } from '@azure/functions'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import pool from '../db'
import { getAuth } from '../auth'

function getPubSub() {
  const cs = process.env.WEBPUBSUB_CONNECTION_STRING
  if (!cs) return null
  return new WebPubSubServiceClient(cs, 'resources')
}

// GET /resources?event_id=&type=&status=
app.http('resources-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'resources',
  handler: async (req) => {
    try {
      getAuth(req)
      const sp = new URL(req.url).searchParams
      const eventId = sp.get('event_id')
      const type    = sp.get('type')
      const status  = sp.get('status')

      let query = `
        SELECT r.*, i.cad_number AS assigned_cad_number
        FROM resources r
        LEFT JOIN incidents i ON i.id = r.assigned_incident_id
        WHERE 1=1
      `
      const params: unknown[] = []
      if (eventId) { params.push(eventId); query += ` AND r.event_id = $${params.length}` }
      if (type)    { params.push(type);    query += ` AND r.type = $${params.length}` }
      if (status)  { params.push(status);  query += ` AND r.status = $${params.length}` }
      query += ' ORDER BY r.type, r.name'
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

// POST /resources
app.http('resources-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'resources',
  handler: async (req) => {
    try {
      getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO resources (event_id, tenant_id, name, type, call_sign, phone, location_zone, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,'available'),$9) RETURNING *`,
        [body.event_id, body.tenant_id, body.name, body.type, body.call_sign, body.phone,
         body.location_zone, body.status, body.notes]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// PATCH /resources/:id
app.http('resources-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'resources/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `UPDATE resources SET
           status               = COALESCE($2, status),
           assigned_incident_id = $3,
           location_zone        = COALESCE($4, location_zone),
           location_lat         = COALESCE($5, location_lat),
           location_lng         = COALESCE($6, location_lng),
           notes                = COALESCE($7, notes),
           updated_at           = NOW()
         WHERE id = $1 RETURNING *`,
        [req.params.id, body.status, body.assigned_incident_id ?? null,
         body.location_zone, body.location_lat, body.location_lng, body.notes]
      )
      const pubsub = getPubSub()
      if (pubsub && rows[0]) await pubsub.sendToAll({ type: 'resource.updated', data: rows[0] }).catch(() => {})
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// DELETE /resources/:id
app.http('resources-delete', {
  methods: ['DELETE'], authLevel: 'anonymous', route: 'resources/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      await pool.query('DELETE FROM resources WHERE id = $1', [req.params.id])
      return { status: 204 }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
