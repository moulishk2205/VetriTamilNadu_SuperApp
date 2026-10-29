import { Body, Controller, Get, HttpCode, Module, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { CurrentCitizenId, CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { EligibilityService } from './eligibility.service'

/** Declared before the controller: decorator metadata reads them at class definition. */
class FactsDto {
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) annualIncome?: number
  @IsOptional() @IsIn(['yes', 'no']) landHolder?: 'yes' | 'no'
}

class SampleProfileDto {
  @IsOptional() @IsInt() @Min(0) @Max(150) age?: number
  @IsOptional() @IsString() @MaxLength(20) gender?: string
  @IsOptional() @IsString() @MaxLength(60) district?: string
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) annualIncome?: number
  @IsOptional() @IsIn(['yes', 'no']) landHolder?: 'yes' | 'no'
  @IsOptional() @IsString() @MaxLength(40) community?: string
}

class SimulateDto {
  @ValidateNested() @Type(() => SampleProfileDto) profile!: SampleProfileDto
  /** A DMN draft to test instead of the live rules (not saved). */
  @IsOptional() @IsString() @MaxLength(95_000) xml?: string
}

@ApiTags('eligibility')
@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibility: EligibilityService) {}

  /** Every scheme, with whether the signed-in citizen meets its recorded conditions. */
  @Get()
  mine(@CurrentCitizenId() citizenId: string) {
    return this.eligibility.forCitizen(citizenId)
  }

  @Put('facts')
  declare(@CurrentCitizenId() citizenId: string, @Body() dto: FactsDto) {
    return this.eligibility.declare(citizenId, dto)
  }

  @Post(':schemeId/claim')
  claim(@CurrentCitizenId() citizenId: string, @Param('schemeId') schemeId: string, @CurrentUser() me: JwtUser) {
    return this.eligibility.claim(citizenId, schemeId, me)
  }

  /** Try a sample profile against the live rules or a DMN draft. Changes nothing. */
  @Roles('OFFICER', 'DEPARTMENT', 'ADMIN')
  @Post('simulate')
  @HttpCode(200)
  simulate(@Body() dto: SimulateDto) {
    return this.eligibility.simulate({ ...dto.profile }, dto.xml)
  }
}

@Module({ controllers: [EligibilityController], providers: [EligibilityService] })
export class EligibilityModule {}
