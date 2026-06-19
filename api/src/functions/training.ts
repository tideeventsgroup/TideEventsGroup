import { app } from '@azure/functions'
import pool from '../db'
import { getAuth } from '../auth'

app.http('training-courses-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'training/courses',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const { rows } = await pool.query('SELECT * FROM training_courses ORDER BY title')
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('training-courses-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'training/courses',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO training_courses (title, modules_json, pass_mark)
         VALUES ($1,$2,$3) RETURNING *`,
        [body.title, body.modules_json, body.pass_mark]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})

app.http('training-completions-list', {
  methods: ['GET'], authLevel: 'anonymous', route: 'training/completions',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const tenantId = new URL(req.url).searchParams.get('tenant_id') ?? auth.tenantId
      const { rows } = await pool.query(
        `SELECT tc.*, u.name as user_name, u.email as user_email, c.title as course_title
         FROM training_completions tc
         LEFT JOIN users u ON u.id = tc.user_id
         LEFT JOIN training_courses c ON c.id = tc.course_id
         WHERE u.tenant_id = $1
         ORDER BY tc.completed_at DESC`,
        [tenantId]
      )
      return { jsonBody: rows }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})

app.http('training-completions-create', {
  methods: ['POST'], authLevel: 'anonymous', route: 'training/completions',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const body = await req.json() as Record<string, unknown>
      const { rows } = await pool.query(
        `INSERT INTO training_completions (user_id, course_id, score, passed, certificate_url)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [body.user_id, body.course_id, body.score, body.passed, body.certificate_url]
      )
      return { status: 201, jsonBody: rows[0] }
    } catch (e: any) { return { status: 500, jsonBody: { error: e.message } } }
  }
})
