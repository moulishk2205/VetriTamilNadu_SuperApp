import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * Normalizes every error into the shape the frontend's `ApiError` layer expects:
 * `{ message, code?, fieldErrors? }` with the correct HTTP status.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception')

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
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
    } else if (exception instanceof Error) {
      message = exception.message
    }

    if (status >= 500) this.logger.error(`${req.method} ${req.url} → ${status}: ${message}`)

    res.status(status).json({ statusCode: status, message, fieldErrors, path: req.url, timestamp: new Date().toISOString() })
  }
}
