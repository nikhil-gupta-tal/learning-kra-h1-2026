import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '@/database/entities/project.entity';
import { Task } from '@/database/entities/task.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task, WorkspaceMember])],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
