import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from '../entities/User';
import { PasswordResetOTP } from '../entities/PasswordResetOTP';
import { ModelInfo } from '../entities/ModelInfo';
import { WoundImage } from '../entities/WoundImage';
import { Prediction } from '../entities/Prediction';
import { Recommendation } from '../entities/Recommendation';
import { Pharmacy } from "../entities/Pharmacy";
import { PharmacyProduct } from "../entities/PharmacyProduct";
import { Product } from "../entities/Product";
import { TypePro } from "../entities/TypePro";
import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: true,
  logging: false,
  entities: [User, PasswordResetOTP, ModelInfo, WoundImage, Prediction, Recommendation, Pharmacy, PharmacyProduct, Product, TypePro, Cart, CartItem, Order, OrderItem],
  migrations: [],
  subscribers: [],
});
