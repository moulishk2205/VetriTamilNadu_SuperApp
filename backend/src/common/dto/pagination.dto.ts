import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

/** Shared pagination / filtering / sorting query DTO. */
export class PaginationQuery {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  page = 0

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function paginate<T>(items: T[], total: number, q: PaginationQuery): Page<T> {
  return { items, total, page: q.page, pageSize: q.pageSize }
}
