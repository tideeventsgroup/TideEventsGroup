import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('risks-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'risks',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const eventId = new URL(req.url).searchParams.get('event_id')
      const { rows } = await pool.query(
        'SELECT * FROM risks WHERE event_id = $1 ORDER BY created_at DESC',
        [eventId]
      )
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('risks-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'risks',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const likelihood = Number(body.likelihood)
      const severity = Number(body.severity)
      const risk_score = likelihood * severity
      const flagged_high = risk_score >= 15
      const { rows } = await pool.query(
        `INSERT INTO risks (event_id, tenant_id, hazard, who_at_risk, existing_controls, likelihood, severity, risk_score, flagged_high, responsible_person, review_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          body.event_id,
          body.tenant_id ?? auth.tenantId,
          body.hazard,
          body.who_at_risk,
          body.controls,
          likelihood,
          severity,
          risk_score,
          flagged_high,
          body.responsible_person,
          body.review_date,
        ]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('risks-update', {
  methods: ['PATCH'], authLevel: 'anonymous', route: 'risks/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { id } = req.params
      const body = await req.json() as Record<string, unknown>

      // Fetch current values to recalculate risk_score if needed
      const current = await pool.query('SELECT likelihood, severity FROM risks WHERE id = $1', [id])
      if (!current.rows.length) return { status: 404, jsonBody: { error: 'Not found' } }

      const likelihood = body.likelihood !== undefined ? Number(body.likelihood) : current.rows[0].likelihood
      const severity = body.severity !== undefined ? Number(body.severity) : current.rows[0].severity
      const risk_score = likelihood * severity
      const flagged_high = risk_score >= 15

      const { rows } = await pool.query(
        `UPDATE risks SET
          hazard = COALESCE($2, hazard),
          who_at_risk = COALESCE($3, who_at_risk),
          existing_controls = COALESCE($4, existing_controls),
          likelihood = $5,
          severity = $6,
          risk_score = $7,
          flagged_high = $8,
          responsible_person = COALESCE($9, responsible_person),
          review_date = COALESCE($10, review_date),
          updated_at = NOW()
        WHERE id = $1 RETURNING *`,
        [
          id,
          body.hazard ?? null,
          body.who_at_risk ?? null,
          body.controls ?? null,
          likelihood,
          severity,
          risk_score,
          flagged_high,
          body.responsible_person ?? null,
          body.review_date ?? null,
        ]
      )
      return { jsonBody: rows[0] }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('risks-delete', {
  methods: ['DELETE'], authLevel: 'anonymous', route: 'risks/{id}',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { id } = req.params
      await pool.query('DELETE FROM risks WHERE id = $1', [id])
      return { status: 204 }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
