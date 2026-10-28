import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentCitizenId } from '../../common/decorators/current-user.decorator'
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

  /** Demo hook the tracker calls to walk an application one legal step forward. */
  @Post(':id/advance')
  advance(@CurrentCitizenId() citizenId: string, @Param('id') id: string) {
    return this.apps.advance(id, citizenId)
  }
}
