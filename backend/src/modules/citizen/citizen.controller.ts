import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentCitizenId } from '../../common/decorators/current-user.decorator'
import { CitizenService } from './citizen.service'

@ApiTags('citizen')
@Controller()
export class CitizenController {
  constructor(private readonly citizen: CitizenService) {}

  @Get('citizen/me')
  me(@CurrentCitizenId() citizenId: string) {
    return this.citizen.me(citizenId)
  }

  @Patch('citizen/me')
  update(@CurrentCitizenId() citizenId: string, @Body() patch: Record<string, unknown>) {
    return this.citizen.update(citizenId, patch)
  }

  @Get('citizen/timeline')
  timeline(@CurrentCitizenId() citizenId: string) {
    return this.citizen.timeline(citizenId)
  }
}
