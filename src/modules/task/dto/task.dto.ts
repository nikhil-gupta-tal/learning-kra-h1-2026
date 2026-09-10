import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { TaskPriority, TaskStatus } from '@/common/enums/task.enums';

export class CreateTaskDto {
  @IsString()
  @Length(1, 150)
  @Matches(/\S/)
  title: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string | null;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedToUserId?: number | null;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class ListTasksDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedToUserId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
