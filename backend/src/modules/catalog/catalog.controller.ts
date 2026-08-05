import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { CatalogService } from './catalog.service'

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public() @Get('services') services() { return this.catalog.services() }
  @Public() @Get('service-categories') categories() { return this.catalog.categories() }
  @Public() @Get('schemes') schemes() { return this.catalog.schemes() }
}
