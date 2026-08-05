import { Module } from '@nestjs/common'
import { ApplicationsModule } from '../applications/applications.module'
import { OfficerController } from './officer.controller'
import { OfficerService } from './officer.service'

@Module({
  imports: [ApplicationsModule],
  controllers: [OfficerController],
  providers: [OfficerService],
})
export class OfficerModule {}
