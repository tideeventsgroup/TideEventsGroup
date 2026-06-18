import { app, HttpRequest } from '@azure/functions'
import { WebPubSubServiceClient } from '@azure/web-pubsub'
import { getAuth } from '../auth'

app.http('realtime-negotiate', {
  methods: ['POST'], authLevel: 'anonymous', route: 'realtime/negotiate',
  handler: async (req) => {
    try {
      const auth = getAuth(req)
      const cs = process.env.WEBPUBSUB_CONNECTION_STRING
      if (!cs) return { status: 503, jsonBody: { error: 'Realtime not configured' } }
      const client = new WebPubSubServiceClient(cs, 'incidents')
      const token = await client.getClientAccessToken({ userId: auth.userId, roles: ['webpubsub.joinLeaveGroup', 'webpubsub.sendToGroup'] })
      return { jsonBody: { url: token.url } }
    } catch (e: any) { return { status: 401, jsonBody: { error: e.message } } }
  }
})
