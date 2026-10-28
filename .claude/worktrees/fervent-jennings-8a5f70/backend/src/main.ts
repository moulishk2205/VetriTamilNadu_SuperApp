import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import type { NextFunction, Request, Response } from 'express'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import { AppModule } from './app.module'
import type { AppConfig } from './config/configuration'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const config = app.get(ConfigService)
  const port = config.get<AppConfig['port']>('port') ?? 4000
  const apiPrefix = config.get<AppConfig['apiPrefix']>('apiPrefix') ?? 'api'
  const corsOrigin = config.get<AppConfig['corsOrigin']>('corsOrigin') ?? '*'
  const swaggerEnabled = config.get<AppConfig['swagger']>('swagger') === true
  const docsPath = `/${apiPrefix}/docs`

  // /health stays at the root for probes; everything else is under /api.
  app.setGlobalPrefix(apiPrefix, { exclude: ['health'] })
  // The API only returns JSON, so its CSP allows nothing to load or frame it.
  // Swagger UI (non-production only) keeps helmet's default page CSP.
  const apiHelmet = helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] },
    },
  })
  const docsHelmet = helmet({ crossOriginResourcePolicy: false })
  app.use((req: Request, res: Response, next: NextFunction) =>
    (swaggerEnabled && req.path.startsWith(docsPath) ? docsHelmet : apiHelmet)(req, res, next),
  )
  app.enableCors({ origin: corsOrigin.split(','), credentials: true })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false, transformOptions: { enableImplicitConversion: true } }),
  )
  // AllExceptionsFilter is registered globally via APP_FILTER in AppModule (DI-enabled).
  app.enableShutdownHooks()

  // The API description is not published in production unless SWAGGER=true.
  if (swaggerEnabled) {
    const swagger = new DocumentBuilder()
      .setTitle('Vetri Tamil Nadu API')
      .setDescription('Digital Governance Platform — REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    SwaggerModule.setup(`${apiPrefix}/docs`, app, SwaggerModule.createDocument(app, swagger))
  }

  await app.listen(port)
  const url = await app.getUrl()
  // eslint-disable-next-line no-console
  console.log(`Vetri backend → ${url}/${apiPrefix}${swaggerEnabled ? `  ·  docs at ${url}${docsPath}` : ''}`)
}

void bootstrap()
