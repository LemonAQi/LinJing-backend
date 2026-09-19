import { Exclude } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 32 })
  username: string;

  @Column({ type: 'varchar', length: 128, nullable: true, unique: true })
  email?: string | null;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ length: 32, default: '' })
  nickname: string;

  @Column({ type: 'varchar', length: 16, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'varchar', length: 16, default: UserStatus.ACTIVE })
  status: UserStatus;
}
