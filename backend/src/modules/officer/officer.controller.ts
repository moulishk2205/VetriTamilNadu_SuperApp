import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { OfficerService } from './officer.service'

class OfficerActionDto {
  @IsString() action!: string
  @IsOptional() @IsString() note?: string
}

@ApiTags('officer')
/** Queue, stats and actions are scoped to the signed-in officer's jurisdiction. */
@Roles('OFFICER')
@Controller()
export class OfficerController {
  constructor(private readonly officer: OfficerService) {}

  @Get('officer/queue') queue(@CurrentUser() user: JwtUser) { return this.officer.queue(user) }
  @Get('officer/stats') stats(@CurrentUser() user: JwtUser) { return this.officer.stats(user) }

  @Post('officer/applications/:id/action')
  action(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: OfficerActionDto) {
    return this.officer.action(id, dto, user)
  }

  @Roles('ADMIN', 'DEPARTMENT')
  @Get('admin/audit')
  audit() { return this.officer.auditTrail() }
}
