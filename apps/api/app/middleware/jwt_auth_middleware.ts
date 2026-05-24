import type { HttpContext } from '@adonisjs/core/http'
import { jwtVerify } from 'jose'
import env from '#start/env'

export interface DecodedToken {
  sub: string
  email: string
  fullName: string | null
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: DecodedToken
  }
}

export default class JwtAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader) {
      return ctx.response.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is missing',
        },
      })
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return ctx.response.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization format. Use: Bearer <token>',
        },
      })
    }

    const token = parts[1]

    try {
      const secret = new TextEncoder().encode(env.get('JWT_SECRET'))
      const { payload } = await jwtVerify(token, secret)

      ctx.user = {
        sub: payload.sub as string,
        email: payload.email as string,
        fullName: (payload.fullName || payload.full_name) as string | null,
      }

      await next()
    } catch {
      return ctx.response.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      })
    }
  }
}
