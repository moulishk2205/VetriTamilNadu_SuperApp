import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

const METHODS = ['otp', 'aadhaar', 'biometric'] as const
const OTP_METHODS = ['otp', 'aadhaar'] as const
export const DEMO_PERSONAS = ['citizen', 'officer', 'department', 'mla', 'admin'] as const
export type DemoPersona = (typeof DEMO_PERSONAS)[number]

export class RequestOtpDto {
  @ApiProperty() @IsString() @MaxLength(32) identifier!: string
  @ApiPropertyOptional({ enum: OTP_METHODS }) @IsOptional() @IsIn(OTP_METHODS) method?: (typeof OTP_METHODS)[number]
}

/** There is deliberately no `role`: the role always comes from the user record. */
export class VerifyDto {
  @ApiProperty({ enum: METHODS }) @IsIn(METHODS) method!: (typeof METHODS)[number]
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) identifier?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(8) otp?: string
}

/** Demo persona sign-in. The endpoint only exists when AUTH_MOCK is on. */
export class DemoLoginDto {
  @ApiProperty({ enum: DEMO_PERSONAS }) @IsIn(DEMO_PERSONAS) persona!: DemoPersona
}

export class RefreshDto {
  @ApiProperty() @IsString() refreshToken!: string
}
