import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { PrismaService } from '../../prisma/prisma.service'
import { auditRequest } from '../interceptors/audit.interceptor'

/** Prisma errors a client may legitimately cause, mapped to generic messages. */
const PRISMA_STATUS: Record<string, [HttpStatus, string]> = {
  P2002: [HttpStatus.CONFLICT, 'Already exists'],
  P2025: [HttpStatus.NOT_FOUND, 'Not found'],
}

/**
 * Normalizes every error into the shape the frontend's `ApiError` layer expects:
 * `{ message, code?, fieldErrors? }` with the correct HTTP status.
 *
 * Only HttpException messages (written for clients) are returned. Anything else
 * (database, runtime, library errors) gets a generic message; the detail and
 * stack go to the server log only, so internals never reach a client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception')

  constructor(private readonly prisma: PrismaService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    let status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let fieldErrors: Record<string, string[]> | undefined

    if (exception instanceof HttpException) {
      const body = exception.getResponse()
      if (typeof body === 'string') message = body
      else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>
        message = Array.isArray(b.message) ? (b.message as string[]).join('; ') : String(b.message ?? exception.message)
        if (Array.isArray(b.message)) fieldErrors = { _: b.message as string[] }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && PRISMA_STATUS[exception.code]) {
      const [mapped, text] = PRISMA_STATUS[exception.code]
      status = mapped
      message = text
    }

    auditRequest(this.prisma, req, status)

    if (status >= 500) {
      const detail = exception instanceof Error ? exception.stack ?? exception.message : String(exception)
      this.logger.error(`${req.method} ${req.path} → ${status}: ${detail}`)
    }

    res.status(status).json({ statusCode: status, message, fieldErrors, path: req.path, timestamp: new Date().toISOString() })
  }
}
