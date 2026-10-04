import { Request, Response } from "express";
import { createPharmacy } from "../services/pharmacy.service";
import { getPharmacyDetail } from "../services/pharmacy.service";
import { updatePromptPay } from "../services/pharmacy.service";
import { getVerifiedPharmaciesByUser } from "../services/pharmacy.service";
import { getAllVerifiedPharmacies } from "../services/pharmacy.service";

export const registerPharmacy = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const {
            pharmacy_name,
            phone,
            email,
            latitude,
            longitude,
        } = req.body;

        // ===============================
        // ตรวจสอบ JWT
        // ===============================

        const userId = req.user?.user_id;

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });

        }

        // ===============================
        // ตรวจสอบ License
        // ===============================

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "License image is required",
            });

        }

        // ===============================
        // สร้าง Pharmacy
        // ===============================

        const pharmacy =
            await createPharmacy({

                pharmacy_name,

                phone,

                email,

                user_id:
                    userId,

                license:
                    req.file.filename,

                latitude,

                longitude,

            });

        return res.status(201).json({

            success: true,

            message:
                "Pharmacy registered, waiting for admin approval",

            data: pharmacy,

        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Server error";
        const validationMessages = [
            "ผู้ใช้หนึ่งคนสามารถลงทะเบียนร้านขายยาได้เพียงร้านเดียว",
            "ชื่อร้านขายยานี้ถูกใช้แล้ว",
            "กรุณาระบุละติจูดและลองจิจูดให้ครบทั้งคู่",
            "พิกัดละติจูดหรือลองจิจูดไม่ถูกต้อง",
        ];
        const isValidationError = validationMessages.includes(message);

        if (!isValidationError) {
            console.error("Register pharmacy error:", err);
        }

        return res.status(isValidationError ? 409 : 500).json({

            success: false,

            message,

        });

    }
};

export const myVerifiedPharmacies = async (
    req: Request & { user?: any },
    res: Response
) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const pharmacies = await getVerifiedPharmaciesByUser(userId);

        return res.status(200).json({
            success: true,
            data: pharmacies,
        });
    } catch (err) {
        console.error("Get verified pharmacies error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const allVerifiedPharmacies = async (
    req: Request,
    res: Response
) => {
    try {
        const pharmacies = await getAllVerifiedPharmacies();

        return res.status(200).json({
            success: true,
            data: pharmacies,
        });
    } catch (err) {
        console.error("Get all verified pharmacies error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const pharmacyDetail = async (
  req: Request,
  res: Response
) => {

  try {

    const pharmacyId = Number(req.params.pharmacyId);

    const result = await getPharmacyDetail(pharmacyId);

    return res.json({
      success: true,
      data: {
        pharmacy_id: result.pharmacy.pharmacy_id,
        pharmacy_name: result.pharmacy.pharmacy_name,
        phone: result.pharmacy.phone,
        email: result.pharmacy.email,
        promptpay_number: result.pharmacy.promptpay_number,
        license: result.pharmacy.license,
        latitude: result.pharmacy.latitude,
        longitude: result.pharmacy.longitude,
        status: result.pharmacy.status,
        created_at: result.pharmacy.created_at,
        total_products: result.totalProducts,
        available_products: result.availableProducts,
        out_of_stock: result.outOfStock,
      },
    });

  } catch (err: any) {

    return res.status(404).json({
      success: false,
      message: err.message,
    });

  }

};

// Update PromptPay number for a pharmacy
export const updatePromptPayNumber = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        // ===============================
        // User จาก JWT
        // ===============================

        const userId =
            req.user?.user_id;

        if (!userId) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized",

            });

        }

        // ===============================
        // Pharmacy ID จาก URL
        // ===============================

        const pharmacyId =
            Number(req.params.pharmacyId);

        // ===============================
        // PromptPay
        // ===============================

        const {
            promptpay_number
        } = req.body;

        if (!promptpay_number) {

            return res.status(400).json({

                success: false,

                message:
                    "PromptPay number is required",

            });

        }

        // ===============================
        // Update
        // ===============================

        const pharmacy =
            await updatePromptPay(

                pharmacyId,

                userId,

                promptpay_number

            );

        return res.json({

            success: true,

            message:
                "PromptPay updated successfully",

            data: {

                pharmacy_id:
                    pharmacy.pharmacy_id,

                promptpay_number:
                    pharmacy.promptpay_number,

            },

        });

    } catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }
};