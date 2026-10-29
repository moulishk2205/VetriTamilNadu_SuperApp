import { BadRequestException, ForbiddenException, type ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { PERMISSIONS_KEY, PermissionService, PermissionsGuard } from '../../src/modules/auth/permissions'
import { PERMISSION_CATALOG, ROLE_HOME, ROLE_PERMISSIONS } from '../../src/modules/auth/rbac'
import type { PrismaService } from '../../src/prisma/prisma.service'

/** In-memory RolePermission table. */
function fakePrisma(rows: { role: Role; permission: string }[] = []) {
  const rolePermission = {
    findMany: jest.fn(async () => [...rows]),
    deleteMany: ({ where }: { where: { role: Role } }) => async () => {
      for (let i = rows.length - 1; i >= 0; i--) if (rows[i].role === where.role) rows.splice(i, 1)
    },
    createMany: ({ data }: { data: { role: Role; permission: string }[] }) => async () => { rows.push(...data) },
  }
  return {
    rows,
    rolePermission,
    prisma: { rolePermission, $transaction: async (ops: (() => Promise<void>)[]) => { for (const op of ops) await op() } } as unknown as PrismaService,
  }
}

function contextFor(user: { role: Role } | undefined, required: string[] | undefined) {
  const reflector = { getAllAndOverride: (key: string) => (key === PERMISSIONS_KEY ? required : undefined) } as unknown as Reflector
  const ctx = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
  return { reflector, ctx }
}

describe('RBAC defaults', () => {
  const known = new Set(PERMISSION_CATALOG.map((p) => p.key))

  it('grants only permissions from the catalogue', () => {
    for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
      for (const k of keys) expect({ role, k, known: known.has(k) }).toEqual({ role, k, known: true })
    }
  })

  it('covers every role, with a home screen each', () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual(Object.values(Role).sort())
    expect(Object.keys(ROLE_HOME).sort()).toEqual(Object.values(Role).sort())
  })

  it('keeps administration and processing apart', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain('admin:manage')
    for (const role of [Role.CITIZEN, Role.OFFICER, Role.DEPARTMENT, Role.MLA, Role.SUPPORT]) {
      expect(ROLE_PERMISSIONS[role]).not.toContain('admin:manage')
    }
    expect(ROLE_PERMISSIONS.CITIZEN).not.toContain('application:process')
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain('application:process')
  })
})

describe('PermissionService', () => {
  it('falls back to the defaults while the table is empty', async () => {
    const { prisma } = fakePrisma()
    expect((await new PermissionService(prisma).forRole(Role.OFFICER)).sort()).toEqual([...ROLE_PERMISSIONS.OFFICER].sort())
  })

  it('serves the stored matrix and reloads it after a change', async () => {
    const { prisma, rolePermission } = fakePrisma([{ role: Role.MLA, permission: 'analytics:read' }])
    const svc = new PermissionService(prisma)
    expect(await svc.forRole(Role.MLA)).toEqual(['analytics:read'])
    expect(await svc.forRole(Role.OFFICER)).toEqual([])
    await svc.forRole(Role.MLA)
    expect(rolePermission.findMany).toHaveBeenCalledTimes(1)

    await svc.set(Role.MLA, ['analytics:read', 'complaint:read', 'complaint:read'])
    expect((await svc.forRole(Role.MLA)).sort()).toEqual(['analytics:read', 'complaint:read'])
    expect(rolePermission.findMany).toHaveBeenCalledTimes(2)
  })

  it('rejects unknown permissions', async () => {
    const { prisma } = fakePrisma()
    await expect(new PermissionService(prisma).set(Role.MLA, ['analytics:read', 'root:everything'])).rejects.toThrow(BadRequestException)
  })

  it('never lets administrators lose platform administration', async () => {
    const { prisma, rows } = fakePrisma([{ role: Role.ADMIN, permission: 'admin:manage' }])
    await expect(new PermissionService(prisma).set(Role.ADMIN, ['analytics:read'])).rejects.toThrow(BadRequestException)
    expect(rows).toEqual([{ role: Role.ADMIN, permission: 'admin:manage' }])
  })
})

describe('PermissionsGuard', () => {
  const perms = new PermissionService(fakePrisma().prisma)

  it('lets a route without @Permissions through', async () => {
    const { reflector, ctx } = contextFor(undefined, undefined)
    await expect(new PermissionsGuard(reflector, perms).canActivate(ctx)).resolves.toBe(true)
  })

  it('allows a role that has every required permission', async () => {
    const { reflector, ctx } = contextFor({ role: Role.ADMIN }, ['admin:manage'])
    await expect(new PermissionsGuard(reflector, perms).canActivate(ctx)).resolves.toBe(true)
  })

  it('names the missing permission when it refuses', async () => {
    const { reflector, ctx } = contextFor({ role: Role.CITIZEN }, ['admin:manage'])
    await expect(new PermissionsGuard(reflector, perms).canActivate(ctx)).rejects.toThrow(new ForbiddenException('Your role does not have permission: Administer the platform'))
  })

  it('refuses an anonymous caller', async () => {
    const { reflector, ctx } = contextFor(undefined, ['analytics:read'])
    await expect(new PermissionsGuard(reflector, perms).canActivate(ctx)).rejects.toThrow(ForbiddenException)
  })
})
