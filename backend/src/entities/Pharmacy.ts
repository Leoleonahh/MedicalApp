import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("pharmacy")
export class Pharmacy {

  @PrimaryGeneratedColumn()
  pharmacy_id: number;

  @Column({ type: "varchar", length: 150 })
  pharmacy_name: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  latitude: string | null;

  @Column({ type: "varchar", length: 200, nullable: true })
  longitude: string | null;

  @Column({ type: "varchar", length: 50 })
  phone: string;

  // ✅ เพิ่ม PromptPay ของร้าน
  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
  })
  promptpay_number: string;

  @Column({ type: "varchar", length: 100 })
  email: string;

  @Column({ type: "varchar", length: 500 })
  license: string;

  @Column({
    type: "varchar",
    length: 100,
    default: "notverify",
  })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: "int" })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

}