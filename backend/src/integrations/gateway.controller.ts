import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Roles } from '../common/decorators/roles.decorator'
import { GatewayService } from './gateway.service'
import type { GatewayOp } from './gateway.types'

@ApiTags('government')
@Roles('ADMIN', 'DEPARTMENT', 'OFFICER')
@Controller('government')
export class GatewayController {
  constructor(private readonly gateway: GatewayService) {}

  /** List registered integration adapters and their mode. */
  @Get('adapters')
  adapters() {
    return { items: this.gateway.list() }
  }

  /** Invoke an adapter operation: /government/:adapter/:op */
  @Post(':adapter/:op')
  call(
    @Param('adapter') adapter: string,
    @Param('op') op: GatewayOp,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.gateway.call(adapter, op, payload ?? {})
  }
}
