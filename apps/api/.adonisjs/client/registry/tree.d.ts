/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  users: {
    me: typeof routes['users.me']
    create: typeof routes['users.create']
  }
}
