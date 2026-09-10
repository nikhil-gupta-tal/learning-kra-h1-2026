import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '@/database/entities/project.entity';
import { WorkspaceMember } from '@/database/entities/workspace-member.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, WorkspaceMember])],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
