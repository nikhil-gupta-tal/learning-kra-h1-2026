import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 320 })
  email: string;

  @Column()
  passwordHash: string;
}
