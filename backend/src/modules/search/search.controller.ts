import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentUser, type JwtUser } from '../../common/decorators/current-user.decorator'
import { SearchService } from './search.service'

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  run(@CurrentUser() user: JwtUser, @Query('q') q = '') {
    return this.search.search(user.citizenId, q)
  }
}
