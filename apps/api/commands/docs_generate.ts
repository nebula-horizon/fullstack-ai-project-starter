import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { BaseCommand } from '@adonisjs/core/ace'

export default class DocsGenerate extends BaseCommand {
  static commandName = 'docs:generate'
  static description =
    'Scans Adonis routes and converts them to Swagger format directly in packages/contracts/openapi.yaml'

  static options = {
    startApp: true,
  }

  static async getMetaData() {
    return {
      commandName: DocsGenerate.commandName,
      description: DocsGenerate.description,
      args: [],
      flags: [],
      aliases: [],
      options: DocsGenerate.options,
    }
  }

  async run() {
    const router = await this.app.container.make('router')
    // Routes are registered by the #start/routes preload but only committed
    // during HTTP server boot, which does not happen under ace. Commit here so
    // router.toJSON() actually returns the route tree.
    router.commit()
    const routes = router.toJSON()

    const autoSwaggerModule = await import('@rnwonder/adonis-autoswagger')
    // Unwrap whatever interop shape the (CJS) package resolves to.
    const AutoSwagger =
      autoSwaggerModule.default?.default ?? autoSwaggerModule.default ?? autoSwaggerModule
    const swaggerModule = await import('../config/swagger.js')
    const swagger = swaggerModule.default || swaggerModule

    // Call generate() directly rather than docs(): docs() short-circuits to
    // reading a cached swagger.yml whenever options.productionEnv defaults to
    // "production", which would never reflect the current routes. A build
    // command must always regenerate from the live route tree. generate()/
    // jsonToYaml() are not on the published types, so cast to the known shape.
    const generator = AutoSwagger as unknown as {
      generate: (routes: unknown, options: unknown) => Promise<unknown>
      jsonToYaml: (json: unknown) => string
    }
    const swaggerJson = await generator.generate(routes, swagger)
    const yamlContent = generator.jsonToYaml(swaggerJson)

    const outputPath = '../../packages/contracts/openapi.yaml'
    mkdirSync(dirname(outputPath), { recursive: true })

    writeFileSync(outputPath, yamlContent, 'utf-8')
    this.logger.success(`Swagger documentation successfully written to ${outputPath}`)
  }
}
