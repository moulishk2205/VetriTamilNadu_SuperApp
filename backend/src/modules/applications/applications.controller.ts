import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentCitizenId, CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { ApplicationsService } from './applications.service'
import { CreateApplicationDto } from './dto/create-application.dto'

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly apps: ApplicationsService) {}

  @Get()
  list(@CurrentCitizenId() citizenId: string) {
    return this.apps.list(citizenId)
  }

  @Get(':id')
  get(@CurrentCitizenId() citizenId: string, @Param('id') id: string) {
    return this.apps.get(id, citizenId)
  }

  @Post()
  create(@CurrentCitizenId() citizenId: string, @Body() dto: CreateApplicationDto) {
    return this.apps.create(citizenId, dto)
  }

  /** Officer moves an application one legal step forward, within their own
   *  jurisdiction. Citizens cannot advance applications, including their own. */
  @Roles('OFFICER')
  @Post(':id/advance')
  async advance(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.apps.advance(id, await this.apps.officerFor(user))
  }
}
