import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

// GET /comms?event_id=&type=&limit=
app.http('comms-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'comms',
  handler: async (req) => {
    try {
      getAuth(req)
      const sp = new URL(req.url).searchParams
      const eventId = sp.get('event_id')
      const type    = sp.get('type')
      const limit   = Math.min(parseInt(sp.get('limit') ?? '100', 10), 500)

      let query = `SELECT * FROM comms_logs WHERE 1=1`
      const params: unknown[] = []
      if (eventId) { params.push(eventId); query += ` AND event_id = $${params.length}` }
      if (type)    { params.push(type);    query += ` AND type = $${params.length}` }
      params.push(limit)
      query += ` ORDER BY created_at DESC LIMIT $${params.length}`
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

// POST /comms
app.http('comms-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'comms',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      // Get logger name
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [auth.userId])
      const loggedByName = userRes.rows[0]?.name ?? 'Unknown'
      const { rows } = await pool.query(
        `INSERT INTO comms_logs (event_id, tenant_id, type, direction, from_callsign, to_callsign, channel, message, linked_incident_id, logged_by, logged_by_name)
         VALUES ($1,$2,$3,COALESCE($4,'internal'),$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [body.event_id, body.tenant_id, body.type, body.direction, body.from_callsign,
         body.to_callsign, body.channel, body.message, body.linked_incident_id ?? null,
         auth.userId, loggedByName]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

// GET /broadcasts?event_id=
app.http('broadcasts-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'broadcasts',
  handler: async (req) => {
    try {
      getAuth(req)
      const eventId = new URL(req.url).searchParams.get('event_id')
      let query = `SELECT * FROM broadcasts WHERE 1=1`
      const params: unknown[] = []
      if (eventId) { params.push(eventId); query += ` AND event_id = $${params.length}` }
      query += ' ORDER BY created_at DESC LIMIT 50'
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

// POST /broadcasts
app.http('broadcasts-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'broadcasts',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [auth.userId])
      const sentByName = userRes.rows[0]?.name ?? 'Unknown'
      const { rows } = await pool.query(
        `INSERT INTO broadcasts (event_id, tenant_id, message, priority, sent_by, sent_by_name, target_roles)
         VALUES ($1,$2,$3,COALESCE($4,'normal'),$5,$6,COALESCE($7,'{}')) RETURNING *`,
        [body.event_id, body.tenant_id, body.message, body.priority, auth.userId, sentByName,
         body.target_roles]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
