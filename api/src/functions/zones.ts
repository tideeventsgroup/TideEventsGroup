import { app, HttpRequest, HttpResponseInit } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('zones-list', {
  route: 'zones', methods: ['GET'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      const eventId = req.query.get('event_id')
      if (!eventId) return { status: 400, jsonBody: { error: 'event_id required' } }
      const { rows } = await pool.query('SELECT * FROM site_zones WHERE event_id=$1 ORDER BY zone_type, name', [eventId])
      return { jsonBody: rows }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  },
})

app.http('zones-create', {
  route: 'zones', methods: ['POST'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { event_id, tenant_id, name, zone_type, capacity, description, grid_ref, status } = body
      if (!event_id || !name) return { status: 400, jsonBody: { error: 'event_id, name required' } }
      const { rows } = await pool.query(
        `INSERT INTO site_zones (event_id, tenant_id, name, zone_type, capacity, description, grid_ref, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [event_id, tenant_id ?? null, name, zone_type ?? 'other', capacity ?? null, description ?? null, grid_ref ?? null, status ?? 'active']
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  },
})

app.http('zones-patch', {
  route: 'zones/{id}', methods: ['PATCH'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const sets: string[] = []
      const vals: unknown[] = []
      for (const [k, v] of Object.entries(body)) {
        if (['name','zone_type','capacity','description','grid_ref','status'].includes(k)) {
          vals.push(v); sets.push(`${k}=$${vals.length}`)
        }
      }
      if (sets.length === 0) return { status: 400, jsonBody: { error: 'Nothing to update' } }
      vals.push(req.params.id)
      const { rows } = await pool.query(`UPDATE site_zones SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`, vals)
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  },
})

app.http('zones-delete', {
  route: 'zones/{id}', methods: ['DELETE'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      await pool.query('DELETE FROM site_zones WHERE id=$1', [req.params.id])
      return { status: 204 }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  },
})
