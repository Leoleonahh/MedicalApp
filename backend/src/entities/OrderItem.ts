import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Order } from "./Order";
import { PharmacyProduct } from "./PharmacyProduct";

@Entity("order_item")
export class OrderItem {

  @PrimaryGeneratedColumn()
  order_item_id: number;

  @Column()
  order_id: number;

  @Column()
  pharmacy_product_id: number;

  @Column({
    type: "varchar",
    length: 150,
  })
  product_name: string;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  unit_price: number;

  @Column()
  quantity: number;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => PharmacyProduct)
  @JoinColumn({ name: "pharmacy_product_id" })
  pharmacyProduct: PharmacyProduct;

}