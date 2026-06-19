import { app, HttpRequest } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('audit-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'audit',
  handler: async (req) => {
    try {
      getAuth(req)
      const url = new URL(req.url)
      const from = url.searchParams.get('from')
      const to = url.searchParams.get('to')
      const limit = parseInt(url.searchParams.get('limit') ?? '500')
      let query = `SELECT a.*, u.name as user_name, u.email as user_email, t.name as tenant_name
                   FROM audit_log a
                   LEFT JOIN users u ON u.id = a.user_id
                   LEFT JOIN tenants t ON t.id = a.tenant_id
                   WHERE 1=1`
      const params: unknown[] = []
      if (from) { params.push(from); query += ` AND a.created_at >= $${params.length}` }
      if (to) { params.push(to + 'T23:59:59'); query += ` AND a.created_at <= $${params.length}` }
      params.push(limit); query += ` ORDER BY a.created_at DESC LIMIT $${params.length}`
      const { rows } = await pool.query(query, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
