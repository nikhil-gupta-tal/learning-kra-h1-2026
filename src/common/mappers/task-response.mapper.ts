import { Task } from '@/database/entities/task.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';

function toTaskUserResponse(member: WorkspaceMember) {
  return {
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    workspaceRole: member.role,
    membershipStatus: member.status,
  };
}

export function toTaskResponse(
  task: Task,
  membershipsByUserId: Map<number, WorkspaceMember>,
) {
  const createdByMembership = membershipsByUserId.get(task.createdByUserId);
  const assignedToMembership = task.assignedToUserId
    ? membershipsByUserId.get(task.assignedToUserId)
    : undefined;

  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
    createdBy: createdByMembership
      ? toTaskUserResponse(createdByMembership)
      : null,
    assignedTo: assignedToMembership
      ? toTaskUserResponse(assignedToMembership)
      : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
