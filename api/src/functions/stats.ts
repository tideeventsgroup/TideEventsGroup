import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('stats', {
  methods: ['GET'], authLevel: 'anonymous', route: 'stats',
  handler: async (req) => {
    try {
      getAuth(req)
      const [tenants, events, incidents, severities, statuses, categories, trend, mttr] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM tenants'),
        pool.query("SELECT COUNT(*) FROM events WHERE status = 'live'"),
        pool.query("SELECT COUNT(*) FROM incidents WHERE status != 'resolved'"),
        pool.query(`SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity`),
        pool.query(`SELECT status,   COUNT(*) as count FROM incidents GROUP BY status`),
        pool.query(`SELECT category, COUNT(*) as count FROM incidents GROUP BY category ORDER BY count DESC LIMIT 8`),
        pool.query(`
          SELECT DATE(created_at) as day, COUNT(*) as count
          FROM incidents
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at) ORDER BY day ASC
        `),
        pool.query(`
          SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60)) as avg_minutes
          FROM incidents WHERE resolved_at IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'
        `),
      ])
      return { jsonBody: {
        totalClients:    parseInt(tenants.rows[0].count),
        activeEvents:    parseInt(events.rows[0].count),
        liveIncidents:   parseInt(incidents.rows[0].count),
        pendingActions:  0,
        bySeverity:      Object.fromEntries(severities.rows.map(r => [r.severity, parseInt(r.count)])),
        byStatus:        Object.fromEntries(statuses.rows.map(r => [r.status, parseInt(r.count)])),
        byCategory:      categories.rows.map(r => ({ category: r.category, count: parseInt(r.count) })),
        trend7d:         trend.rows.map(r => ({ day: r.day, count: parseInt(r.count) })),
        avgResolutionMin: parseInt(mttr.rows[0]?.avg_minutes ?? '0') || 0,
      }}
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
