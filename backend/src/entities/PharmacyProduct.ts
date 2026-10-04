import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn
} from "typeorm";

import { Pharmacy } from "./Pharmacy";
import { Product } from "./Product";

@Entity("pharmacy_product")
export class PharmacyProduct {

    @PrimaryGeneratedColumn()
    pharmacy_product_id: number;

    @Column("decimal", {
        precision: 10,
        scale: 2,
        default: 0
    })
    price: number;

    @Column({
        default: 0
    })
    stock: number;

    @UpdateDateColumn()
    updated_at: Date;

    @Column()
    pharmacy_id: number;

    @Column()
    product_id: number;

    @ManyToOne(() => Pharmacy)
    @JoinColumn({ name: "pharmacy_id" })
    pharmacy: Pharmacy;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product: Product;
}