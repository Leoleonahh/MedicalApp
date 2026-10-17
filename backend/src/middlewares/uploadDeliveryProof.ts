import { mkdirSync } from "fs";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const deliveryProofDirectory = path.join(
  process.cwd(),
  "assets",
  "uploads",
  "delivery-proofs"
);

mkdirSync(deliveryProofDirectory, { recursive: true });

export const uploadDeliveryProof = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, deliveryProofDirectory);
    },
    filename: (_request, file, callback) => {
      callback(
        null,
        `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("หลักฐานการจัดส่งต้องเป็นไฟล์รูปภาพ"));
      return;
    }
    callback(null, true);
  },
});