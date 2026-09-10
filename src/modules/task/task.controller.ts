import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types';
import { CreateTaskDto, ListTasksDto, UpdateTaskDto } from './dto/task.dto';
import { TaskService } from './task.service';

@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createTaskDto: CreateTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.taskService.create(
      workspaceId,
      projectId,
      request.auth.sub,
      createTaskDto,
    );
  }

  @Get()
  list(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query() listTasksDto: ListTasksDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.taskService.list(
      workspaceId,
      projectId,
      request.auth.sub,
      listTasksDto,
    );
  }

  @Get(':taskId')
  get(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.taskService.get(
      workspaceId,
      projectId,
      taskId,
      request.auth.sub,
    );
  }

  @Patch(':taskId')
  update(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.taskService.update(
      workspaceId,
      projectId,
      taskId,
      request.auth.sub,
      updateTaskDto,
    );
  }

  @Delete(':taskId')
  @HttpCode(204)
  remove(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.taskService.remove(
      workspaceId,
      projectId,
      taskId,
      request.auth.sub,
    );
  }
}
