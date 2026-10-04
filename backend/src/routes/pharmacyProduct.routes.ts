import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { createProduct, getProducts, listProductTypes, updateProduct } from "../controllers/pharmacyProduct.controller";
import { authMiddleware } from "../services/auth.service";


const router = Router();
const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, path.join(process.cwd(), "assets", "uploads", "products"));
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("ไฟล์สินค้าต้องเป็นรูปภาพ"));
      return;
    }
    callback(null, true);
  },
});

router.get("/products/types", listProductTypes);

router.post(
  "/:pharmacyId/products",
  authMiddleware,
  productImageUpload.single("image"),
  createProduct
);

router.put(
  "/:pharmacyId/products/:pharmacyProductId",
  updateProduct
);

router.get(
    "/:pharmacyId/products",
    getProducts
);

export default router;