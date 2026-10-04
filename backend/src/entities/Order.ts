import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { User } from "./User";
import { Pharmacy } from "./Pharmacy";

@Entity("orders")
export class Order {

  @PrimaryGeneratedColumn()
  order_id: number;

  @Column()
  user_id: number;

  @Column()
  pharmacy_id: number;

  @Column({
    type: "varchar",
    length: 150,
  })
  receiver_name: string;

  @Column({
    type: "varchar",
    length: 20,
  })
  receiver_phone: string;

  @Column({
    type: "text",
  })
  delivery_address: string;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  total_price: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    default: 0,
  })
  shipping_fee: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  grand_total: number;

  @Column({
    type: "enum",
    enum: ["COD", "PROMPTPAY"],
    default: "COD",
  })
  payment_method: string;

  @Column({
    type: "enum",
    enum: [
      "UNPAID",
      "PENDING_VERIFY",
      "PAID",
    ],
    default: "UNPAID",
  })
  payment_status: string;

  @Column({
    type: "enum",
    enum: [
      "PENDING",
      "PREPARING",
      "SHIPPING",
      "DELIVERED",
      "CANCELLED",
    ],
    default: "PENDING",
  })
  order_status: string;

  @Column({
    type: "text",
    nullable: true,
  })
  note: string;

  // ===============================
  // PromptPay & OCR
  // ===============================

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  payment_slip: string;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  ocr_amount: number | null;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  ocr_datetime: string | null;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  ocr_reference: string | null;

  @Column({
    default: false,
  })
  ocr_match: boolean;

  @Column({
    type: "datetime",
    nullable: true,
  })
  verified_at: Date;

  @Column({
    type: "int",
    nullable: true,
  })
  verified_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: "text",
    nullable: true,
  })
  reject_reason: string | null;

  // ===============================
  // Relations
  // ===============================

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Pharmacy)
  @JoinColumn({ name: "pharmacy_id" })
  pharmacy: Pharmacy;

  @ManyToOne(() => User)
  @JoinColumn({ name: "verified_by" })
  verified_user: User;

}