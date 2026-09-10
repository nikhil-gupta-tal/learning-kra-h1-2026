import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WORKSPACE_ROLES_KEY } from '@/common/decorators/workspace-roles.decorator';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowedRoles) {
      throw new ForbiddenException('Workspace roles are not configured');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const workspaceId = Number(request.params.workspaceId);
    const membership = await this.memberRepository.findOneBy({
      workspaceId,
      userId: request.auth.sub,
      status: WorkspaceStatus.ACTIVE,
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }

    return true;
  }
}
