import { BadRequestException, Body, Controller, ForbiddenException, Get, Header, Module, NotFoundException, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { PermissionService, Permissions } from '../auth/permissions'
import { ApplicationStage, Role } from '@prisma/client'
import { AuditService } from '../../common/audit/audit.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { buildProcessModel, toBpmnXml } from '../workflow/bpmn'
import { WorkflowEngine } from '../workflow/workflow.engine'
import { SlaService } from './sla.service'

const OPEN = { notIn: [ApplicationStage.completed, ApplicationStage.rejected] }
type ControlStatus = 'on' | 'warn' | 'off'

/** Declared before the controller: decorator metadata reads it at class definition. */
class RolePermissionsDto {
  @IsArray() @IsString({ each: true }) permissions!: string[]
}

class UpdateUserDto {
  @IsOptional() @IsEnum(Role) role?: Role
  @IsOptional() @IsBoolean() active?: boolean
}

/** Trust Center: the platform's security posture, from live state, including what is not done yet. */
@ApiTags('admin')
@Roles('ADMIN')
@Permissions('admin:manage')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sla: SlaService,
    private readonly config: ConfigService,
    private readonly perms: PermissionService,
  ) {}

  @Get('trust')
  async trust() {
    const day = new Date(Date.now() - 86_400_000)
    const mock = this.config.get<boolean>('auth.mock') === true
    const swagger = this.config.get<boolean>('swagger') === true
    const [sessionsOpen, failedLogins24h, auditRows, overdue, breached24h, chain] = await Promise.all([
      this.prisma.session.count({ where: { endedAt: null, createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } } }),
      this.prisma.auditLog.count({ where: { at: { gte: day }, action: { contains: '/auth/' }, meta: { path: ['outcome'], equals: 'failure' } } }),
      this.prisma.auditLog.count(),
      this.prisma.application.count({ where: { deletedAt: null, stage: OPEN, slaDeadline: { lt: new Date() } } }),
      this.prisma.application.count({ where: { slaBreachedAt: { gte: day } } }),
      this.audit.verify(),
    ])
    const c = (name: string, status: ControlStatus, detail: string) => ({ name, status, detail })
    return {
      environment: this.config.get<string>('nodeEnv'),
      sessionsOpen, failedLogins24h, auditRows, chain,
      sla: { overdue, breached24h, sweepMinutes: this.sla.intervalMinutes },
      controls: [
        c('Server-side identity and roles', 'on', 'Roles come from the user record; one-time OTP, hashed, 5 attempts, 5 tries a minute'),
        c('Aadhaar and mobile never stored in OTP records', 'on', 'Login identifiers are kept only as keyed HMAC hashes and purged after use'),
        c('Session revocation', 'on', 'Logout ends the session; every request checks it is still open'),
        c('Refresh tokens hashed and rotated', 'on', 'SHA-256 at rest, single use, tied to a session'),
        c('Owner and jurisdiction scoping', 'on', 'Citizens reach only their own records; officers only their district'),
        c('Tamper-evident audit trail', chain.valid ? 'on' : 'warn', chain.valid ? `${chain.chained} rows hash-chained; failed and denied requests included` : `Chain broken at row ${chain.brokenAt?.seq}: ${chain.brokenAt?.reason}`),
        c('Right to Services deadlines', 'on', `Published charter days per service; breaches escalate${this.sla.intervalMinutes > 0 ? ` every ${this.sla.intervalMinutes} min` : ' on demand'}`),
        c('Content Security Policy and hardened headers', 'on', "API answers with default-src 'none'; the web app ships a strict CSP"),
        c('Secrets required, non-root container', 'on', 'No default secrets; the API refuses to boot without them'),
        c('API documentation exposure', swagger ? 'warn' : 'on', swagger ? 'Swagger UI is enabled on this server' : 'Swagger UI is off'),
        c('Demo authentication', mock ? 'warn' : 'on', mock ? 'AUTH_MOCK is ON: fixed demo OTP and personas (demonstration only)' : 'Off: random OTPs, no demo personas'),
        c('TLS in transit', 'off', 'To be terminated at the State Data Centre gateway; not configured on this host'),
        c('Encryption at rest', 'off', 'Database volume encryption not yet configured'),
        c('SMS OTP delivery (DLT)', 'off', 'Needs a DLT-registered SMS provider'),
        c('180-day log retention in India (CERT-In 2022)', 'warn', 'The app never deletes audit entries and exports them as hash-chained JSON Lines for an India-hosted archive; host log shipping and NTP still to configure'),
        c('Two-person approval', 'on', 'The officer who recommends a case cannot approve it; a second officer must'),
      ],
    }
  }

  @Get('audit/verify')
  verifyAudit() {
    return this.audit.verify()
  }

  /**
   * CERT-In style log hand-over: the audit trail for the last `days` (default
   * 180) as JSON Lines, hashes included, so an off-site archive or an incident
   * responder can re-verify the chain. The export is itself audited.
   */
  @Get('audit/export')
  @Header('Content-Type', 'application/x-ndjson; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="vetri-audit.jsonl"')
  async exportAudit(@CurrentUser() user: JwtUser, @Query('days') days?: string) {
    const span = Math.min(Math.max(Number(days) || 180, 1), 3650)
    const rows = await this.prisma.auditLog.findMany({ where: { at: { gte: new Date(Date.now() - span * 86_400_000) } }, orderBy: { seq: 'asc' } })
    await this.audit.record({ actor: `${user.role}:${user.sub}`, action: 'audit-export', entity: 'audit', entityId: '-', note: `${rows.length} entries, last ${span} days` })
    return rows.map((r) => JSON.stringify({ seq: r.seq.toString(), at: r.at.toISOString(), actor: r.actor, action: r.action, entity: r.entity, entityId: r.entityId, note: r.note, meta: r.meta, prevHash: r.prevHash, hash: r.hash })).join('\n') + '\n'
  }

  @Post('sla/sweep')
  sweep() {
    return this.sla.sweep()
  }

  /** The live role → permission matrix and the catalog of permissions. */
  @Get('permissions')
  permissions() {
    return this.perms.matrix()
  }

  /** Replace one role's permissions. Takes effect on the next request; audited. */
  @Put('permissions/:role')
  async setPermissions(@CurrentUser() me: JwtUser, @Param('role') role: string, @Body() dto: RolePermissionsDto) {
    if (!(Object.values(Role) as string[]).includes(role)) throw new NotFoundException('Unknown role')
    const before = await this.perms.forRole(role)
    const after = await this.perms.set(role as Role, dto.permissions)
    const added = after.filter((k) => !before.includes(k))
    const removed = before.filter((k) => !after.includes(k))
    await this.audit.record({ actor: `${me.role}:${me.sub}`, action: 'permissions-update', entity: 'role', entityId: role, note: `+[${added.join(', ')}] -[${removed.join(', ')}]` })
    return { role, permissions: after }
  }

  /** Accounts with their role, status and last sign-in (newest activity first). */
  @Get('users')
  async users(@Query('q') q?: string) {
    const term = q?.trim()
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null, ...(term ? { OR: [{ citizen: { fullName: { contains: term, mode: 'insensitive' } } }, { officer: { name: { contains: term, mode: 'insensitive' } } }, { mobile: { contains: term } }] } : {}) },
      include: { citizen: { select: { fullName: true, citizenId: true } }, officer: { select: { name: true, designation: true } }, sessions: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })
    const open = await this.prisma.session.groupBy({ by: ['userId'], where: { endedAt: null, userId: { in: rows.map((r) => r.id) } }, _count: { _all: true } })
    const openBy = new Map(open.map((o) => [o.userId, o._count._all]))
    return {
      items: rows.map((u) => ({
        id: u.id,
        name: u.citizen?.fullName ?? u.officer?.name ?? (u.mobile.startsWith('demo-') ? `Demo ${u.mobile.slice(5)}` : 'Staff account'),
        detail: u.citizen ? `Citizen ${u.citizen.citizenId}` : u.officer ? u.officer.designation : u.mobile.startsWith('demo-') ? 'Demo persona' : '',
        kind: u.citizenId ? 'citizen' : u.officerId ? 'officer' : 'staff',
        role: u.role, active: u.active,
        lastSignIn: u.sessions[0]?.createdAt.toISOString() ?? null,
        openSessions: openBy.get(u.id) ?? 0,
      })),
    }
  }

  /**
   * Change an account's role or status. Guard rails: you cannot change your own
   * account; citizen accounts stay CITIZEN and officer accounts stay OFFICER
   * (identity drives scope). Every change ends the account's sessions at once
   * and is audited.
   */
  @Patch('users/:id')
  async updateUser(@CurrentUser() me: JwtUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    if (id === me.sub) throw new ForbiddenException('You cannot change your own account. Ask another administrator.')
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } })
    if (!user) throw new NotFoundException('User not found')
    if (dto.role && dto.role !== user.role) {
      if (user.citizenId) throw new BadRequestException('Citizen accounts always have the citizen role')
      if (user.officerId) throw new BadRequestException('Officer accounts keep the officer role; their scope comes from their post')
      if (dto.role === Role.CITIZEN || dto.role === Role.OFFICER) throw new BadRequestException('Citizen and officer roles come from a linked identity, not from this screen')
    }
    const updated = await this.prisma.user.update({ where: { id }, data: { ...(dto.role ? { role: dto.role } : {}), ...(dto.active !== undefined ? { active: dto.active } : {}) } })
    const now = new Date()
    const ended = await this.prisma.session.updateMany({ where: { userId: id, endedAt: null }, data: { endedAt: now } })
    await this.prisma.refreshToken.updateMany({ where: { userId: id, revoked: false }, data: { revoked: true } })
    const changes = [dto.role && dto.role !== user.role ? `role ${user.role} → ${dto.role}` : '', dto.active !== undefined && dto.active !== user.active ? (dto.active ? 'reactivated' : 'deactivated') : ''].filter(Boolean).join(', ')
    await this.audit.record({ actor: `${me.role}:${me.sub}`, action: 'user-update', entity: 'user', entityId: id, note: `${changes || 'no change'}; ${ended.count} session(s) ended` })
    return { id: updated.id, role: updated.role, active: updated.active, sessionsEnded: ended.count }
  }
}

/** The running workflow as a process map (with live counts) and as BPMN 2.0 XML. */
@ApiTags('workflows')
@Roles('ADMIN', 'DEPARTMENT', 'OFFICER', 'MLA')
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':code/model')
  async model(@Param('code') code: string) {
    if (code !== 'gov.standard.v1') throw new NotFoundException('Unknown workflow')
    const rows = await this.prisma.application.groupBy({ by: ['stage'], where: { deletedAt: null }, _count: { _all: true } })
    const counts = Object.fromEntries(rows.map((r) => [r.stage, r._count._all]))
    return { ...buildProcessModel(), counts }
  }

  @Get(':code/bpmn')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="gov.standard.v1.bpmn"')
  bpmn(@Param('code') code: string) {
    if (code !== 'gov.standard.v1') throw new NotFoundException('Unknown workflow')
    return toBpmnXml(buildProcessModel())
  }
}

@Module({ controllers: [AdminController, WorkflowController], providers: [SlaService, WorkflowEngine] })
export class AdminModule {}
