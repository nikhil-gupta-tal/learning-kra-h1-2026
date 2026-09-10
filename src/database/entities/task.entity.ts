import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TaskPriority, TaskStatus } from '@/common/enums/task.enums';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity('tasks')
@Index(['projectId', 'createdAt'])
@Index(['assignedToUserId'])
export class Task extends BaseEntity {
  @Column()
  projectId: number;

  @Column()
  createdByUserId: number;

  @Column({ nullable: true })
  assignedToUserId: number | null;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    enumName: 'task_priority_enum',
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status_enum',
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo: User | null;
}
