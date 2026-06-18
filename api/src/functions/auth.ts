import { app, HttpRequest, HttpResponseInit } from '@azure/functions'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
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

app.http('login-microsoft', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/microsoft',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const tenantId = process.env.AZURE_AD_TENANT_ID
    const clientId = process.env.AZURE_AD_CLIENT_ID
    if (!tenantId || !clientId) return { status: 503, jsonBody: { error: 'Microsoft SSO not configured' } }

    const { code, codeVerifier, redirectUri } = await req.json() as { code: string; codeVerifier: string; redirectUri: string }
    if (!code || !codeVerifier || !redirectUri) {
      return { status: 400, jsonBody: { error: 'code, codeVerifier and redirectUri are required' } }
    }

    try {
      // Exchange authorisation code for tokens
      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
          scope: 'openid profile email',
        }).toString(),
      })

      const tokens = await tokenRes.json() as { id_token?: string; error?: string; error_description?: string }
      if (!tokenRes.ok || !tokens.id_token) {
        return { status: 401, jsonBody: { error: tokens.error_description ?? tokens.error ?? 'Token exchange failed' } }
      }

      // Validate id_token signature via Microsoft's public JWKS
      const client = jwksClient({
        jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600_000,
      })

      const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
        jwt.verify(
          tokens.id_token!,
          (header, callback) => {
            client.getSigningKey(header.kid, (err, key) => callback(err, key?.getPublicKey()))
          },
          { algorithms: ['RS256'] },
          (err, payload) => { if (err) reject(err); else resolve(payload as jwt.JwtPayload) }
        )
      })

      const email = (decoded.preferred_username ?? decoded.email ?? decoded.upn ?? '').toLowerCase()
      if (!email) return { status: 401, jsonBody: { error: 'Could not determine email from Microsoft token' } }

      const { rows } = await pool.query(
        'SELECT id, email, name, role, tenant_id FROM users WHERE email = $1',
        [email]
      )
      const user = rows[0]
      if (!user) {
        return { status: 403, jsonBody: { error: 'No Tide IMS account found. Contact your administrator.' } }
      }
      if (!['super_admin', 'tide_consultant'].includes(user.role)) {
        return { status: 403, jsonBody: { error: 'Microsoft sign-in is only available for Tide employees.' } }
      }

      const token = signToken({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenant_id })
      return { jsonBody: { token, user } }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { status: 401, jsonBody: { error: `Microsoft sign-in failed: ${message}` } }
    }
  }
})

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const auth = getAuth(req)
      const { rows } = await pool.query(
        'SELECT id, email, name, role, tenant_id, phone, created_at FROM users WHERE id = $1',
        [auth.userId]
      )
      if (!rows[0]) return { status: 404, jsonBody: { error: 'User not found' } }
      return { jsonBody: rows[0] }
    } catch { return { status: 401, jsonBody: { error: 'Unauthorized' } } }
  }
})
