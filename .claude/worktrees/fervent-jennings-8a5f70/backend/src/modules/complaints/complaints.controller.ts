import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentCitizenId } from '../../common/decorators/current-user.decorator'
import { ComplaintsService } from './complaints.service'
import { CreateComplaintDto } from './dto/create-complaint.dto'

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get()
  list(@CurrentCitizenId() citizenId: string) {
    return this.complaints.list(citizenId)
  }

  @Post()
  create(@CurrentCitizenId() citizenId: string, @Body() dto: CreateComplaintDto) {
    return this.complaints.create(citizenId, dto)
  }
}
