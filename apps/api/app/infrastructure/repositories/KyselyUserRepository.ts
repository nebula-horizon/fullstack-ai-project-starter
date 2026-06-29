import { db } from '#services/db'
import type { User } from '../../domain/entities/user.js'
import type { UserRepository } from '../../domain/repositories/user_repository.js'

export class KyselyUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await db.selectFrom('profiles').selectAll().where('id', '=', id).executeTakeFirst()

    if (!row) {
      return null
    }

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    }
  }

  async create(user: Omit<User, 'createdAt'>): Promise<User> {
    const row = await db
      .insertInto('profiles')
      .values({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        created_at: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    }
  }
}
