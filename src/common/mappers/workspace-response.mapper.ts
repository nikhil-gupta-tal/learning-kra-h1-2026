import { WorkspaceRole } from '@/common/enums/workspace.enums';
import { Workspace } from '@/database/entities/workspace.entity';

export function toWorkspaceResponse(
  workspace: Workspace,
  role?: WorkspaceRole,
) {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    status: workspace.status,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    ...(role ? { role } : {}),
  };
}
