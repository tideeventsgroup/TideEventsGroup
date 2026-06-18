import { app } from '@azure/functions'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import pool from '../db'
import { getAuth } from '../auth'

function getPubSub() {
  const cs = process.env.WEBPUBSUB_CONNECTION_STRING
  if (!cs) return null
  return new WebPubSubServiceClient(cs, 'incidents')
}

async function nextCadNumber(eventId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM incidents WHERE event_id = $1`, [eventId]
  )
  const n = parseInt(rows[0].count) + 1
  const year = new Date().getFullYear()
  return `TIDE-${year}-${String(n).padStart(4, '0')}`
}

// GET /incidents
app.http('incidents-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'incidents',
  handler: async (req) => {
    try {
      getAuth(req)
      const sp       = new URL(req.url).searchParams
      const eventId  = sp.get('event_id')
      const tenantId = sp.get('tenant_id')
      const priority = sp.get('priority')
      const category = sp.get('category')
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
      if (priority) { params.push(priority); query += ` AND i.priority  = $${params.length}` }
      if (category) { params.push(category); query += ` AND i.category  = $${params.length}` }
      if (status)   { params.push(status);   query += ` AND i.status    = $${params.length}` }
      if (search) {
        params.push(`%${search}%`)
        query += ` AND (i.cad_number ILIKE $${params.length} OR i.description ILIKE $${params.length} OR i.location_zone ILIKE $${params.length} OR i.incident_type ILIKE $${params.length})`
      }
      params.push(limit)
      query += ` ORDER BY CASE i.priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 ELSE 5 END, i.created_at DESC LIMIT $${params.length}`
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

      // Also fetch actions
      const { rows: actions } = await pool.query(
        `SELECT ia.*, u.name AS performed_by_name FROM incident_actions ia LEFT JOIN users u ON u.id = ia.performed_by WHERE ia.incident_id = $1 ORDER BY ia.created_at ASC`,
        [req.params.id]
      )
      return { jsonBody: { ...rows[0], actions } }
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
      const cadNumber = await nextCadNumber(body.event_id as string)
      const { rows } = await pool.query(
        `INSERT INTO incidents (event_id, tenant_id, cad_number, priority, category, incident_type, severity, description, location_zone, location_lat, location_lng, photo_url, status, logged_by, reference_number)
         VALUES ($1,$2,$3,COALESCE($4,'P3'),$5,$6,$7,$8,$9,$10,$11,$12,'new',$13,$3) RETURNING *`,
        [body.event_id, body.tenant_id, cadNumber, body.priority, body.category, body.incident_type,
         body.severity, body.description, body.location_zone, body.location_lat, body.location_lng,
         body.photo_url, auth.userId]
      )
      const incident = rows[0]
      // Log creation action
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [auth.userId])
      await pool.query(
        `INSERT INTO incident_actions (incident_id, action_type, note, performed_by, performed_by_name) VALUES ($1,'created','Incident created',$2,$3)`,
        [incident.id, auth.userId, userRes.rows[0]?.name]
      )
      // Audit
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, user_name, action, entity_type, entity_id, new_value) VALUES ($1,$2,$3,'incident.created','incident',$4,$5)`,
        [body.tenant_id, auth.userId, userRes.rows[0]?.name, incident.id, JSON.stringify(incident)]
      )
      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'incident.created', data: incident }).catch(() => {})
      return { status: 201, jsonBody: incident }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// PATCH /incidents/:id
app.http('incidents-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'incidents/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { status, assigned_to, priority, category, incident_type, severity, description, resolution_notes, location_zone } = body as {
        status?: string; assigned_to?: string; priority?: string; category?: string;
        incident_type?: string; severity?: string; description?: string;
        resolution_notes?: string; location_zone?: string
      }

      const { rows: old } = await pool.query('SELECT * FROM incidents WHERE id=$1', [req.params.id])
      if (!old[0]) return { status: 404, jsonBody: { error: 'Not found' } }

      const { rows } = await pool.query(
        `UPDATE incidents SET
           status           = COALESCE($2, status),
           assigned_to      = COALESCE($3, assigned_to),
           priority         = COALESCE($4, priority),
           category         = COALESCE($5, category),
           incident_type    = COALESCE($6, incident_type),
           severity         = COALESCE($7, severity),
           description      = COALESCE($8, description),
           resolution_notes = COALESCE($9, resolution_notes),
           location_zone    = COALESCE($10, location_zone),
           updated_at       = NOW(),
           resolved_at      = CASE WHEN $2 = 'resolved' AND resolved_at IS NULL THEN NOW() ELSE resolved_at END,
           closed_at        = CASE WHEN $2 = 'closed' AND closed_at IS NULL THEN NOW() ELSE closed_at END
         WHERE id = $1 RETURNING *`,
        [req.params.id, status, assigned_to, priority, category, incident_type, severity, description, resolution_notes, location_zone]
      )
      const incident = rows[0]

      // Log the status change action
      if (status && status !== old[0].status) {
        const userRes = await pool.query('SELECT name FROM users WHERE id=$1', [auth.userId])
        const actionNote = `Status changed: ${old[0].status} → ${status}`
        await pool.query(
          `INSERT INTO incident_actions (incident_id, action_type, note, performed_by, performed_by_name) VALUES ($1,'status_change',$2,$3,$4)`,
          [incident.id, actionNote, auth.userId, userRes.rows[0]?.name]
        )
      }

      const pubsub = getPubSub()
      if (pubsub) await pubsub.sendToAll({ type: 'incident.updated', data: incident }).catch(() => {})
      return { jsonBody: incident }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// POST /incidents/:id/actions
app.http('incidents-add-action', {
  methods: ['POST'], authLevel: 'anonymous', route: 'incidents/{id}/actions',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const userRes = await pool.query('SELECT name FROM users WHERE id=$1', [auth.userId])
      const { rows } = await pool.query(
        `INSERT INTO incident_actions (incident_id, action_type, note, performed_by, performed_by_name) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [req.params.id, body.action_type ?? 'update', body.note, auth.userId, userRes.rows[0]?.name]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
