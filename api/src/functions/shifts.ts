import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('shifts-list', {
  route: 'shifts', methods: ['GET'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      const eventId = req.query.get('event_id')
      const from    = req.query.get('from')
      const to      = req.query.get('to')
      if (!eventId) return { status: 400, jsonBody: { error: 'event_id required' } }
      let q = 'SELECT * FROM staff_schedules WHERE event_id=$1'
      const params: unknown[] = [eventId]
      if (from) { params.push(from); q += ` AND date >= $${params.length}` }
      if (to)   { params.push(to);   q += ` AND date <= $${params.length}` }
      q += ' ORDER BY date, start_time'
      const { rows } = await pool.query(q, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: e.message?.includes('auth') ? 401 : 500, jsonBody: { error: e.message } } }
  },
})

app.http('shifts-create', {
  route: 'shifts', methods: ['POST'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { event_id, staff_name, role, date, start_time, end_time, zone, notes } = body
      if (!event_id || !staff_name || !date) return { status: 400, jsonBody: { error: 'event_id, staff_name, date required' } }
      const { rows } = await pool.query(
        `INSERT INTO staff_schedules (event_id, staff_name, role, date, start_time, end_time, zone, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [event_id, staff_name, role ?? 'other', date, start_time ?? '08:00', end_time ?? '16:00', zone ?? null, notes ?? null]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  },
})

app.http('shifts-delete', {
  route: 'shifts/{id}', methods: ['DELETE'], authLevel: 'anonymous',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      getAuth(req)
      await pool.query('DELETE FROM staff_schedules WHERE id=$1', [req.params.id])
      return { status: 204 }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  },
})
