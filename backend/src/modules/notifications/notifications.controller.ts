import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentCitizenId } from '../../common/decorators/current-user.decorator'
import { NotificationsService } from './notifications.service'

class BroadcastDto {
  @IsString() title!: string
  @IsString() body!: string
}

@ApiTags('notifications')
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  list(@CurrentCitizenId() citizenId: string) {
    return this.notifications.list(citizenId)
  }

  @Patch('notifications/:id/read')
  markRead(@CurrentCitizenId() citizenId: string, @Param('id') id: string) {
    return this.notifications.markRead(id, citizenId)
  }

  @Post('notifications/read-all')
  markAll(@CurrentCitizenId() citizenId: string) {
    return this.notifications.markAllRead(citizenId)
  }

  @Roles('ADMIN')
  @Post('admin/broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.notifications.broadcast(dto.title, dto.body)
  }
}
