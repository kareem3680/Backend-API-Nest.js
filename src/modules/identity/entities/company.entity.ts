import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
@Index(['email'], { unique: true })
@Index(['commercialRegisterNumber'], { unique: true })
@Index(['taxNumber'], { unique: true })
@Index(['name'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'company_image' })
  companyImage!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'name_ar' })
  nameAr!: string;

  @Column({ type: 'varchar', length: 100, name: 'name_en' })
  nameEn!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  phone!: string;

  @Column({ type: 'varchar' })
  whatsapp!: string;

  @Column({ type: 'varchar', name: 'commercial_register_number', unique: true })
  commercialRegisterNumber!: string;

  @Column({ type: 'varchar' })
  country!: string;

  @Column({ type: 'varchar', name: 'political_manager' })
  politicalManager!: string;

  @Column({ type: 'varchar', nullable: true, name: 'activity_type' })
  activityType!: string | null;

  @Column({ type: 'text', nullable: true, name: 'legal_data' })
  legalData!: string | null;

  @Column({ type: 'varchar', name: 'tax_number', unique: true })
  taxNumber!: string;

  @Column({ type: 'varchar', name: 'legal_entity_name' })
  legalEntityName!: string;

  @Column({ type: 'varchar' })
  city!: string;

  @Column({ type: 'varchar', name: 'legal_state', default: 'active' })
  legalState!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.company)
  users!: User[];
}
