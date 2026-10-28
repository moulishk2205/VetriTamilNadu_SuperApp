import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { Request } from 'express'
import { Observable, tap } from 'rxjs'
import { AuditService } from '../audit/audit.service'
import type { JwtUser } from '../decorators/current-user.decorator'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * One audit row per mutating request (POST/PUT/PATCH/DELETE) to a real route,
 * attributed to the signed-in user (role:userId) or "anonymous". Failures are
 * recorded too: AllExceptionsFilter calls this for rejected requests, including
 * guard rejections, which never reach an interceptor. Bodies are never stored.
 */
export function auditRequest(audit: AuditService, req: Request, status?: number): void {
  // Throttled (429) requests are skipped so a flood can't turn into audit writes.
  if (!MUTATING.has(req.method) || !req.route || status === 429) return
  const user = req.user as JwtUser | undefined
  const failed = status !== undefined && status >= 400
  // Anonymous failures are recorded only for sign-in endpoints (failed logins);
  // elsewhere they would let unauthenticated traffic fill the trail.
  if (failed && !user && !req.path.includes('/auth/')) return
  void audit.record({
    actor: user ? `${user.role}:${user.sub}` : 'anonymous',
    action: `${req.method} ${req.route.path as string}`,
    entity: req.path.split('/')[2] || 'api',
    entityId: (req.params?.id as string | undefined) ?? '-',
    meta: { outcome: failed ? 'failure' : 'success', status, sessionId: user?.sid, ip: req.ip },
  })
}

/** Audits successful mutating requests; failures are audited by the exception filter. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>()
    return next.handle().pipe(tap(() => auditRequest(this.audit, req)))
  }
}
