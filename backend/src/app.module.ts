import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import configuration from './config/configuration'
import { PrismaModule } from './prisma/prisma.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { AuditInterceptor } from './common/interceptors/audit.interceptor'
import { AuthModule } from './modules/auth/auth.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { ApplicationsModule } from './modules/applications/applications.module'
import { DocumentsModule } from './modules/documents/documents.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { CitizenModule } from './modules/citizen/citizen.module'
import { OfficerModule } from './modules/officer/officer.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { ComplaintsModule } from './modules/complaints/complaints.module'
import { SearchModule } from './modules/search/search.module'
import { AiModule } from './modules/ai/ai.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
        redact: ['req.headers.authorization', 'req.body.otp', 'req.body.refreshToken'],
        autoLogging: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: (config.get<number>('throttle.ttl') ?? 60) * 1000, limit: config.get<number>('throttle.limit') ?? 120 },
      ],
    }),
    PrismaModule,
    IntegrationsModule,
    AuthModule,
    CatalogModule,
    ApplicationsModule,
    DocumentsModule,
    NotificationsModule,
    CitizenModule,
    OfficerModule,
    AnalyticsModule,
    ComplaintsModule,
    SearchModule,
    AiModule,
    HealthModule,
  ],
  providers: [
    // Order matters: throttle → authenticate → authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
