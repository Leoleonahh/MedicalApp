import { Router } from "express";
import { getHotlines } from "../controllers/hotline.controller";

const router = Router();

router.get("/", getHotlines);

export default router;