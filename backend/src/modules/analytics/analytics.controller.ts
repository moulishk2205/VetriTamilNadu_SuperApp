import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { AnalyticsService } from './analytics.service'

@ApiTags('analytics')
@Roles('CITIZEN', 'OFFICER', 'DEPARTMENT', 'MLA', 'ADMIN')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('department') department() { return this.analytics.department() }
  @Get('constituency') constituency() { return this.analytics.constituency() }
}
