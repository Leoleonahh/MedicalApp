import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WoundImage } from './WoundImage';
import { ModelInfo } from './ModelInfo';

@Entity('prediction')
export class Prediction {
  @PrimaryGeneratedColumn()
  prediction_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  confidence: number;

  @CreateDateColumn()
  predict_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  predict_label: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  wound_size: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  length: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  depth: string | null;

  @Column({ type: 'int', nullable: false })
  image_id: number;

  @ManyToOne(() => WoundImage)
  @JoinColumn({ name: 'image_id' })
  image: WoundImage;

  @Column({ type: 'int', nullable: false })
  model_id: number;

  @ManyToOne(() => ModelInfo)
  @JoinColumn({ name: 'model_id' })
  model: ModelInfo;
}
