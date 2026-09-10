import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import {
  MANAGE_MEMBERSHIP_ROLES,
  MEMBER_SORT_FIELDS,
  WORKSPACE_SORT_FIELDS,
} from '../constants/workspace.constants';

export class CreateWorkspaceDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Length(3, 64)
  slug: string;
}

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {}

export class AddWorkspaceMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(MANAGE_MEMBERSHIP_ROLES)
  role?: WorkspaceRole.MANAGER | WorkspaceRole.MEMBER;
}

export class UpdateWorkspaceMemberRoleDto {
  @IsIn(MANAGE_MEMBERSHIP_ROLES)
  role: WorkspaceRole.MANAGER | WorkspaceRole.MEMBER;
}

export class UpdateWorkspaceStatusDto {
  @IsEnum(WorkspaceStatus)
  status: WorkspaceStatus;
}

export class UpdateWorkspaceMemberStatusDto {
  @IsEnum(WorkspaceStatus)
  status: WorkspaceStatus;
}

export class TransferWorkspaceOwnershipDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;
}

export class ListWorkspacesDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(WorkspaceStatus)
  status = WorkspaceStatus.ACTIVE;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(WORKSPACE_SORT_FIELDS)
  sortBy: (typeof WORKSPACE_SORT_FIELDS)[number] = 'createdAt';
}

export class ListWorkspaceMembersDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(WorkspaceStatus)
  status = WorkspaceStatus.ACTIVE;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(MEMBER_SORT_FIELDS)
  sortBy: (typeof MEMBER_SORT_FIELDS)[number] = 'createdAt';
}
