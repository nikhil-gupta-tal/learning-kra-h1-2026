import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types';
import {
  CreateProjectDto,
  ListProjectsDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
} from './dto/project.dto';
import { ProjectService } from './project.service';

@Controller('workspaces/:workspaceId/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() createProjectDto: CreateProjectDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectService.create(
      workspaceId,
      request.auth.sub,
      createProjectDto,
    );
  }

  @Get()
  list(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Query() listProjectsDto: ListProjectsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectService.list(
      workspaceId,
      request.auth.sub,
      listProjectsDto,
    );
  }

  @Get(':projectId')
  get(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectService.get(workspaceId, projectId, request.auth.sub);
  }

  @Patch(':projectId')
  update(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectService.update(
      workspaceId,
      projectId,
      request.auth.sub,
      updateProjectDto,
    );
  }

  @Patch(':projectId/status')
  updateStatus(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectService.updateStatus(
      workspaceId,
      projectId,
      request.auth.sub,
      updateProjectStatusDto,
    );
  }
}
