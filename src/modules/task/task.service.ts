import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectStatus } from '@/common/enums/project.enums';
import { toPaginatedResponse } from '@/common/mappers/paginated-response.mapper';
import { toTaskResponse } from '@/common/mappers/task-response.mapper';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import { Project } from '@/database/entities/project.entity';
import { Task } from '@/database/entities/task.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { CreateTaskDto, ListTasksDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async create(
    workspaceId: number,
    projectId: number,
    userId: number,
    createTaskDto: CreateTaskDto,
  ) {
    await this.requireWritableProject(workspaceId, projectId, userId);
    if (createTaskDto.assignedToUserId) {
      await this.findActiveMember(workspaceId, createTaskDto.assignedToUserId);
    }

    const task = this.taskRepository.create({
      projectId,
      createdByUserId: userId,
      assignedToUserId: createTaskDto.assignedToUserId ?? null,
      title: createTaskDto.title.trim(),
      description: createTaskDto.description ?? null,
      dueDate: createTaskDto.dueDate ?? null,
      priority: createTaskDto.priority,
      status: createTaskDto.status,
    });
    return this.toResponse(await this.taskRepository.save(task), workspaceId);
  }

  async list(
    workspaceId: number,
    projectId: number,
    userId: number,
    listTasksDto: ListTasksDto,
  ) {
    await this.requireReadableProject(workspaceId, projectId, userId);
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.projectId = :projectId', { projectId });

    if (listTasksDto.status) {
      query.andWhere('task.status = :status', { status: listTasksDto.status });
    }
    if (listTasksDto.priority) {
      query.andWhere('task.priority = :priority', {
        priority: listTasksDto.priority,
      });
    }
    if (listTasksDto.assignedToUserId) {
      query.andWhere('task.assignedToUserId = :assignedToUserId', {
        assignedToUserId: listTasksDto.assignedToUserId,
      });
    }
    const search = listTasksDto.search?.trim();
    if (search) {
      query.andWhere('task.title ILIKE :search', { search: `%${search}%` });
    }

    const [tasks, total] = await query
      .orderBy('task.createdAt', 'DESC')
      .skip((listTasksDto.page - 1) * listTasksDto.limit)
      .take(listTasksDto.limit)
      .getManyAndCount();
    const membershipsByUserId = await this.findMembershipsForTasks(
      workspaceId,
      tasks,
    );

    return toPaginatedResponse(
      tasks.map((task) => toTaskResponse(task, membershipsByUserId)),
      listTasksDto.page,
      listTasksDto.limit,
      total,
    );
  }

  async get(
    workspaceId: number,
    projectId: number,
    taskId: number,
    userId: number,
  ) {
    await this.requireReadableProject(workspaceId, projectId, userId);
    const task = await this.findTask(projectId, taskId);
    return this.toResponse(task, workspaceId);
  }

  async update(
    workspaceId: number,
    projectId: number,
    taskId: number,
    userId: number,
    updateTaskDto: UpdateTaskDto,
  ) {
    await this.requireWritableProject(workspaceId, projectId, userId);
    const task = await this.findTask(projectId, taskId);
    if (updateTaskDto.assignedToUserId !== undefined) {
      if (updateTaskDto.assignedToUserId !== null) {
        await this.findActiveMember(
          workspaceId,
          updateTaskDto.assignedToUserId,
        );
      }
      task.assignedToUserId = updateTaskDto.assignedToUserId;
    }
    if (updateTaskDto.title !== undefined) {
      task.title = updateTaskDto.title.trim();
    }
    if (updateTaskDto.description !== undefined) {
      task.description = updateTaskDto.description;
    }
    if (updateTaskDto.dueDate !== undefined) {
      task.dueDate = updateTaskDto.dueDate;
    }
    if (updateTaskDto.priority !== undefined) {
      task.priority = updateTaskDto.priority;
    }
    if (updateTaskDto.status !== undefined) {
      task.status = updateTaskDto.status;
    }
    return this.toResponse(await this.taskRepository.save(task), workspaceId);
  }

  async remove(
    workspaceId: number,
    projectId: number,
    taskId: number,
    userId: number,
  ) {
    await this.requireWritableProject(workspaceId, projectId, userId);
    const task = await this.findTask(projectId, taskId);
    await this.taskRepository.remove(task);
  }

  private async toResponse(task: Task, workspaceId: number) {
    const hydratedTask = await this.taskRepository.findOne({
      where: { id: task.id },
      relations: { createdBy: true, assignedTo: true },
    });
    if (!hydratedTask) {
      throw new NotFoundException('Task not found');
    }
    const membershipsByUserId = await this.findMembershipsForTasks(
      workspaceId,
      [hydratedTask],
    );
    return toTaskResponse(hydratedTask, membershipsByUserId);
  }

  private async requireReadableProject(
    workspaceId: number,
    projectId: number,
    userId: number,
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    const project = await this.findProject(workspaceId, projectId);
    if (
      project.status === ProjectStatus.INACTIVE &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async requireWritableProject(
    workspaceId: number,
    projectId: number,
    userId: number,
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    if (membership.workspace.status === WorkspaceStatus.INACTIVE) {
      throw new ForbiddenException('Workspace is inactive');
    }
    const project = await this.findProject(workspaceId, projectId);
    if (project.status === ProjectStatus.INACTIVE) {
      throw new ForbiddenException('Inactive project cannot be updated');
    }
    return project;
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

  private async findTask(projectId: number, taskId: number) {
    const task = await this.taskRepository.findOneBy({ id: taskId, projectId });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private async findActiveMember(workspaceId: number, userId: number) {
    const membership = await this.memberRepository.findOneBy({
      workspaceId,
      userId,
      status: WorkspaceStatus.ACTIVE,
    });
    if (!membership) {
      throw new NotFoundException('Workspace member not found');
    }
    return membership;
  }

  private async findMembershipsForTasks(workspaceId: number, tasks: Task[]) {
    const userIds = [
      ...new Set(
        tasks.flatMap((task) =>
          task.assignedToUserId
            ? [task.createdByUserId, task.assignedToUserId]
            : [task.createdByUserId],
        ),
      ),
    ];
    if (userIds.length === 0) {
      return new Map<number, WorkspaceMember>();
    }
    const memberships = await this.memberRepository.find({
      where: { workspaceId, userId: In(userIds) },
      relations: { user: true },
    });
    return new Map(
      memberships.map((membership) => [membership.userId, membership]),
    );
  }
}
