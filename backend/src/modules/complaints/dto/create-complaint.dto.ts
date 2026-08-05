import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'

export class CreateComplaintDto {
  @ApiProperty() @IsString() category!: string
  @ApiProperty() @IsString() description!: string
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) @IsOptional() @IsObject() location?: Record<string, unknown>
}
