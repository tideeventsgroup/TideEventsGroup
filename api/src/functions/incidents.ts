import { app } from '@azure/functions'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import pool from '../db'
import { getAuth } from '../auth'

function getPubSub() {
  const cs = process.env.WEBPUBSUB_CONNECTION_STRING
  if (!cs) return null
  return new WebPubSubServiceClient(cs, 'incidents')
}

// GET /incidents — supports ?event_id, ?tenant_id, ?severity, ?status, ?search, ?limit
app.http('incidents-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'incidents',
  handler: async (req) => {
    try {
      getAuth(req)
      const sp       = new URL(req.url).searchParams
      const eventId  = sp.get('event_id')
      const tenantId = sp.get('tenant_id')
      const severity = sp.get('severity')
      const status   = sp.get('status')
      const search   = sp.get('search')
      const limit    = Math.min(parseInt(sp.get('limit') ?? '200', 10), 500)

      let query = `
        SELECT i.*,
               e.name  AS event_name,
               t.name  AS tenant_name,
               u.name  AS logged_by_name,
               a.name  AS assigned_to_name
        FROM incidents i
        LEFT JOIN events e  ON e.id = i.event_id
        LEFT JOIN tenants t ON t.id = i.tenant_id
        LEFT JOIN users u   ON u.id = i.logged_by
        LEFT JOIN users a   ON a.id = i.assigned_to
        WHERE 1=1
      `
      const params: unknown[] = []
      if (eventId)  { params.push(eventId);  query += ` AND i.event_id  = $${params.length}` }
      if (tenantId) { params.push(tenantId); query += ` AND i.tenant_id = $${params.length}` }
      if (severity) { params.push(severity); query += ` AND i.severity  = $${params.length}` }
      if (status)   { params.push(status);   query += ` AND i.status    = $${params.length}` }
      if (search)   {
        params.push(`%${search}%`)
        query += ` AND (i.reference_number ILIKE $${params.length} OR i.description ILIKE $${params.length} OR i.location_zone ILIKE $${params.length} OR e.name ILIKE $${params.length} OR t.name ILIKE $${params.length})`
      }
      params.push(limit)
      query += ` ORDER BY i.created_at DESC LIMIT $${params.length}`
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

// GET /incidents/:id
app.http('incidents-get', {
  methods: ['GET'], authLevel: 'anonymous', route: 'incidents/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      const { rows } = await pool.query(`
        SELECT i.*,
               e.name  AS event_name,
               t.name  AS tenant_name,
               u.name  AS logged_by_name,
               a.name  AS assigned_to_name
        FROM incidents i
        LEFT JOIN events e  ON e.id = i.event_id
        LEFT JOIN tenants t ON t.id = i.tenant_id
        LEFT JOIN users u   ON u.id = i.logged_by
        LEFT JOIN users a   ON a.id = i.assigned_to
        WHERE i.id = $1
      `, [req.params.id])
      if (!rows[0]) return { status: 404, jsonBody: { error: 'Not found' } }
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// POST /incidents
app.http('incidents-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'incidents',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const ref = 'INC-' + Date.now().toString(36).toUpperCase()
      const { rows } = await pool.query(
        `INSERT INTO incidents (event_id, tenant_id, category, severity, description, location_zone, location_lat, location_lng, photo_url, status, logged_by, reference_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'logged',$10,$11) RETURNING *`,
        [body.event_id, body.tenant_id, body.category, body.severity, body.description,
         body.location_zone, body.location_lat, body.location_lng, body.photo_url, auth.userId, ref]
      )
      const incident = rows[0]
      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'incident.created', data: incident }).catch(() => {})
      return { status: 201, jsonBody: incident }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// PATCH /incidents/:id — update status, assigned_to, severity, category, description, resolution_notes
app.http('incidents-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'incidents/{id}',
  handler: async (req) => {
    try {
      getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { status, assigned_to, severity, category, description, resolution_notes } = body as {
        status?: string; assigned_to?: string; severity?: string; category?: string;
        description?: string; resolution_notes?: string
      }
      const { rows } = await pool.query(
        `UPDATE incidents SET
           status           = COALESCE($2, status),
           assigned_to      = COALESCE($3, assigned_to),
           severity         = COALESCE($4, severity),
           category         = COALESCE($5, category),
           description      = COALESCE($6, description),
           resolution_notes = COALESCE($7, resolution_notes),
           resolved_at      = CASE WHEN $2 = 'resolved' THEN NOW() ELSE resolved_at END
         WHERE id = $1 RETURNING *`,
        [req.params.id, status, assigned_to, severity, category, description, resolution_notes]
      )
      const incident = rows[0]
      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'incident.updated', data: incident }).catch(() => {})
      return { jsonBody: incident }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
