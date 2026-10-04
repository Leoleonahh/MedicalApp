import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";
import { Product } from "./Product";

@Entity("type_pro")
export class TypePro {

  @PrimaryGeneratedColumn()
  typepro_id: number;

  @Column({
    type: "varchar",
    length: 150,
  })
  type_name: string;

  @OneToMany(() => Product, (product) => product.typepro)
  products: Product[];
}