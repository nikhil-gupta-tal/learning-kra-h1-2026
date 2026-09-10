import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from '@/common/constants/pagination.constants';

export class BaseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit = DEFAULT_PAGE_LIMIT;

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortOrder: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';
}
