import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';
import { Prediction } from './Prediction';

@Entity('recommendation')
export class Recommendation {
  @PrimaryGeneratedColumn()
  recommend_id: number;

  @Column({ type: 'longtext', nullable: true })
  recommend_text: string; // คำแนะนำปฐมพยาบาล (first aid steps)

  @Column({ type: 'longtext', nullable: true })
  warning_note: string; // ข้อเตือน

  @Column({ type: 'varchar', length: 45, nullable: true })
  risk: string; // ระดับความอันตรายบาดแผล (ต่ำ, กลาง, สูง)

  @Column({ type: 'longtext', nullable: true })
  pro_reccom: string; // ยาที่แนะนำ (comma-separated medicine names)

  @Column({ type: 'int', nullable: true })
  prediction_id: number; // FK to Prediction

  @Column({ type: 'int', nullable: true })
  hospital_id: number | null; // FK to Hospital (optional)

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Prediction, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'prediction_id' })
  prediction: Prediction;
}
