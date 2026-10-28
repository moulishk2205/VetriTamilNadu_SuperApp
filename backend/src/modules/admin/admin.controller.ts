import { Controller, Get, Header, Module, NotFoundException, Param, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { ApplicationStage } from '@prisma/client'
import { AuditService } from '../../common/audit/audit.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { buildProcessModel, toBpmnXml } from '../workflow/bpmn'
import { WorkflowEngine } from '../workflow/workflow.engine'
import { SlaService } from './sla.service'

const OPEN = { notIn: [ApplicationStage.completed, ApplicationStage.rejected] }
type ControlStatus = 'on' | 'warn' | 'off'

/** Trust Center: the platform's security posture, from live state, including what is not done yet. */
@ApiTags('admin')
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sla: SlaService,
    private readonly config: ConfigService,
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
        c('180-day log retention in India (CERT-In 2022)', 'off', 'Retention policy and log shipping not yet in place'),
      ],
    }
  }

  @Get('audit/verify')
  verifyAudit() {
    return this.audit.verify()
  }

  @Post('sla/sweep')
  sweep() {
    return this.sla.sweep()
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
