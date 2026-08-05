import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
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

  // /health stays at the root for probes; everything else is under /api.
  app.setGlobalPrefix(apiPrefix, { exclude: ['health'] })
  app.use(helmet({ crossOriginResourcePolicy: false }))
  app.enableCors({ origin: corsOrigin.split(','), credentials: true })
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false, transformOptions: { enableImplicitConversion: true } }),
  )
  // AllExceptionsFilter is registered globally via APP_FILTER in AppModule (DI-enabled).
  app.enableShutdownHooks()

  const swagger = new DocumentBuilder()
    .setTitle('Vetri Tamil Nadu API')
    .setDescription('Digital Governance Platform — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup(`${apiPrefix}/docs`, app, SwaggerModule.createDocument(app, swagger))

  await app.listen(port)
  const url = await app.getUrl()
  // eslint-disable-next-line no-console
  console.log(`Vetri backend → ${url}/${apiPrefix}  ·  docs at ${url}/${apiPrefix}/docs`)
}

void bootstrap()
