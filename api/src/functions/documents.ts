import { app, HttpRequest } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('documents-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'documents',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const url = new URL(req.url)
      const eventId  = url.searchParams.get('event_id')
      const tenantId = url.searchParams.get('tenant_id') ?? auth.tenantId
      let q = 'SELECT * FROM documents WHERE '
      const params: unknown[] = []
      if (eventId) { params.push(eventId); q += `event_id=$${params.length}` }
      else { params.push(tenantId); q += `tenant_id=$${params.length}` }
      q += ' ORDER BY created_at DESC'
      const { rows } = await pool.query(q, params)
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('documents-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'documents',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO documents (tenant_id, event_id, name, file_type, file_url, category, status, uploaded_by, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
        [
          body.tenant_id ?? auth.tenantId,
          body.event_id ?? null,
          body.name ?? body.title,
          body.file_type ?? 'pdf',
          body.file_url ?? null,
          body.category ?? body.type ?? 'other',
          body.status ?? 'draft',
          auth.userId ?? null,
        ]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('documents-delete', {
  methods: ['DELETE'], authLevel: 'anonymous', route: 'documents/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      await pool.query('DELETE FROM documents WHERE id=$1', [req.params.id])
      return { status: 204 }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('documents-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'documents/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { id } = req.params
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `UPDATE documents SET
          status = COALESCE($2, status),
          title = COALESCE($3, title),
          content_json = COALESCE($4, content_json),
          updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [id, body.status ?? null, body.title ?? null, body.content_json ?? null]
      )
      if (!rows.length) return { status: 404, jsonBody: { error: 'Not found' } }
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
