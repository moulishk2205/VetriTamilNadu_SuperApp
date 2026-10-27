import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthMethod, Citizen, Role, User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { createHmac, randomInt, randomUUID } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { ROLE_PERMISSIONS } from './rbac'
import type { DemoPersona, RequestOtpDto, VerifyDto } from './dto/auth.dto'

const OTP_TTL_MS = 5 * 60_000
const OTP_MAX_ATTEMPTS = 5
/** Fixed code, accepted only while AUTH_MOCK is on. */
const MOCK_OTP = '123456'

/** Seeded demo persona. Used only while AUTH_MOCK is on. */
const DEMO_CITIZEN_ID = 'TN-2024-XXXX-8842'
const DEMO_OFFICER_NAME = 'Tmt. R. Kalaivani'

const PERSONA_ROLE: Record<DemoPersona, Role> = {
  citizen: Role.CITIZEN, officer: Role.OFFICER, department: Role.DEPARTMENT, mla: Role.MLA, admin: Role.ADMIN,
}

type OtpMethod = 'otp' | 'aadhaar'
type TokenPair = { accessToken: string; refreshToken: string; expiresIn: number }

export interface LoginResult {
  tokens: TokenPair
  citizen: Citizen | null
  role: string
  permissions: string[]
  session: { id: string }
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly log = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (this.mock) this.log.warn('AUTH_MOCK is ON: fixed OTP 123456 and demo personas are enabled. Never run a real deployment like this.')
  }

  private get mock(): boolean {
    return this.config.get<boolean>('auth.mock') === true
  }

  /** Issue an OTP. With AUTH_MOCK the code is fixed (123456); otherwise it is
   *  random and goes to the user's registered mobile, never into the response. */
  async requestOtp(dto: RequestOtpDto): Promise<{ sent: boolean; channel: string }> {
    const method: OtpMethod = dto.method === 'aadhaar' ? 'aadhaar' : 'otp'
    const id = this.normalize(method, dto.identifier)
    const identifier = this.hashIdentifier(method, id)
    await this.purgeOtps(identifier)

    // The response is identical whether or not the identity exists, so this
    // endpoint can't be used to probe who is registered.
    const user = this.mock ? null : await this.findUser(method, id)
    if (this.mock || user) {
      const code = this.mock ? MOCK_OTP : String(randomInt(0, 1_000_000)).padStart(6, '0')
      await this.prisma.otp.create({
        data: { identifier, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
      })
      // No SMS connector exists yet, so a real-mode code cannot reach the user
      // and real-mode login fails closed. Never log the code itself.
      if (!this.mock) this.log.warn('OTP issued but not delivered: no SMS connector is configured')
    }
    return { sent: true, channel: method === 'aadhaar' ? 'aadhaar-linked-mobile' : 'sms' }
  }

  /** Verify an OTP → session + tokens. The role comes from the user record only. */
  async verify(dto: VerifyDto): Promise<LoginResult> {
    if (dto.method === 'biometric') {
      throw new UnauthorizedException('Biometric sign-in needs a certified UIDAI registered device, which is not configured. Use OTP.')
    }
    if (!dto.identifier || !dto.otp) throw new UnauthorizedException('Identifier and OTP are required')

    const id = this.normalize(dto.method, dto.identifier)
    const identifier = this.hashIdentifier(dto.method, id)
    const otp = await this.prisma.otp.findFirst({
      where: { identifier, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!otp) throw new UnauthorizedException('Invalid or expired OTP')

    if (!(await bcrypt.compare(dto.otp, otp.codeHash))) {
      const { attempts } = await this.prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
      if (attempts >= OTP_MAX_ATTEMPTS) await this.prisma.otp.deleteMany({ where: { id: otp.id } })
      throw new UnauthorizedException('Invalid or expired OTP')
    }
    // Single use: delete the row. A concurrent verify of the same code loses here.
    const { count } = await this.prisma.otp.deleteMany({ where: { id: otp.id } })
    if (count === 0) throw new UnauthorizedException('Invalid or expired OTP')

    const user = (await this.findUser(dto.method, id)) ?? (this.mock ? await this.demoUser('citizen') : null)
    if (!user) throw new UnauthorizedException('No account is registered for this identifier')
    return this.startSession(user, dto.method === 'aadhaar' ? AuthMethod.AADHAAR : AuthMethod.OTP)
  }

  /** Demo persona sign-in. Behaves as a missing route unless AUTH_MOCK is on. */
  async demoLogin(persona: DemoPersona): Promise<LoginResult> {
    if (!this.mock) throw new NotFoundException()
    return this.startSession(await this.demoUser(persona), AuthMethod.DEMO)
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const existing = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!existing || existing.revoked || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired')
    }
    // Rotation. Conditional so a token replayed concurrently is honoured once.
    const { count } = await this.prisma.refreshToken.updateMany({ where: { id: existing.id, revoked: false }, data: { revoked: true } })
    if (count === 0) throw new UnauthorizedException('Refresh token invalid or expired')
    const user = await this.prisma.user.findUnique({ where: { id: existing.userId } })
    if (!user || !user.active || user.deletedAt) throw new UnauthorizedException('User not found')
    return this.issueTokens(this.claimsFor(user))
  }

  async logout(user: JwtUser | undefined): Promise<void> {
    if (user) await this.prisma.refreshToken.updateMany({ where: { userId: user.sub, revoked: false }, data: { revoked: true } })
  }

  private async startSession(user: User, method: AuthMethod): Promise<LoginResult> {
    if (!user.active || user.deletedAt) throw new UnauthorizedException('This account is disabled')
    const own = user.citizenId
      ? await this.prisma.citizen.findUnique({ where: { id: user.citizenId }, include: { addresses: true } })
      : null
    // Staff personas have no citizen record; in mock mode the UI keeps showing
    // the demo profile. Their token carries no citizenId either way.
    const citizen = own ?? (this.mock
      ? await this.prisma.citizen.findUnique({ where: { citizenId: DEMO_CITIZEN_ID }, include: { addresses: true } })
      : null)

    const session = await this.prisma.session.create({ data: { userId: user.id, method } })
    const claims = this.claimsFor(user)
    const tokens = await this.issueTokens(claims)
    return { tokens, citizen, role: user.role.toLowerCase(), permissions: claims.permissions, session: { id: session.id } }
  }

  private claimsFor(user: User): JwtUser {
    return {
      sub: user.id,
      role: user.role,
      citizenId: user.citizenId ?? undefined,
      officerId: user.officerId ?? undefined,
      permissions: ROLE_PERMISSIONS[user.role],
    }
  }

  /** Resolve the account behind a login identifier. Aadhaar numbers are never
   *  stored, so an Aadhaar identity can only be resolved through UIDAI e-KYC,
   *  which is not wired yet: Aadhaar login has no match outside mock mode. */
  private async findUser(method: OtpMethod, id: string): Promise<User | null> {
    if (method === 'aadhaar') return null
    const mobiles = [id, `+91${id}`, `+91 ${id}`]
    const user = await this.prisma.user.findFirst({ where: { mobile: { in: mobiles }, deletedAt: null } })
    if (user) return user
    // A mobile shared by several citizens is ambiguous: no match rather than a guess.
    const citizens = await this.prisma.citizen.findMany({ where: { mobile: { in: mobiles }, deletedAt: null }, take: 2 })
    return citizens.length === 1 ? this.userForCitizen(citizens[0]) : null
  }

  /** The citizen's login user, created as CITIZEN on first sign-in. An existing
   *  user keeps its stored role: logins never write the role. */
  private userForCitizen(citizen: Citizen): Promise<User> {
    return this.prisma.user.upsert({
      where: { citizenId: citizen.id },
      update: {},
      create: { mobile: citizen.mobile, role: Role.CITIZEN, citizenId: citizen.id },
    })
  }

  /** One dedicated user per demo persona, so personas never share a role. */
  private async demoUser(persona: DemoPersona): Promise<User> {
    if (persona === 'citizen') {
      const citizen = await this.prisma.citizen.findUnique({ where: { citizenId: DEMO_CITIZEN_ID } })
      if (!citizen) throw new UnauthorizedException('Demo citizen is not seeded')
      return this.userForCitizen(citizen)
    }
    const officer = persona === 'officer'
      ? await this.prisma.officer.findFirst({ where: { name: DEMO_OFFICER_NAME }, orderBy: { createdAt: 'asc' } })
      : null
    if (persona === 'officer' && !officer) throw new UnauthorizedException('Demo officer is not seeded')
    const mobile = `demo-${persona}`
    return this.prisma.user.upsert({
      where: { mobile },
      update: {},
      create: { mobile, role: PERSONA_ROLE[persona], officerId: officer?.id },
    })
  }

  private normalize(method: string, raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (method === 'aadhaar') {
      if (digits.length !== 12) throw new BadRequestException('Enter a valid 12-digit Aadhaar number')
      return digits
    }
    const mobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
    if (mobile.length !== 10) throw new BadRequestException('Enter a valid 10-digit mobile number')
    return mobile
  }

  /** OTP rows key on a keyed hash, never the raw mobile or Aadhaar number. */
  private hashIdentifier(method: string, id: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('jwt.accessSecret')).update(`otp:${method}:${id}`).digest('hex')
  }

  /** One live code per identifier; consumed and expired rows are deleted. */
  private async purgeOtps(identifier: string): Promise<void> {
    await this.prisma.otp.deleteMany({
      where: { OR: [{ identifier }, { consumed: true }, { expiresAt: { lt: new Date() } }] },
    })
  }

  private async issueTokens(claims: JwtUser): Promise<TokenPair> {
    const accessTtl = this.config.get<number>('jwt.accessTtl') ?? 900
    const refreshTtl = this.config.get<number>('jwt.refreshTtl') ?? 1209600
    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessTtl,
    })
    const refreshToken = randomUUID()
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: claims.sub, expiresAt: new Date(Date.now() + refreshTtl * 1000) },
    })
    return { accessToken, refreshToken, expiresIn: accessTtl }
  }
}
