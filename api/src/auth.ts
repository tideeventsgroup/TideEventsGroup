import jwt from 'jsonwebtoken'
import { HttpRequest } from '@azure/functions'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  tenantId: string | null
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload
}

export function getAuth(req: HttpRequest): TokenPayload {
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ')) throw new Error('Unauthorized')
  return verifyToken(auth.slice(7))
}
