import { Router } from "express";
import multer from "multer";

import {
    registerPharmacy,
    myVerifiedPharmacies,
    allVerifiedPharmacies,
    pharmacyDetail,
    updatePromptPayNumber
} from "../controllers/pharmacy.controller";

import { authMiddleware } from "../services/auth.service";

const router = Router();

// *===== Multer config =====*
const upload = multer({
    storage: multer.diskStorage({

        destination: (req, file, cb) => {

            cb(
                null,
                "assets/license/"
            );

        },

        filename: (req, file, cb) => {

            const unique =
                Date.now() +
                "-" +
                Math.round(
                    Math.random() * 1e9
                );

            cb(
                null,
                "license-" +
                unique +
                "-" +
                file.originalname
            );

        },

    }),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

});

// ========================================
// Register Pharmacy
// JWT + Upload License
// ========================================

router.post(
    "/register",

    authMiddleware,

    upload.single("license"),

    registerPharmacy
);

router.get(
    "/my/verified",
    authMiddleware,
    myVerifiedPharmacies
);

router.get(
    "/verified",
    allVerifiedPharmacies
);

// ========================================
// ดูรายละเอียด Pharmacy
// Public API
// ========================================

router.get(
    "/:pharmacyId",

    pharmacyDetail
);

// ========================================
// Update PromptPay
// JWT
// ========================================

router.put(
    "/:pharmacyId/promptpay",

    authMiddleware,

    updatePromptPayNumber
);

export default router;