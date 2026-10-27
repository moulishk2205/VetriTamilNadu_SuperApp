import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { JwtUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    })
  }

  /**
   * Whatever this returns becomes `request.user`. A signature alone is not
   * enough: the session must still be open (not logged out), and the user must
   * still be active and hold the role the token claims. One primary-key lookup.
   */
  async validate(payload: JwtUser): Promise<JwtUser> {
    const session = payload.sid
      ? await this.prisma.session.findUnique({ where: { id: payload.sid }, include: { user: true } })
      : null
    const user = session?.user
    if (!session || session.endedAt || session.deletedAt || session.userId !== payload.sub
      || !user || !user.active || user.deletedAt || user.role !== payload.role) {
      throw new UnauthorizedException('Session ended or account changed')
    }
    return payload
  }
}
