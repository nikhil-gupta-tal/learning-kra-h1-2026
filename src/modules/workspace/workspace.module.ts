import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { Task } from '@/database/entities/task.entity';
import { Workspace } from '@/database/entities/workspace.entity';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { WorkspaceRoleGuard } from '@/common/guards/workspace-role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, User, Task])],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceRoleGuard],
})
export class WorkspaceModule {}
