import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('model_info')
export class ModelInfo {
  @PrimaryGeneratedColumn()
  model_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  model_name: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  version: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model_path: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  action_date: Date | null;

  @Column({ type: 'int', nullable: false })
  admin_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;
}
