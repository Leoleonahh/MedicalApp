import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('users')
@Index('IDX_username', ['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @Column({ type: 'datetime', nullable: true })
  last_login: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
