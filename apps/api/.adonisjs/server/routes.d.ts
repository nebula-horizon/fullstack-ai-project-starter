import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'users.me': { paramsTuple?: []; params?: {} }
    'users.create': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'users.me': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'users.me': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'users.create': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}