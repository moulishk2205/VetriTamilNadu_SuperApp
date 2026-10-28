import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json, urlencoded, type NextFunction, type Request, type Response } from 'express'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import { AppModule } from './app.module'
import type { AppConfig } from './config/configuration'

async function bootstrap(): Promise<void> {
  // Bodies are parsed here, not by Nest, so a malformed body gets a generic 400:
  // Nest would otherwise echo the JSON parser's message back to the client.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, bodyParser: false })
  app.use(json({ limit: '100kb' }), urlencoded({ extended: true, limit: '100kb' }))
  app.use((err: { status?: number; type?: string }, req: Request, res: Response, next: NextFunction) => {
    if (!err?.type?.startsWith('entity.') && !(err instanceof SyntaxError)) return next(err)
    const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 400
    res.status(status).json({ statusCode: status, message: 'Malformed request body', path: req.path, timestamp: new Date().toISOString() })
  })
  app.useLogger(app.get(Logger))

  const config = app.get(ConfigService)
  const port = config.get<AppConfig['port']>('port') ?? 4000
  const apiPrefix = config.get<AppConfig['apiPrefix']>('apiPrefix') ?? 'api'
  const corsOrigin = config.get<AppConfig['corsOrigin']>('corsOrigin') ?? '*'
  const swaggerEnabled = config.get<AppConfig['swagger']>('swagger') === true
  const docsPath = `/${apiPrefix}/docs`

  // Behind a load balancer, set TRUST_PROXY (e.g. 1 = one hop) so throttling
  // and audit IPs use the client address, not the proxy's.
  const trustProxy = process.env.TRUST_PROXY
  if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy)

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
