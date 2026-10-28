import { Module } from '@nestjs/common'
import { DocumentsController, VerifyController } from './documents.controller'
import { DocumentsService } from './documents.service'

@Module({ controllers: [DocumentsController, VerifyController], providers: [DocumentsService], exports: [DocumentsService] })
export class DocumentsModule {}
