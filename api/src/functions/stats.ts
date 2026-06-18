import { app, HttpRequest } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('stats', {
  methods: ['GET'], authLevel: 'anonymous', route: 'stats',
  handler: async (req) => {
    try {
      getAuth(req)
      const [tenants, events, incidents] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM tenants'),
        pool.query("SELECT COUNT(*) FROM events WHERE status = 'live'"),
        pool.query("SELECT COUNT(*) FROM incidents WHERE status != 'resolved'"),
      ])
      return { jsonBody: {
        totalClients: parseInt(tenants.rows[0].count),
        activeEvents: parseInt(events.rows[0].count),
        liveIncidents: parseInt(incidents.rows[0].count),
        pendingActions: 0,
      }}
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
