import { Body, Controller, Get, Module, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Permissions } from '../auth/permissions'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { CurrentCitizenId, CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { ApplicationsModule } from '../applications/applications.module'
import { ApplicationsService } from '../applications/applications.service'
import { ComplaintsService } from './complaints.service'
import { CreateComplaintDto } from './dto/create-complaint.dto'

class GrievanceActionDto {
  @IsString() action!: string
  @IsOptional() @IsString() @MaxLength(1000) note?: string
}

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  list(@CurrentCitizenId() citizenId: string) {
    return this.complaints.list(citizenId)
  }

  @Permissions('complaint:create')
  @Post()
  create(@CurrentCitizenId() citizenId: string, @Body() dto: CreateComplaintDto) {
    return this.complaints.create(citizenId, dto)
  }
}

/** Grievance redressal for officers, scoped to their district. */
@ApiTags('officer')
@Roles('OFFICER')
@Permissions('complaint:resolve')
@Controller('officer/grievances')
export class OfficerGrievancesController {
  constructor(private readonly complaints: ComplaintsService, private readonly apps: ApplicationsService) {}

  @Get()
  async queue(@CurrentUser() user: JwtUser) {
    return this.complaints.queue(await this.apps.officerFor(user))
  }

  @Post(':id/action')
  async act(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: GrievanceActionDto) {
    return this.complaints.act(id, dto, await this.apps.officerFor(user))
  }
}

@Module({ imports: [ApplicationsModule], controllers: [ComplaintsController, OfficerGrievancesController], providers: [ComplaintsService] })
export class ComplaintsModule {}
