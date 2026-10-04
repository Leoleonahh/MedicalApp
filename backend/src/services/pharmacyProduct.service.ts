import { AppDataSource } from "../config/database";
import { PharmacyProduct } from "../entities/PharmacyProduct";
import { Product } from "../entities/Product";
import { Pharmacy } from "../entities/Pharmacy";
import { TypePro } from "../entities/TypePro";

export const createProductForPharmacy = async (
  pharmacyId: number,
  userId: number,
  data: {
    product_name: string;
    description?: string;
    typepro_id: number;
    image?: string | null;
    price: number;
    stock: number;
  }
) => {
  const productName = data.product_name.trim();
  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!productName) throw new Error("กรุณาระบุชื่อสินค้า");
  if (!Number.isFinite(price) || price < 0) throw new Error("ราคาสินค้าต้องไม่ติดลบ");
  if (!Number.isInteger(stock) || stock < 0) throw new Error("จำนวนสินค้าต้องเป็นจำนวนเต็มและไม่ติดลบ");

  return AppDataSource.transaction(async (manager) => {
    const pharmacyRepository = manager.getRepository(Pharmacy);
    const productRepository = manager.getRepository(Product);
    const pharmacyProductRepository = manager.getRepository(PharmacyProduct);
    const typeRepository = manager.getRepository(TypePro);

    const pharmacy = await pharmacyRepository.findOne({
      where: { pharmacy_id: pharmacyId, user_id: userId },
    });

    if (!pharmacy) throw new Error("คุณไม่มีสิทธิ์จัดการร้านค้านี้");
    if (pharmacy.status !== "verify") throw new Error("ร้านค้าต้องได้รับอนุมัติก่อนเพิ่มสินค้า");

    const productType = await typeRepository.findOneBy({ typepro_id: Number(data.typepro_id) });
    if (!productType) throw new Error("ไม่พบประเภทสินค้า");

    const duplicate = await productRepository
      .createQueryBuilder("product")
      .innerJoin(PharmacyProduct, "pharmacyProduct", "pharmacyProduct.product_id = product.product_id")
      .where("pharmacyProduct.pharmacy_id = :pharmacyId", { pharmacyId })
      .andWhere("LOWER(TRIM(product.product_name)) = LOWER(:productName)", { productName })
      .getOne();

    if (duplicate) throw new Error("ร้านนี้มีสินค้าชื่อนี้อยู่แล้ว");

    const product = productRepository.create({
      product_name: productName,
      description: data.description?.trim() || null,
      typepro_id: productType.typepro_id,
      image: data.image || null,
      created_by_pharmacy_id: pharmacyId,
    });
    const savedProduct = await productRepository.save(product);

    const pharmacyProduct = pharmacyProductRepository.create({
      pharmacy_id: pharmacyId,
      product_id: savedProduct.product_id,
      price,
      stock,
    });
    const savedPharmacyProduct = await pharmacyProductRepository.save(pharmacyProduct);

    return {
      pharmacy_product_id: savedPharmacyProduct.pharmacy_product_id,
      product_id: savedProduct.product_id,
      product_name: savedProduct.product_name,
      description: savedProduct.description,
      type: productType.type_name,
      image: savedProduct.image,
      price: savedPharmacyProduct.price,
      stock: savedPharmacyProduct.stock,
    };
  });
};

export const getProductTypes = async () => {
  return AppDataSource.getRepository(TypePro).find({ order: { typepro_id: "ASC" } });
};

const pharmacyProductRepository =
  AppDataSource.getRepository(PharmacyProduct);

export const updatePharmacyProduct = async (
  pharmacyId: number,
  pharmacyProductId: number,
  data: {
    price: number;
    stock: number;
  }
) => {

  const product = await pharmacyProductRepository.findOne({
    where: {
      pharmacy_product_id: pharmacyProductId,
      pharmacy_id: pharmacyId,
    },
  });

  if (!product) {
    throw new Error("Product not found in this pharmacy");
  }

  if (data.price < 0) {
    throw new Error("Price cannot be negative");
  }

  if (data.stock < 0) {
    throw new Error("Stock cannot be negative");
  }

  product.price = data.price;
  product.stock = data.stock;

  return await pharmacyProductRepository.save(product);
};

export const getProductsByPharmacy = async (
  pharmacyId: number
) => {

  return await pharmacyProductRepository.find({
    where: {
      pharmacy_id: pharmacyId,
    },
    relations: [
      "product",
      "product.typepro",
      "pharmacy",
    ],
    order: {
      product_id: "ASC",
    },
  });

};