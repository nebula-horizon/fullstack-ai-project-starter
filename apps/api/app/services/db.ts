import type { Database } from '@template/db'
import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import env from '#start/env'

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: env.get('DATABASE_URL'),
    max: 10,
  }),
})

export const db = new Kysely<Database>({
  dialect,
})
