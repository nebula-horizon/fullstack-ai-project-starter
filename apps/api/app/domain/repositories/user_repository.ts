import type { User } from '../entities/user.js'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  create(user: Omit<User, 'createdAt'>): Promise<User>
}
