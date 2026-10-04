import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { TypePro } from "./TypePro";
import { Pharmacy } from "./Pharmacy";

@Entity("product")
export class Product {

  @PrimaryGeneratedColumn()
  product_id: number;

  @Column({
    type: "varchar",
    length: 150,
  })
  product_name: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description: string | null;

  @Column()
  typepro_id: number;

  @Column({
    type: "varchar",
    length: 200,
    nullable: true,
  })
  image: string | null;

  @Column({ type: "int", nullable: true })
  created_by_pharmacy_id: number | null;

  @ManyToOne(() => TypePro, (type) => type.products)
  @JoinColumn({ name: "typepro_id" })
  typepro: TypePro;

  @ManyToOne(() => Pharmacy, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by_pharmacy_id" })
  createdByPharmacy: Pharmacy | null;
}