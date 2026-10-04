import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('wound_image')
export class WoundImage {
  @PrimaryGeneratedColumn()
  image_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  image_path: string;

  @CreateDateColumn()
  upload_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  associated_symptom: string | null;

  @Column({ type: 'date', nullable: true })
  incident_date: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  wound_site: string | null;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
