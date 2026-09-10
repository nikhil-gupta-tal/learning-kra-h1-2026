import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { toUserResponse } from './user-response.mapper';

export function toWorkspaceMemberResponse(member: WorkspaceMember) {
  return {
    ...toUserResponse(member.user),
    role: member.role,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}
