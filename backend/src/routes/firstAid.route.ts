import { Router } from "express";
import { recommendFirstAid } from "../controllers/firstAid.controller";

const router = Router();

router.post("/recommend", recommendFirstAid);

export default router;