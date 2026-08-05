import { Global, Module } from '@nestjs/common'
import { ALL_ADAPTERS } from './adapters'
import { GatewayController } from './gateway.controller'
import { GatewayService } from './gateway.service'

@Global()
@Module({
  controllers: [GatewayController],
  providers: [...ALL_ADAPTERS, GatewayService],
  exports: [GatewayService],
})
export class IntegrationsModule {}
