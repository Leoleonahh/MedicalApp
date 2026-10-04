import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('password_reset_otp')
@Index('IDX_user_id', ['user_id'])
export class PasswordResetOTP {
  @PrimaryGeneratedColumn()
  otp_id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 64, nullable: false })
  otp_code: string;

  @Column({ type: 'datetime', nullable: false })
  expires_at: Date;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_used: number;

  @CreateDateColumn()
  created_at: Date;
}
