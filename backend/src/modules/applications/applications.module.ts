import { Module } from '@nestjs/common'
import { WorkflowEngine } from '../workflow/workflow.engine'
import { ApplicationsController } from './applications.controller'
import { ApplicationsService } from './applications.service'

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, WorkflowEngine],
  exports: [ApplicationsService, WorkflowEngine],
})
export class ApplicationsModule {}
