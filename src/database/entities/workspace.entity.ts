import { Column, Entity, Index, OneToMany } from 'typeorm';
import { WorkspaceStatus } from '@/common/enums/workspace.enums';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { WorkspaceMember } from './workspace-member.entity';

@Entity('workspaces')
@Index(['slug'], { unique: true })
export class Workspace extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 64 })
  slug: string;

  @Column({
    type: 'enum',
    enum: WorkspaceStatus,
    enumName: 'workspace_status_enum',
    default: WorkspaceStatus.ACTIVE,
  })
  status: WorkspaceStatus;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => Project, (project) => project.workspace)
  projects: Project[];
}
