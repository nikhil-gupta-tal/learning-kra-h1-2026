import { WorkspaceRole } from '@/common/enums/workspace.enums';

export const WORKSPACE_SORT_FIELDS = [
  'name',
  'slug',
  'createdAt',
  'updatedAt',
] as const;

export const MEMBER_SORT_FIELDS = [
  'name',
  'email',
  'role',
  'createdAt',
  'updatedAt',
] as const;

export const MANAGE_MEMBERSHIP_ROLES = [
  WorkspaceRole.MANAGER,
  WorkspaceRole.MEMBER,
] as const;
