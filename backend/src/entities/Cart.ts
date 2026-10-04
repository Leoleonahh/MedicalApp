import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

import { User } from "./User";
import { Pharmacy } from "./Pharmacy";
import { CartItem } from "./CartItem";

@Entity("cart")
export class Cart {

  @PrimaryGeneratedColumn()
  cart_id: number;

  @Column()
  user_id: number;

  @Column()
  pharmacy_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Pharmacy)
  @JoinColumn({ name: "pharmacy_id" })
  pharmacy: Pharmacy;

  @OneToMany(() => CartItem, item => item.cart)
  items: CartItem[];
}