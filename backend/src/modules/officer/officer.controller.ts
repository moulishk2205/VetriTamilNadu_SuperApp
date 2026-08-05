import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { Roles } from '../../common/decorators/roles.decorator'
import { OfficerService } from './officer.service'

class OfficerActionDto {
  @IsString() action!: string
  @IsOptional() @IsString() note?: string
}

@ApiTags('officer')
@Roles('OFFICER', 'DEPARTMENT', 'ADMIN')
@Controller()
export class OfficerController {
  constructor(private readonly officer: OfficerService) {}

  @Get('officer/queue') queue() { return this.officer.queue() }
  @Get('officer/stats') stats() { return this.officer.stats() }

  @Post('officer/applications/:id/action')
  action(@Param('id') id: string, @Body() dto: OfficerActionDto) {
    return this.officer.action(id, dto)
  }

  @Roles('ADMIN', 'DEPARTMENT')
  @Get('admin/audit')
  audit() { return this.officer.auditTrail() }
}
