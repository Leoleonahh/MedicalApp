import { Router } from "express";
import {
  listPendingPharmacies,
  approvePharmacyByAdmin,
  rejectPharmacyByAdmin,
} from "../controllers/pharmacy.admin.controller";

import {
    authMiddleware,
} from "../services/auth.service";

import {
    adminMiddleware,
} from "../middlewares/admin.middleware";

const router = Router();

router.get(
    "/pharmacies/pending",
    authMiddleware,
    adminMiddleware,
    listPendingPharmacies
);

router.patch(
    "/pharmacies/:id/approve",
    authMiddleware,
    adminMiddleware,
    approvePharmacyByAdmin
);
router.patch(
    "/pharmacies/:id/reject",
    authMiddleware,
    adminMiddleware,
    rejectPharmacyByAdmin
);

export default router;