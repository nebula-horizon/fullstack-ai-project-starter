/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'users.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users/me',
    tokens: [{"old":"/api/v1/users/me","type":0,"val":"api","end":""},{"old":"/api/v1/users/me","type":0,"val":"v1","end":""},{"old":"/api/v1/users/me","type":0,"val":"users","end":""},{"old":"/api/v1/users/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['users.me']['types'],
  },
  'users.create': {
    methods: ["POST"],
    pattern: '/api/v1/users/create',
    tokens: [{"old":"/api/v1/users/create","type":0,"val":"api","end":""},{"old":"/api/v1/users/create","type":0,"val":"v1","end":""},{"old":"/api/v1/users/create","type":0,"val":"users","end":""},{"old":"/api/v1/users/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['users.create']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
