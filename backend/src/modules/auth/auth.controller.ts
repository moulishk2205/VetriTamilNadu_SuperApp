import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'
import { RefreshDto, RequestOtpDto, VerifyDto } from './dto/auth.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto)
  }

  @Public()
  @Post('verify')
  verify(@Body() dto: VerifyDto) {
    return this.auth.verify(dto)
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
