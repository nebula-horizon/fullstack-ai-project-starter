import { test } from '@japa/runner'
import { SignJWT } from 'jose'
import env from '#start/env'

test.group('JWT Auth Middleware integration tests', () => {
  test('passes with a valid signed JWT token', async ({ client }) => {
    const secret = new TextEncoder().encode(env.get('JWT_SECRET'))
    const token = await new SignJWT({
      sub: 'test-user-id',
      email: 'john@example.com',
      fullName: 'John Doe',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret)

    const response = await client.get('/api/v1/users/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(404)
  })

  test('fails with an expired JWT token returning 401', async ({ client }) => {
    const secret = new TextEncoder().encode(env.get('JWT_SECRET'))
    const token = await new SignJWT({
      sub: 'test-user-id',
      email: 'john@example.com',
      fullName: 'John Doe',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(secret)

    const response = await client.get('/api/v1/users/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(401)
    response.assertBodyContains({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    })
  })

  test('fails with an empty authorization header returning 401', async ({ client }) => {
    const response = await client.get('/api/v1/users/me')

    response.assertStatus(401)
    response.assertBodyContains({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is missing',
      },
    })
  })

  test('fails with invalid authorization format returning 401', async ({ client }) => {
    const response = await client
      .get('/api/v1/users/me')
      .header('Authorization', 'InvalidFormatToken')

    response.assertStatus(401)
    response.assertBodyContains({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authorization format. Use: Bearer <token>',
      },
    })
  })
})
