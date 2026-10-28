import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Global, Injectable, Module, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { PERMISSION_CATALOG, ROLE_PERMISSIONS } from './rbac'

export const PERMISSIONS_KEY = 'permissions'
/** Requires every listed permission. `@Permissions()` with none clears a class-level requirement. */
export const Permissions = (...keys: string[]) => SetMetadata(PERMISSIONS_KEY, keys)

/**
 * The live role → permission matrix, stored in RolePermission and editable by
 * administrators. Cached in memory and reloaded after every change, so an edit
 * takes effect on the next request.
 */
@Injectable()
export class PermissionService {
  private cache: Map<Role, Set<string>> | null = null

  constructor(private readonly prisma: PrismaService) {}

  private async load(): Promise<Map<Role, Set<string>>> {
    if (this.cache) return this.cache
    const rows = await this.prisma.rolePermission.findMany()
    const map = new Map<Role, Set<string>>(Object.values(Role).map((r) => [r, new Set<string>()]))
    if (rows.length === 0) for (const [r, keys] of Object.entries(ROLE_PERMISSIONS)) map.set(r as Role, new Set(keys))
    for (const row of rows) map.get(row.role)?.add(row.permission)
    this.cache = map
    return map
  }

  async forRole(role: Role | string): Promise<string[]> {
    return [...((await this.load()).get(role as Role) ?? [])]
  }

  async matrix() {
    const map = await this.load()
    return { catalog: PERMISSION_CATALOG, roles: Object.fromEntries([...map].map(([r, s]) => [r, [...s]])) }
  }

  async set(role: Role, keys: string[]): Promise<string[]> {
    const known = new Set(PERMISSION_CATALOG.map((p) => p.key))
    const unknown = keys.filter((k) => !known.has(k))
    if (unknown.length) throw new BadRequestException(`Unknown permission: ${unknown.join(', ')}`)
    if (role === Role.ADMIN && !keys.includes('admin:manage')) {
      throw new BadRequestException('Administrators must keep "Administer the platform", or nobody could manage the platform')
    }
    const unique = [...new Set(keys)]
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { role } }),
      this.prisma.rolePermission.createMany({ data: unique.map((permission) => ({ role, permission })) }),
    ])
    this.cache = null
    return unique
  }
}

/** Enforces `@Permissions(...)` against the live matrix (runs after RolesGuard). */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly perms: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()])
    if (!required || required.length === 0) return true
    const user = context.switchToHttp().getRequest().user as JwtUser | undefined
    if (!user) throw new ForbiddenException('Sign in required')
    const have = new Set(await this.perms.forRole(user.role))
    const missing = required.filter((k) => !have.has(k))
    if (missing.length) {
      const labels = missing.map((k) => PERMISSION_CATALOG.find((p) => p.key === k)?.label ?? k)
      throw new ForbiddenException(`Your role does not have permission: ${labels.join(', ')}`)
    }
    return true
  }
}

@Global()
@Module({ providers: [PermissionService, PermissionsGuard], exports: [PermissionService, PermissionsGuard] })
export class PermissionsModule {}
