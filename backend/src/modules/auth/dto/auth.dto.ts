import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

const METHODS = ['otp', 'aadhaar', 'biometric'] as const
const ROLES = ['citizen', 'officer', 'department', 'mla', 'admin', 'support'] as const

export class RequestOtpDto {
  @ApiProperty() @IsString() identifier!: string
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string
}

export class VerifyDto {
  @ApiProperty({ enum: METHODS }) @IsIn(METHODS) method!: (typeof METHODS)[number]
  @ApiPropertyOptional() @IsOptional() @IsString() identifier?: string
  @ApiPropertyOptional() @IsOptional() @IsString() otp?: string
  @ApiPropertyOptional({ enum: ROLES }) @IsOptional() @IsIn(ROLES) role?: (typeof ROLES)[number]
}

export class RefreshDto {
  @ApiProperty() @IsString() refreshToken!: string
}
