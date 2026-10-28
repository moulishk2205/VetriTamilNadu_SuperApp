import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'

export class AttachedDocumentDto {
  @ApiProperty() @IsString() requirementId!: string
  @ApiProperty() @IsString() name!: string
  @ApiProperty() @IsString() source!: string
  @ApiPropertyOptional() @IsOptional() @IsString() walletDocId?: string
}

export class CreateApplicationDto {
  @ApiProperty() @IsString() serviceId!: string
  @ApiProperty({ type: 'object', additionalProperties: true }) @IsObject() fields!: Record<string, unknown>
  // The element type must be declared: with implicit conversion on, an untyped
  // array entry is coerced to the property's own design type (Array), which
  // stored every attached document as an empty `[]`.
  @ApiPropertyOptional({ type: [AttachedDocumentDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttachedDocumentDto) documents?: AttachedDocumentDto[]
}
