import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * Writes an audit entry for every mutating request (POST/PUT/PATCH/DELETE).
 * Read requests are not audited to keep the trail signal-rich.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest()
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    return next.handle().pipe(
      tap(() => {
        if (!mutating) return
        const user = req.user as { sub?: string; role?: string } | undefined
        void this.prisma.auditLog
          .create({
            data: {
              actor: user ? `${user.role}:${user.sub}` : 'anonymous',
              action: `${req.method} ${req.route?.path ?? req.url}`,
              entity: (req.baseUrl || req.url).split('/')[2] ?? 'api',
              entityId: req.params?.id ?? '-',
            },
          })
          .catch(() => undefined)
      }),
    )
  }
}
