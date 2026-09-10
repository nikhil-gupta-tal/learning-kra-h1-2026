import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import { toPaginatedResponse } from '@/common/mappers/paginated-response.mapper';
import { toWorkspaceMemberResponse } from '@/common/mappers/workspace-member-response.mapper';
import { toWorkspaceResponse } from '@/common/mappers/workspace-response.mapper';
import { isUniqueViolation } from '@/common/utils/database-error.util';
import { User } from '@/database/entities/user.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { Workspace } from '@/database/entities/workspace.entity';
import { Task } from '@/database/entities/task.entity';
import {
  AddWorkspaceMemberDto,
  CreateWorkspaceDto,
  ListWorkspaceMembersDto,
  ListWorkspacesDto,
  TransferWorkspaceOwnershipDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceMemberRoleDto,
  UpdateWorkspaceMemberStatusDto,
  UpdateWorkspaceStatusDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(userId: number, createWorkspaceDto: CreateWorkspaceDto) {
    const workspace = this.workspaceRepository.create({
      name: createWorkspaceDto.name.trim(),
      slug: createWorkspaceDto.slug,
      status: WorkspaceStatus.ACTIVE,
    });

    try {
      const savedWorkspace = await this.workspaceRepository.save(workspace);
      const ownerMembership = this.memberRepository.create({
        workspaceId: savedWorkspace.id,
        userId,
        role: WorkspaceRole.OWNER,
        status: WorkspaceStatus.ACTIVE,
      });
      await this.memberRepository.save(ownerMembership);
      return toWorkspaceResponse(savedWorkspace, WorkspaceRole.OWNER);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Workspace slug already exists');
      }
      throw error;
    }
  }

  async list(userId: number, listWorkspacesDto: ListWorkspacesDto) {
    const query = this.workspaceRepository
      .createQueryBuilder('workspace')
      .innerJoin(
        'workspace.members',
        'membership',
        'membership.userId = :userId AND membership.status = :membershipStatus',
        { userId, membershipStatus: WorkspaceStatus.ACTIVE },
      )
      .where('workspace.status = :workspaceStatus', {
        workspaceStatus: listWorkspacesDto.status,
      });

    if (listWorkspacesDto.status === WorkspaceStatus.INACTIVE) {
      query.andWhere('membership.role = :ownerRole', {
        ownerRole: WorkspaceRole.OWNER,
      });
    }

    const search = listWorkspacesDto.search?.trim();
    if (search) {
      query.andWhere(
        '(workspace.name ILIKE :search OR workspace.slug ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const [workspaces, total] = await query
      .orderBy(
        `workspace.${listWorkspacesDto.sortBy}`,
        listWorkspacesDto.sortOrder.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((listWorkspacesDto.page - 1) * listWorkspacesDto.limit)
      .take(listWorkspacesDto.limit)
      .getManyAndCount();

    return toPaginatedResponse(
      workspaces.map((workspace) => toWorkspaceResponse(workspace)),
      listWorkspacesDto.page,
      listWorkspacesDto.limit,
      total,
    );
  }

  async get(workspaceId: number, userId: number) {
    const membership = await this.requireMembership(workspaceId, userId);
    return toWorkspaceResponse(membership.workspace, membership.role);
  }

  async update(
    workspaceId: number,
    userId: number,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const membership = await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.OWNER,
    ]);
    if (updateWorkspaceDto.name !== undefined) {
      membership.workspace.name = updateWorkspaceDto.name.trim();
    }
    if (updateWorkspaceDto.slug !== undefined) {
      membership.workspace.slug = updateWorkspaceDto.slug;
    }

    try {
      const workspace = await this.workspaceRepository.save(
        membership.workspace,
      );
      return toWorkspaceResponse(workspace, membership.role);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Workspace slug already exists');
      }
      throw error;
    }
  }

  async members(
    workspaceId: number,
    userId: number,
    listWorkspaceMembersDto: ListWorkspaceMembersDto,
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    if (
      listWorkspaceMembersDto.status === WorkspaceStatus.INACTIVE &&
      membership.role !== WorkspaceRole.OWNER
    ) {
      throw new ForbiddenException('Only the owner can view inactive members');
    }

    const query = this.memberRepository
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.user', 'user')
      .where('membership.workspaceId = :workspaceId', { workspaceId })
      .andWhere('membership.status = :status', {
        status: listWorkspaceMembersDto.status,
      });

    const search = listWorkspaceMembersDto.search?.trim();
    if (search) {
      query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const sortColumn = ['name', 'email'].includes(
      listWorkspaceMembersDto.sortBy,
    )
      ? `user.${listWorkspaceMembersDto.sortBy}`
      : `membership.${listWorkspaceMembersDto.sortBy}`;
    const [members, total] = await query
      .orderBy(
        sortColumn,
        listWorkspaceMembersDto.sortOrder.toUpperCase() as 'ASC' | 'DESC',
      )
      .skip((listWorkspaceMembersDto.page - 1) * listWorkspaceMembersDto.limit)
      .take(listWorkspaceMembersDto.limit)
      .getManyAndCount();

    return toPaginatedResponse(
      members.map((member) => toWorkspaceMemberResponse(member)),
      listWorkspaceMembersDto.page,
      listWorkspaceMembersDto.limit,
      total,
    );
  }

  async addMember(
    workspaceId: number,
    userId: number,
    addWorkspaceMemberDto: AddWorkspaceMemberDto,
  ) {
    await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.MANAGER,
    ]);
    const email = addWorkspaceMemberDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException('User email not found');
    }

    const role = addWorkspaceMemberDto.role ?? WorkspaceRole.MEMBER;
    const existingMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: user.id },
      relations: { user: true },
    });
    if (existingMember?.status === WorkspaceStatus.ACTIVE) {
      throw new ConflictException('User is already a workspace member');
    }

    if (existingMember) {
      existingMember.role = role;
      existingMember.status = WorkspaceStatus.ACTIVE;
      const member = await this.memberRepository.save(existingMember);
      return toWorkspaceMemberResponse(member);
    }

    try {
      const member = await this.memberRepository.save(
        this.memberRepository.create({
          workspaceId,
          userId: user.id,
          role,
          status: WorkspaceStatus.ACTIVE,
          user,
        }),
      );
      return toWorkspaceMemberResponse(member);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('User is already a workspace member');
      }
      throw error;
    }
  }

  async updateMemberRole(
    workspaceId: number,
    targetUserId: number,
    userId: number,
    updateWorkspaceMemberRoleDto: UpdateWorkspaceMemberRoleDto,
  ) {
    await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.OWNER,
      WorkspaceRole.MANAGER,
    ]);
    if (targetUserId === userId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const targetMembership = await this.findActiveMembership(
      workspaceId,
      targetUserId,
    );
    if (targetMembership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Owner role cannot be changed');
    }

    targetMembership.role = updateWorkspaceMemberRoleDto.role;
    const member = await this.memberRepository.save(targetMembership);
    return toWorkspaceMemberResponse(member);
  }

  async updateStatus(
    workspaceId: number,
    userId: number,
    updateWorkspaceStatusDto: UpdateWorkspaceStatusDto,
  ) {
    const membership = await this.requireMembership(workspaceId, userId);
    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only the owner can update workspace status',
      );
    }
    if (
      membership.workspace.status === WorkspaceStatus.INACTIVE &&
      updateWorkspaceStatusDto.status !== WorkspaceStatus.ACTIVE
    ) {
      throw new ForbiddenException('Inactive workspace cannot be updated');
    }

    membership.workspace.status = updateWorkspaceStatusDto.status;
    const workspace = await this.workspaceRepository.save(membership.workspace);
    return toWorkspaceResponse(workspace, membership.role);
  }

  async updateMemberStatus(
    workspaceId: number,
    targetUserId: number,
    userId: number,
    updateWorkspaceMemberStatusDto: UpdateWorkspaceMemberStatusDto,
  ) {
    await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.OWNER,
    ]);
    const targetMembership = await this.findMembership(
      workspaceId,
      targetUserId,
    );
    if (targetMembership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Owner membership cannot be deactivated');
    }

    targetMembership.status = updateWorkspaceMemberStatusDto.status;
    const member = await this.memberRepository.save(targetMembership);
    if (member.status === WorkspaceStatus.INACTIVE) {
      await this.clearTaskAssignments(workspaceId, targetUserId);
    }
    return toWorkspaceMemberResponse(member);
  }

  async transferOwnership(
    workspaceId: number,
    userId: number,
    transferWorkspaceOwnershipDto: TransferWorkspaceOwnershipDto,
  ) {
    const ownerMembership = await this.requireWriteMembership(
      workspaceId,
      userId,
      [WorkspaceRole.OWNER],
    );
    if (transferWorkspaceOwnershipDto.userId === userId) {
      throw new ForbiddenException('Ownership target must be another member');
    }

    const targetMembership = await this.findActiveMembership(
      workspaceId,
      transferWorkspaceOwnershipDto.userId,
    );
    if (targetMembership.role === WorkspaceRole.OWNER) {
      throw new ConflictException('User is already the workspace owner');
    }

    ownerMembership.role = WorkspaceRole.MANAGER;
    await this.memberRepository.save(ownerMembership);
    targetMembership.role = WorkspaceRole.OWNER;
    const member = await this.memberRepository.save(targetMembership);
    return toWorkspaceMemberResponse(member);
  }

  async leave(workspaceId: number, userId: number) {
    const membership = await this.requireWriteMembership(workspaceId, userId, [
      WorkspaceRole.MANAGER,
      WorkspaceRole.MEMBER,
    ]);
    membership.status = WorkspaceStatus.INACTIVE;
    const member = await this.memberRepository.save(membership);
    await this.clearTaskAssignments(workspaceId, userId);
    return toWorkspaceMemberResponse(member);
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

  private async findActiveMembership(workspaceId: number, userId: number) {
    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId, status: WorkspaceStatus.ACTIVE },
      relations: { user: true },
    });
    if (!membership) {
      throw new NotFoundException('Workspace member not found');
    }
    return membership;
  }

  private async findMembership(workspaceId: number, userId: number) {
    const membership = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: { user: true },
    });
    if (!membership) {
      throw new NotFoundException('Workspace member not found');
    }
    return membership;
  }

  private async clearTaskAssignments(workspaceId: number, userId: number) {
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ assignedToUserId: null })
      .where('"assignedToUserId" = :userId', { userId })
      .andWhere(
        '"projectId" IN (SELECT "id" FROM "projects" WHERE "workspaceId" = :workspaceId)',
        { workspaceId },
      )
      .execute();
  }
}
