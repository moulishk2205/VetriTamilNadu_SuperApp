import { Body, Controller, Get, HttpCode, Module, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { CurrentCitizenId, CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { EligibilityService } from './eligibility.service'

/** Declared before the controller: decorator metadata reads them at class definition. */
const YES_NO = ['yes', 'no']
const COMMUNITY = ['SC', 'ST', 'BC', 'MBC', 'DNC', 'OC']
const AREA = ['rural', 'urban']
const STUDENT = ['none', 'class-1-5', 'class-6-8', 'class-9-10', 'class-11', 'class-12', 'college']
const SCHOOL = ['government', 'aided', 'private']
const OCCUPATION = ['farmer', 'agricultural-labourer', 'traditional-fisher', 'other']
const CATEGORY = ['none', 'destitute-widow', 'deserted-woman', 'transgender', 'disabled']

class FactsDto {
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) annualIncome?: number
  @IsOptional() @IsIn(YES_NO) landHolder?: string
  @IsOptional() @IsIn(COMMUNITY) community?: string
  @IsOptional() @IsIn(AREA) area?: string
  @IsOptional() @IsIn(YES_NO) kutchaHut?: string
  @IsOptional() @IsIn(STUDENT) studentLevel?: string
  @IsOptional() @IsIn(SCHOOL) schoolType?: string
  @IsOptional() @IsIn(OCCUPATION) occupation?: string
  @IsOptional() @IsIn(CATEGORY) specialCategory?: string
}

class SampleProfileDto {
  @IsOptional() @IsInt() @Min(0) @Max(150) age?: number
  @IsOptional() @IsString() @MaxLength(20) gender?: string
  @IsOptional() @IsString() @MaxLength(60) district?: string
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) annualIncome?: number
  @IsOptional() @IsIn(YES_NO) landHolder?: string
  @IsOptional() @IsIn(COMMUNITY) community?: string
  @IsOptional() @IsIn(AREA) area?: string
  @IsOptional() @IsIn(YES_NO) kutchaHut?: string
  @IsOptional() @IsIn(STUDENT) studentLevel?: string
  @IsOptional() @IsIn(SCHOOL) schoolType?: string
  @IsOptional() @IsIn(OCCUPATION) occupation?: string
  @IsOptional() @IsIn(CATEGORY) specialCategory?: string
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
