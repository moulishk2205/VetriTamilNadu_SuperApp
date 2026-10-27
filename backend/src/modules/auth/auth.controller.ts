import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'
import { DemoLoginDto, RefreshDto, RequestOtpDto, VerifyDto } from './dto/auth.dto'

/** Credential endpoints get a much tighter budget than the global limit. */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } }

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto)
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('verify')
  verify(@Body() dto: VerifyDto) {
    return this.auth.verify(dto)
  }

  /** Demo persona sign-in; 404 unless AUTH_MOCK is on. */
  @Public()
  @Post('demo')
  demo(@Body() dto: DemoLoginDto) {
    return this.auth.demoLogin(dto.persona)
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken)
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentUser() user: JwtUser) {
    await this.auth.logout(user)
  }
}
