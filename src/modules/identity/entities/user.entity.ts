import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company } from './company.entity';
import * as constants from '../../../common/constants';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['jobId'], { unique: true })
@Index(['companyId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  name!: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'profile_image' })
  profileImage!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', select: false })
  password!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'changed_password_at' })
  changedPasswordAt!: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'password_reset_code' })
  passwordResetCode!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'password_reset_code_expires_at',
  })
  passwordResetCodeExpiresAt!: Date | null;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'password_reset_code_verified',
  })
  passwordResetCodeVerified!: boolean | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_reset_code_sent_at',
  })
  lastResetCodeSentAt!: Date | null;

  @Column({
    type: 'json',
    nullable: true,
    name: 'reset_code_requests',
    default: [],
  })
  resetCodeRequests!: Date[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'enum', enum: constants.USER_ROLES, default: 'admin' })
  role!: constants.UserRole;

  @Column({ type: 'varchar', nullable: true })
  position!: string | null;

  @Column({
    type: 'int',
    unique: true,
    nullable: true,
    name: 'job_id',
    generated: 'increment',
  })
  jobId!: number | null;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'hire_date',
  })
  hireDate!: Date;

  @Column({ type: 'uuid', nullable: true, name: 'company_id' })
  companyId!: string | null;

  @Column({ type: 'json', name: 'fcm_tokens', default: [] })
  fcmTokens!: string[];

  @Column({ type: 'varchar', nullable: true, name: 'refresh_token' })
  refreshToken!: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'refresh_token_expires' })
  refreshTokenExpires!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'company_id' })
  company!: Company | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && this.password.length > 0) {
      this.password = await bcrypt.hash(this.password, 8);
    }
  }

  comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  compareRefreshToken(token: string): Promise<boolean> {
    if (!this.refreshToken) {
      return Promise.resolve(false);
    }
    return bcrypt.compare(token, this.refreshToken);
  }
}
