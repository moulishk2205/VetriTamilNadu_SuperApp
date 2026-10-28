import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator'

export class AttachedDocumentDto {
  @ApiProperty() @IsString() requirementId!: string
  @ApiProperty() @IsString() name!: string
  @ApiProperty() @IsString() source!: string
  @ApiPropertyOptional() @IsOptional() @IsString() walletDocId?: string
}

export class CreateApplicationDto {
  @ApiProperty() @IsString() serviceId!: string
  @ApiProperty({ type: 'object', additionalProperties: true }) @IsObject() fields!: Record<string, unknown>
  @ApiPropertyOptional({ type: [AttachedDocumentDto] }) @IsOptional() @IsArray() documents?: AttachedDocumentDto[]
}
