import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Permissions } from '../auth/permissions'
import { Throttle } from '@nestjs/throttler'
import { CurrentCitizenId } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { DocumentsService } from './documents.service'

@ApiTags('documents')
@Permissions('document:read')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get()
  list(@CurrentCitizenId() citizenId: string) {
    return this.docs.list(citizenId)
  }

  @Get(':id')
  get(@CurrentCitizenId() citizenId: string, @Param('id') id: string) {
    return this.docs.get(id, citizenId)
  }
}

/** Public certificate verification, the target of the QR code on every certificate. */
@ApiTags('verify')
@Controller('verify')
export class VerifyController {
  constructor(private readonly docs: DocumentsService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':number')
  verify(@Param('number') number: string, @Query('s') sig?: string) {
    return this.docs.verify(number, sig)
  }
}
