export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  profiles: {
    id: string
    email: string
    full_name: string | null
    created_at: string
  }
}
