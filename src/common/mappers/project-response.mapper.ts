import { Project } from '@/database/entities/project.entity';

export function toProjectResponse(project: Project) {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
