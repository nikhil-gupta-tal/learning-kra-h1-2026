import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceRoles } from '@/common/decorators/workspace-roles.decorator';
import { WorkspaceRole } from '@/common/enums/workspace.enums';
import { WorkspaceRoleGuard } from '@/common/guards/workspace-role.guard';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types';
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
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.create(request.auth.sub, createWorkspaceDto);
  }

  @Get()
  list(
    @Query() listWorkspacesDto: ListWorkspacesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.list(request.auth.sub, listWorkspacesDto);
  }

  @Get(':workspaceId')
  get(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.get(workspaceId, request.auth.sub);
  }

  @Patch(':workspaceId')
  update(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.update(
      workspaceId,
      request.auth.sub,
      updateWorkspaceDto,
    );
  }

  @Get(':workspaceId/members')
  members(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query() listWorkspaceMembersDto: ListWorkspaceMembersDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.members(
      workspaceId,
      request.auth.sub,
      listWorkspaceMembersDto,
    );
  }

  @Post(':workspaceId/members')
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  @UseGuards(WorkspaceRoleGuard)
  addMember(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() addWorkspaceMemberDto: AddWorkspaceMemberDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.addMember(
      workspaceId,
      request.auth.sub,
      addWorkspaceMemberDto,
    );
  }

  @Patch(':workspaceId/members/:userId')
  updateMemberRole(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateWorkspaceMemberRoleDto: UpdateWorkspaceMemberRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.updateMemberRole(
      workspaceId,
      userId,
      request.auth.sub,
      updateWorkspaceMemberRoleDto,
    );
  }

  @Patch(':workspaceId/status')
  updateStatus(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() updateWorkspaceStatusDto: UpdateWorkspaceStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.updateStatus(
      workspaceId,
      request.auth.sub,
      updateWorkspaceStatusDto,
    );
  }

  @Patch(':workspaceId/members/:userId/status')
  updateMemberStatus(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateWorkspaceMemberStatusDto: UpdateWorkspaceMemberStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.updateMemberStatus(
      workspaceId,
      userId,
      request.auth.sub,
      updateWorkspaceMemberStatusDto,
    );
  }

  @Post(':workspaceId/ownership-transfer')
  transferOwnership(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() transferWorkspaceOwnershipDto: TransferWorkspaceOwnershipDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.transferOwnership(
      workspaceId,
      request.auth.sub,
      transferWorkspaceOwnershipDto,
    );
  }

  @Delete(':workspaceId/members/me')
  leave(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.workspaceService.leave(workspaceId, request.auth.sub);
  }
}
