/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const UsersController = () => import('#controllers/users_controller')

router.get('/health', async ({ response }) => {
  return response.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

router
  .group(() => {
    router.get('me', [UsersController, 'me']).use(middleware.jwt())
    router.post('create', [UsersController, 'create'])
  })
  .prefix('/api/v1/users')
