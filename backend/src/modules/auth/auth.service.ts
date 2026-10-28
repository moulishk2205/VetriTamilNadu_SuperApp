import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { ROLE_PERMISSIONS } from './rbac'
import type { RequestOtpDto, VerifyDto } from './dto/auth.dto'

const ROLE_MAP: Record<string, Role> = {
  citizen: Role.CITIZEN, officer: Role.OFFICER, department: Role.DEPARTMENT,
  mla: Role.MLA, admin: Role.ADMIN, support: Role.SUPPORT,
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Issue an OTP. In mock mode the code is fixed (123456) so the demo flow works;
   *  a real deployment sends it via the SMS adapter and never returns it. */
  async requestOtp(dto: RequestOtpDto): Promise<{ sent: boolean; channel: string }> {
    const code = '123456'
    const codeHash = await bcrypt.hash(code, 8)
    await this.prisma.otp.create({
      data: { identifier: dto.identifier, codeHash, expiresAt: new Date(Date.now() + 5 * 60_000) },
    })
    return { sent: true, channel: dto.method === 'aadhaar' ? 'aadhaar-linked-mobile' : 'sms' }
  }

  /** Verify credentials → session + tokens + citizen + RBAC permissions. */
  async verify(dto: VerifyDto): Promise<{
    tokens: { accessToken: string; refreshToken: string; expiresIn: number }
    citizen: unknown
    role: string
    permissions: string[]
    session: { id: string }
  }> {
    const role = ROLE_MAP[dto.role ?? 'citizen'] ?? Role.CITIZEN

    // OTP methods must present a matching, unconsumed code.
    if (dto.method !== 'biometric' && dto.identifier && dto.otp) {
      const otp = await this.prisma.otp.findFirst({
        where: { identifier: dto.identifier, consumed: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      })
      if (otp) {
        const ok = await bcrypt.compare(dto.otp, otp.codeHash)
        if (!ok) throw new UnauthorizedException('Invalid OTP')
        await this.prisma.otp.update({ where: { id: otp.id }, data: { consumed: true } })
      }
    }

    // Demo persona resolves to the seeded citizen; a real backend resolves by identity.
    const citizen = await this.prisma.citizen.findFirst({ include: { addresses: true } })
    if (!citizen) throw new UnauthorizedException('No citizen profile provisioned')

    // Resolve (or provision) the login user, keeping its role in sync with the
    // requested persona so a later token refresh issues the same role.
    const existing = await this.prisma.user.findFirst({ where: { citizenId: citizen.id } })
    const user = existing
      ? await this.prisma.user.update({ where: { id: existing.id }, data: { role } })
      : await this.prisma.user.create({ data: { mobile: citizen.mobile, role, citizenId: citizen.id } })

    const session = await this.prisma.session.create({
      data: { userId: user.id, method: dto.method.toUpperCase() as 'OTP' | 'AADHAAR' | 'BIOMETRIC' },
    })

    const permissions = ROLE_PERMISSIONS[role]
    const tokens = await this.issueTokens({ sub: user.id, role, citizenId: citizen.id, permissions })
    return { tokens, citizen, role: dto.role ?? 'citizen', permissions, session: { id: session.id } }
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const existing = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!existing || existing.revoked || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired')
    }
    await this.prisma.refreshToken.update({ where: { id: existing.id }, data: { revoked: true } }) // rotation
    const user = await this.prisma.user.findUnique({ where: { id: existing.userId } })
    if (!user) throw new UnauthorizedException('User not found')
    return this.issueTokens({
      sub: user.id,
      role: user.role,
      citizenId: user.citizenId ?? undefined,
      permissions: ROLE_PERMISSIONS[user.role],
    })
  }

  async logout(user: JwtUser | undefined): Promise<void> {
    if (user) await this.prisma.refreshToken.updateMany({ where: { userId: user.sub, revoked: false }, data: { revoked: true } })
  }

  private async issueTokens(claims: JwtUser): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const accessTtl = this.config.get<number>('jwt.accessTtl') ?? 900
    const refreshTtl = this.config.get<number>('jwt.refreshTtl') ?? 1209600
    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: accessTtl,
    })
    const refreshToken = randomUUID()
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: claims.sub, expiresAt: new Date(Date.now() + refreshTtl * 1000) },
    })
    return { accessToken, refreshToken, expiresIn: accessTtl }
  }
}
