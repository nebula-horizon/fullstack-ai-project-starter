import type { HttpContext } from '@adonisjs/core/http'
import { KyselyUserRepository } from '#infrastructure/repositories/KyselyUserRepository'

export default class UsersController {
  private userRepository = new KyselyUserRepository()

  /**
   * @me
   * @operationId me
   * @responseBody 200 - { "id": "string", "email": "string", "fullName": "string" }
   */
  async me({ response, user }: HttpContext) {
    if (!user) {
      return response.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      })
    }

    try {
      const domainUser = await this.userRepository.findById(user.sub)

      if (!domainUser) {
        return response.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        })
      }

      return response.ok(domainUser)
    } catch (_e) {
      return response.status(404).send({
        id: user.sub,
        email: user.email,
        fullName: user.fullName,
      })
    }
  }

  /**
   * @create
   * @operationId create
   * @requestBody {"id": "string", "email": "string", "fullName": "string"}
   * @responseBody 210 - { "id": "string", "email": "string", "fullName": "string" }
   */
  async create({ request, response }: HttpContext) {
    const { id, email, fullName } = request.only(['id', 'email', 'fullName'])

    if (!id || !email) {
      return response.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'id and email are required',
        },
      })
    }

    try {
      const created = await this.userRepository.create({
        id,
        email,
        fullName: fullName || null,
      })
      return response.status(210).send(created)
    } catch (e) {
      return response.status(500).send({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: e instanceof Error ? e.message : 'Could not create user',
        },
      })
    }
  }
}
