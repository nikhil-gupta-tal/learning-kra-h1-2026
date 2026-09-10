import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectStatus } from '@/common/enums/project.enums';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import { toPaginatedResponse } from '@/common/mappers/paginated-response.mapper';
import { toProjectResponse } from '@/common/mappers/project-response.mapper';
import { isUniqueViolation } from '@/common/utils/database-error.util';
import { Project } from '@/database/entities/project.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import {
  CreateProjectDto,
  ListProjectsDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
} from './dto/project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async create(
    workspaceId: number,
    userId: number,
    createProjectDto: CreateProjectDto,
  ) {
    await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.MANAGER,
    ]);
    const project = this.projectRepository.create({
      workspaceId,
      name: createProjectDto.name.trim(),
      description: createProjectDto.description,
      status: ProjectStatus.ACTIVE,
    });
    return this.save(project);
  }

  async list(
    workspaceId: number,
    userId: number,
    listProjectsDto: ListProjectsDto,
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    if (
      listProjectsDto.status === ProjectStatus.INACTIVE &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException('Only the owner can view inactive projects');
    }

    const query = this.projectRepository
      .createQueryBuilder('project')
      .where('project.workspaceId = :workspaceId', { workspaceId })
      .andWhere('project.status = :status', { status: listProjectsDto.status });
    const search = listProjectsDto.search?.trim();
    if (search) {
      query.andWhere('project.name ILIKE :search', { search: `%${search}%` });
    }

    const [projects, total] = await query
      .orderBy('project.createdAt', 'DESC')
      .skip((listProjectsDto.page - 1) * listProjectsDto.limit)
      .take(listProjectsDto.limit)
      .getManyAndCount();
    return toPaginatedResponse(
      projects.map((project) => toProjectResponse(project)),
      listProjectsDto.page,
      listProjectsDto.limit,
      total,
    );
  }

  async get(workspaceId: number, projectId: number, userId: number) {
    const membership = await this.requireMembership(workspaceId, userId);
    const project = await this.findProject(workspaceId, projectId);
    if (
      project.status === ProjectStatus.INACTIVE &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new NotFoundException('Project not found');
    }
    return toProjectResponse(project);
  }

  async update(
    workspaceId: number,
    projectId: number,
    userId: number,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.MANAGER,
    ]);
    const project = await this.findProject(workspaceId, projectId);
    if (project.status === ProjectStatus.INACTIVE) {
      throw new ForbiddenException('Inactive project cannot be updated');
    }
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name.trim();
    }
    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description;
    }
    return this.save(project);
  }

  async updateStatus(
    workspaceId: number,
    projectId: number,
    userId: number,
    updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the owner can update project status');
    }
    if (membership.workspace.status === WorkspaceStatus.INACTIVE) {
      throw new ForbiddenException('Workspace is inactive');
    }
    const project = await this.findProject(workspaceId, projectId);
    project.status = updateProjectStatusDto.status;
    return this.save(project);
  }

  private async save(project: Project) {
    try {
      const savedProject = await this.projectRepository.save(project);
      return toProjectResponse(savedProject);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Project name already exists in workspace');
      }
      throw error;
    }
  }

  private async requireMembership(workspaceId: number, userId: number) {
    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId, status: WorkspaceStatus.ACTIVE },
      relations: { workspace: true },
    });
    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }
    return membership;
  }

  private async requireWriteMembership(
    workspaceId: number,
    userId: number,
    allowedRoles: WorkspaceRole[],
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }
    if (membership.workspace.status === WorkspaceStatus.INACTIVE) {
      throw new ForbiddenException('Workspace is inactive');
    }
    return membership;
  }

  private async findProject(workspaceId: number, projectId: number) {
    const project = await this.projectRepository.findOneBy({
      id: projectId,
      workspaceId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}
