import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
@Index(['companyId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', nullable: true, name: 'ref_id' })
  refId!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', default: 'system' })
  module!: string;

  @Column({ type: 'varchar', default: 'low' })
  importance!: string;

  @Column({ type: 'uuid', nullable: true, name: 'from_user_id' })
  fromUserId!: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'to_role', default: [] })
  toRole!: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'to_user', default: [] })
  toUser!: string[];

  @Column({ type: 'varchar', enum: ['unread', 'read'], default: 'unread' })
  status!: string;

  @Column({ type: 'uuid', nullable: true, name: 'company_id' })
  companyId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
