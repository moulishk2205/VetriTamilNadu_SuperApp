import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Permissions } from '../auth/permissions'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { OfficerService } from './officer.service'

class OfficerActionDto {
  @IsString() action!: string
  @IsOptional() @IsString() note?: string
  /** For "forward": the colleague who takes the case. */
  @IsOptional() @IsString() toOfficerId?: string
}

class SeekReportDto {
  @IsString() toOfficerId!: string
  @IsString() @MaxLength(1000) question!: string
}

class AnswerReportDto {
  @IsString() @MaxLength(2000) answer!: string
}

@ApiTags('officer')
/** Queue, stats and actions are scoped to the signed-in officer's jurisdiction. */
@Roles('OFFICER')
@Permissions('application:process')
@Controller()
export class OfficerController {
  constructor(private readonly officer: OfficerService) {}

  @Get('officer/queue') queue(@CurrentUser() user: JwtUser) { return this.officer.queue(user) }
  @Get('officer/stats') stats(@CurrentUser() user: JwtUser) { return this.officer.stats(user) }
  @Get('officer/applications/:id') one(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.officer.one(id, user) }
  @Get('officer/colleagues') colleagues(@CurrentUser() user: JwtUser) { return this.officer.colleagues(user) }
  @Get('officer/applications/:id/reports') caseReports(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.officer.reportsForCase(id, user) }
  @Post('officer/applications/:id/reports') seekReport(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: SeekReportDto) { return this.officer.requestReport(id, dto, user) }
  @Get('officer/reports') myReports(@CurrentUser() user: JwtUser) { return this.officer.myReportRequests(user) }
  @Post('officer/reports/:id/answer') answer(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: AnswerReportDto) { return this.officer.answerReport(id, dto.answer, user) }

  @Post('officer/applications/:id/action')
  action(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: OfficerActionDto) {
    return this.officer.action(id, dto, user)
  }

  @Roles('ADMIN', 'DEPARTMENT')
  @Permissions()
  @Get('admin/audit')
  audit() { return this.officer.auditTrail() }
}
