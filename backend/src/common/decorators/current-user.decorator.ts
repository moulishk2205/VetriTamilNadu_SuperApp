import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common'

export interface JwtUser {
  sub: string
  /** Session the token belongs to; ending the session revokes the token. */
  sid?: string
  role: string
  citizenId?: string
  officerId?: string
  permissions: string[]
}

/** Injects the authenticated user (from the validated JWT) into a handler. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUser => {
  const request = ctx.switchToHttp().getRequest()
  return request.user as JwtUser
})

/**
 * Injects the authenticated citizen's id, FAILING CLOSED if the token has none.
 * This prevents citizen-scoped queries from degrading into unscoped
 * "return everything" queries (Prisma treats `citizenId: undefined` as no
 * filter) when a non-citizen token reaches a citizen endpoint.
 */
export const CurrentCitizenId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const user = ctx.switchToHttp().getRequest().user as JwtUser | undefined
  if (!user?.citizenId) throw new ForbiddenException('This action requires a citizen profile')
  return user.citizenId
})
