import { AppDataSource } from '../config/database';
import { Pharmacy } from "../entities/Pharmacy";
import { Product } from "../entities/Product";
import { PharmacyProduct } from "../entities/PharmacyProduct";
import { IsNull, MoreThan } from "typeorm";

const productRepository = AppDataSource.getRepository(Product);
const pharmacyProductRepository = AppDataSource.getRepository(PharmacyProduct);
const pharmacyRepository = AppDataSource.getRepository(Pharmacy);

export const createPharmacy = async (data: {
    pharmacy_name: string;
    phone: string;
    email: string;
    user_id: number;
    license: string;
    latitude?: string | null;
    longitude?: string | null;
}) => {
    const pharmacyName = data.pharmacy_name.trim();
    const existingUserPharmacy = await pharmacyRepository.findOne({
      where: { user_id: data.user_id },
    });

    if (existingUserPharmacy) {
      throw new Error("ผู้ใช้หนึ่งคนสามารถลงทะเบียนร้านขายยาได้เพียงร้านเดียว");
    }

    const existingPharmacyName = await pharmacyRepository
      .createQueryBuilder("pharmacy")
      .where("LOWER(TRIM(pharmacy.pharmacy_name)) = LOWER(:pharmacyName)", {
        pharmacyName,
      })
      .getOne();

    if (existingPharmacyName) {
      throw new Error("ชื่อร้านขายยานี้ถูกใช้แล้ว");
    }

    const latitude = data.latitude?.trim() || null;
    const longitude = data.longitude?.trim() || null;

    if (Boolean(latitude) !== Boolean(longitude)) {
      throw new Error("กรุณาระบุละติจูดและลองจิจูดให้ครบทั้งคู่");
    }

    if (latitude && longitude) {
      const latitudeValue = Number(latitude);
      const longitudeValue = Number(longitude);

      if (
        !Number.isFinite(latitudeValue) ||
        latitudeValue < -90 ||
        latitudeValue > 90 ||
        !Number.isFinite(longitudeValue) ||
        longitudeValue < -180 ||
        longitudeValue > 180
      ) {
        throw new Error("พิกัดละติจูดหรือลองจิจูดไม่ถูกต้อง");
      }
    }

    const pharmacy =
        pharmacyRepository.create({

            pharmacy_name:
          pharmacyName,

            phone:
                data.phone,

            email:
                data.email,

            user_id:
                data.user_id,

            license:
                data.license,

            latitude,

            longitude,

            status:
                "notverify",

        });

    return await pharmacyRepository.save(pharmacy);
};

// 📌 ดึงร้านที่ยังไม่ verify
export const getPendingPharmacies = async () => {
  return pharmacyRepository.find({
    where: { status: "notverify" },
    relations: ["user"],
  });
};

export const getVerifiedPharmaciesByUser = async (userId: number) => {
  return pharmacyRepository.find({
    where: {
      user_id: userId,
      status: "verify",
    },
    order: {
      created_at: "DESC",
    },
  });
};

export const getAllVerifiedPharmacies = async () => {
  return pharmacyRepository.find({
    where: {
      status: "verify",
    },
    relations: ["user"],
    order: {
      created_at: "DESC",
    },
  });
};

// ✅ อนุมัติร้าน + สร้าง Stock สินค้าอัตโนมัติ
export const approvePharmacy = async (pharmacyId: number) => {

  const pharmacy = await pharmacyRepository.findOne({
    where: { pharmacy_id: pharmacyId },
  });

  if (!pharmacy) {
    throw new Error("Pharmacy not found");
  }

  if (pharmacy.status === "verify") {
    throw new Error("Pharmacy is already approved");
  }

  // เปลี่ยนสถานะร้าน
  pharmacy.status = "verify";
  await pharmacyRepository.save(pharmacy);

  // ดึงสินค้าทั้งหมด
  const products = await productRepository.find({
    where: { created_by_pharmacy_id: IsNull() },
  });

  // สร้าง stock เริ่มต้น
  for (const product of products) {

    // ตรวจสอบก่อนว่ามีสินค้าอยู่แล้วหรือยัง
    const exist = await pharmacyProductRepository.findOne({
      where: {
        pharmacy_id: pharmacy.pharmacy_id,
        product_id: product.product_id,
      },
    });

    if (!exist) {

      const pharmacyProduct = pharmacyProductRepository.create({
        pharmacy_id: pharmacy.pharmacy_id,
        product_id: product.product_id,
        price: 0,
        stock: 0,
      });

      await pharmacyProductRepository.save(pharmacyProduct);
    }
  }

  return pharmacy;
};

// ❌ ปฏิเสธร้าน
export const rejectPharmacy = async (pharmacyId: number) => {
  const pharmacy = await pharmacyRepository.findOne({
    where: { pharmacy_id: pharmacyId },
  });

  if (!pharmacy) {
    throw new Error("Pharmacy not found");
  }

  if (pharmacy.status === "reject") {
    throw new Error("Pharmacy is already rejected");
  }

  pharmacy.status = "reject";
  return pharmacyRepository.save(pharmacy);
};

// ดูรายละเอียดร้านขายยา
export const getPharmacyDetail = async (pharmacyId: number) => {

  const pharmacy = await pharmacyRepository.findOne({
    where: {
      pharmacy_id: pharmacyId,
    },
    relations: ["user"],
  });

  if (!pharmacy) {
    throw new Error("Pharmacy not found");
  }

  const totalProducts = await pharmacyProductRepository.count({
    where: {
      pharmacy_id: pharmacyId,
    },
  });

  const availableProducts = await pharmacyProductRepository.count({
    where: {
      pharmacy_id: pharmacyId,
      stock: MoreThan(0),
    },
  });

  const outOfStock = await pharmacyProductRepository.count({
  where: {
    pharmacy_id: pharmacyId,
    stock: 0,
  },
  });

  return {
    pharmacy,
    totalProducts,
    availableProducts,
    outOfStock,
  };
};

// อัปเดต PromptPay ของร้านขายยา
export const updatePromptPay = async (
    pharmacyId: number,
    userId: number,
    promptpayNumber: string
) => {

    const pharmacy =
        await pharmacyRepository.findOne({
            where: {
                pharmacy_id: pharmacyId,
            },
        });

    if (!pharmacy) {
        throw new Error(
            "Pharmacy not found"
        );
    }

    // ตรวจว่าเป็นเจ้าของร้าน
    if (pharmacy.user_id !== userId) {

        throw new Error(
            "You are not allowed to update this pharmacy"
        );

    }

    // ควรให้เฉพาะร้านที่ผ่านการอนุมัติแล้ว
    if (pharmacy.status !== "verify") {

        throw new Error(
            "Pharmacy is not verified"
        );

    }

    pharmacy.promptpay_number =
        promptpayNumber;

    await pharmacyRepository.save(
        pharmacy
    );

    return pharmacy;
};