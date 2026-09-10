import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { ProjectStatus } from '@/common/enums/project.enums';

export class CreateProjectDto {
  @IsString()
  @Length(1, 150)
  @Matches(/\S/)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}

export class ListProjectsDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  status = ProjectStatus.ACTIVE;

  @IsOptional()
  @IsString()
  search?: string;
}
