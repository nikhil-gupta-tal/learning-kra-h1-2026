import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { WorkspaceRole, WorkspaceStatus } from '@/common/enums/workspace.enums';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

@Entity('workspace_members')
@Index(['workspaceId', 'userId'], { unique: true })
@Index('UQ_workspace_members_owner', ['workspaceId'], {
  unique: true,
  where: `"role" = 'OWNER'`,
})
@Index(['userId', 'status'])
@Index(['workspaceId', 'status'])
export class WorkspaceMember extends BaseEntity {
  @Column()
  workspaceId: number;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    enumName: 'workspace_role_enum',
  })
  role: WorkspaceRole;

  @Column({
    type: 'enum',
    enum: WorkspaceStatus,
    enumName: 'workspace_status_enum',
    default: WorkspaceStatus.ACTIVE,
  })
  status: WorkspaceStatus;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
