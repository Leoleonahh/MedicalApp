import { Router } from "express";
import { getAdminStats } from "../controllers/admin.stats.controller";
import { authMiddleware } from "../services/auth.service";
import { adminMiddleware } from "../middlewares/admin.middleware";

const router = Router();

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getAdminStats
);

export default router;