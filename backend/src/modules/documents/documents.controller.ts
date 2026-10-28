import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentCitizenId } from '../../common/decorators/current-user.decorator'
import { DocumentsService } from './documents.service'

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  list(@CurrentCitizenId() citizenId: string) {
    return this.docs.list(citizenId)
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.docs.get(id)
  }
}
