import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  path: `${join(__dirname, '..')}/`,
  title: 'Template API',
  version: '0.1.0',
  description: 'Clean-Architecture AdonisJS Backend API',
  tagIndex: 1,
  info: {
    title: 'Template API',
    version: '0.1.0',
    description: 'Clean-Architecture AdonisJS Backend API',
  },
  snakeCase: true,
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {},
  },
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  defaultSecuritySchema: 'BearerAuth',
  persistAuthorization: true,
  showRequestHeaders: true,
}
