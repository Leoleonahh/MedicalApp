import { Router } from "express";

import {
  uploadWound,
  listWounds,
  getWound,
  removeWound,
  getWoundDetailWithPrediction,
  getWoundHistoryForUser
} from "../controllers/wound.controller";

import multer from "multer";

import { authMiddleware } from "../services/auth.service";

const router = Router();

// ==========================================
// Setup multer for file uploads
// ==========================================

const upload = multer({
  storage: multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, "assets/wounds/");
    },

    filename: (req, file, cb) => {

      const uniqueSuffix =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9);

      cb(
        null,
        "wound-" +
        uniqueSuffix +
        "-" +
        file.originalname
      );

    }

  }),

  limits: {
    fileSize: 10 * 1024 * 1024
  }

});


// ==========================================
// Upload wound
// JWT required
// ==========================================

router.post(
  "/upload",
  authMiddleware,
  upload.single("image"),
  uploadWound
);


// ==========================================
// Specific routes
// JWT required
// ==========================================

router.get(
  "/detail/:imageId",
  authMiddleware,
  getWoundDetailWithPrediction
);

router.get(
  "/history/list/all",
  authMiddleware,
  getWoundHistoryForUser
);


// ==========================================
// General routes
// JWT required
// ==========================================

router.get(
  "/",
  authMiddleware,
  listWounds
);

router.get(
  "/:imageId",
  authMiddleware,
  getWound
);

router.delete(
  "/:imageId",
  authMiddleware,
  removeWound
);


export default router;