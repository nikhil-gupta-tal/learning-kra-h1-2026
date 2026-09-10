import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ProjectStatus } from '@/common/enums/project.enums';
import { BaseEntity } from './base.entity';
import { Workspace } from './workspace.entity';

@Entity('projects')
@Index(['workspaceId', 'name'], { unique: true })
@Index(['workspaceId', 'status'])
export class Project extends BaseEntity {
  @Column()
  workspaceId: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    enumName: 'project_status_enum',
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ManyToOne(() => Workspace, (workspace) => workspace.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;
}
