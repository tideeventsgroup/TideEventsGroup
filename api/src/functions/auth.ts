import { app, HttpRequest, HttpResponseInit } from '@azure/functions'
import bcrypt from 'bcrypt'
import pool from '../db'
import { signToken, getAuth } from '../auth'

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const { email, password } = await req.json() as { email: string; password: string }
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    const user = rows[0]
    if (!user) return { status: 401, jsonBody: { error: 'Invalid credentials' } }
    const valid = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : user.pin === password
    if (!valid) return { status: 401, jsonBody: { error: 'Invalid credentials' } }
    const token = signToken({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenant_id })
    const { password_hash, pin, ...safeUser } = user
    return { jsonBody: { token, user: safeUser } }
  }
})

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const auth = getAuth(req)
      const { rows } = await pool.query('SELECT id, email, name, role, tenant_id, phone, created_at FROM users WHERE id = $1', [auth.userId])
      if (!rows[0]) return { status: 404, jsonBody: { error: 'User not found' } }
      return { jsonBody: rows[0] }
    } catch { return { status: 401, jsonBody: { error: 'Unauthorized' } } }
  }
})
