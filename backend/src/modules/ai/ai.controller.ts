import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { AiService } from './ai.service'

class ChatDto {
  @IsString() text!: string
  @IsOptional() history?: unknown
  @IsOptional() memory?: unknown
}

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  chat(@CurrentUser() user: JwtUser, @Body() dto: ChatDto) {
    return this.ai.chat(user?.citizenId, dto.text)
  }

  @Get('suggestions')
  suggestions(@CurrentUser() user: JwtUser) {
    return this.ai.suggestions(user?.citizenId)
  }
}
