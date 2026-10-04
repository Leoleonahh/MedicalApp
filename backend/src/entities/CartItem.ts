import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";

import { Cart } from "./Cart";
import { PharmacyProduct } from "./PharmacyProduct";

@Entity("cart_item")
export class CartItem {

  @PrimaryGeneratedColumn()
  cart_item_id: number;

  @Column()
  cart_id: number;

  @Column()
  pharmacy_product_id: number;

  @Column()
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Cart, cart => cart.items)
  @JoinColumn({ name: "cart_id" })
  cart: Cart;

  @ManyToOne(() => PharmacyProduct)
  @JoinColumn({ name: "pharmacy_product_id" })
  pharmacyProduct: PharmacyProduct;

}