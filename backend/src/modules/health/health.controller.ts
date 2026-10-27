import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { Public } from '../../common/decorators/public.decorator'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Liveness/readiness probe. Mounted at the root (`/health`, excluded from the
 * global `/api` prefix) so container orchestrators and the frontend can check it
 * without auth. Reports real database connectivity, and answers 503 when the
 * database is down so probes and load balancers take the instance out.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    let db: 'up' | 'down' = 'down'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      db = 'up'
    } catch {
      db = 'down'
    }
    if (db === 'down') res.status(HttpStatus.SERVICE_UNAVAILABLE)
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }
}
