import { Request, Response } from "express";

import {
  uploadWoundService,
  getWoundImages,
  getWoundImageDetail,
  deleteWoundImage,
  getWoundDetailWithAnalysis,
  getWoundHistoryWithStatus
} from "../services/wound.service";


// ======================================================
// Upload Wound
// ======================================================

export async function uploadWound(
  req: Request & { user?: any },
  res: Response
) {

  try {

    // ==========================================
    // ดึง user_id จาก JWT
    // ==========================================

    const userId = req.user?.user_id;

    if (!userId) {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }


    // ==========================================
    // ตรวจสอบรูปภาพ
    // ==========================================

    if (!req.file) {

      return res.status(400).json({
        error: "Image required"
      });

    }


    // ==========================================
    // รับข้อมูลจาก Body
    // ไม่รับ user_id แล้ว
    // ==========================================

    const {
      associated_symptom,
      incident_date,
      wound_site,
      latitude,
      longitude
    } = req.body;


    // ==========================================
    // Upload wound
    // ==========================================

    const result =
      await uploadWoundService({

        user_id: Number(userId),

        image_path:
          req.file.filename,

        associated_symptom,

        incident_date,

        wound_site,

        latitude:
          latitude
            ? parseFloat(latitude)
            : undefined,

        longitude:
          longitude
            ? parseFloat(longitude)
            : undefined

      });


    // ==========================================
    // Response
    // ==========================================

    return res.status(201).json({

      message: "Upload success",

      data: result

    });

  } catch (error: any) {

    console.error(
      "Upload wound error:",
      error
    );


    if (
      error.message ===
      "User not found"
    ) {

      return res.status(404).json({
        error: "User not found"
      });

    }


    return res.status(500).json({

      error:
        error.message ||
        "Upload failed"

    });

  }

}


// ======================================================
// List Wounds
// ======================================================

export async function listWounds(
  req: Request & { user?: any },
  res: Response
) {

  try {

    // ==========================================
    // ดึง user_id จาก JWT
    // ==========================================

    const userId =
      req.user?.user_id;


    if (!userId) {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }


    // ==========================================
    // Limit
    // ==========================================

    const limit =
      req.query.limit
        ? parseInt(
            req.query.limit as string
          )
        : 50;


    // ==========================================
    // ดึงข้อมูล
    // ==========================================

    const images =
      await getWoundImages(
        Number(userId),
        limit
      );


    return res.status(200).json({

      message: "Fetch success",

      data: images,

      total: images.length

    });

  } catch (error: any) {

    console.error(
      "List wounds error:",
      error
    );


    return res.status(500).json({
      error: "Fetch failed"
    });

  }

}


// ======================================================
// Get Wound
// ======================================================

export async function getWound(
  req: Request & { user?: any },
  res: Response
) {

  try {

    const { imageId } = req.params;

    // ================================
    // User ID จาก JWT
    // ================================

    const userId =
      req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    if (!imageId) {
      return res.status(400).json({
        error: "Image ID required"
      });
    }

    // ================================
    // ส่ง imageId + userId
    // ================================

    const image =
      await getWoundImageDetail(
        Number(imageId),
        Number(userId)
      );

    return res.status(200).json({

      message: "Fetch success",

      data: image

    });

  } catch (error: any) {

    console.error(
      "Get wound error:",
      error
    );

    if (
      error.message ===
      "Image not found"
    ) {

      return res.status(404).json({
        error: "Image not found"
      });

    }

    if (
      error.message.includes(
        "Unauthorized"
      )
    ) {

      return res.status(403).json({
        error: error.message
      });

    }

    return res.status(500).json({
      error: "Fetch failed"
    });

  }
}


// ======================================================
// Remove Wound
// ======================================================

export async function removeWound(
  req: Request & { user?: any },
  res: Response
) {

  try {

    const { imageId } =
      req.params;


    // ==========================================
    // ดึง user_id จาก JWT
    // ==========================================

    const userId =
      req.user?.user_id;


    if (!imageId) {

      return res.status(400).json({
        error: "Image ID required"
      });

    }


    if (!userId) {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }


    // ==========================================
    // ลบข้อมูล
    // ==========================================

    const result =
      await deleteWoundImage(
        Number(imageId),
        Number(userId)
      );


    return res.status(200).json({

      message:
        result.message

    });

  } catch (error: any) {

    console.error(
      "Delete wound error:",
      error
    );


    if (
      error.message ===
      "Image not found"
    ) {

      return res.status(404).json({
        error: "Image not found"
      });

    }


    if (
      error.message.includes(
        "Unauthorized"
      )
    ) {

      return res.status(403).json({
        error: error.message
      });

    }


    return res.status(500).json({
      error: "Delete failed"
    });

  }

}


// ======================================================
// Get Wound Detail + Prediction
// ======================================================

export async function getWoundDetailWithPrediction(
  req: Request & { user?: any },
  res: Response
) {

  try {

    const { imageId } =
      req.params;

    // ================================
    // User ID จาก JWT
    // ================================

    const userId =
      req.user?.user_id;

    if (!userId) {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }

    if (!imageId) {

      return res.status(400).json({
        error: "Image ID required"
      });

    }

    // ================================
    // ส่ง imageId + userId
    // ================================

    const result =
      await getWoundDetailWithAnalysis(
        Number(imageId),
        Number(userId)
      );

    return res.status(200).json({

      message:
        "Wound detail with prediction and recommendation retrieved successfully",

      data: result

    });

  } catch (error: any) {

    console.error(
      "Get wound detail error:",
      error
    );

    if (
      error.message ===
      "Image not found"
    ) {

      return res.status(404).json({
        error: "Wound image not found"
      });

    }

    if (
      error.message.includes(
        "Unauthorized"
      )
    ) {

      return res.status(403).json({
        error: error.message
      });

    }

    return res.status(500).json({

      error:
        error.message ||
        "Failed to retrieve wound detail"

    });

  }
}


// ======================================================
// Get Wound History
// ======================================================

export async function getWoundHistoryForUser(
  req: Request & { user?: any },
  res: Response
) {

  try {

    // ==========================================
    // ดึง user_id จาก JWT
    // ==========================================

    const userId =
      req.user?.user_id;


    if (!userId) {

      return res.status(401).json({
        error: "Unauthorized"
      });

    }


    // ==========================================
    // Limit
    // ==========================================

    const limit =
      req.query.limit
        ? parseInt(
            req.query.limit as string
          )
        : 50;


    // ==========================================
    // ดึงประวัติ
    // ==========================================

    const history =
      await getWoundHistoryWithStatus(
        Number(userId),
        limit
      );


    return res.status(200).json({

      message:
        "Wound history retrieved successfully",

      total:
        history.length,

      data:
        history

    });

  } catch (error: any) {

    console.error(
      "Get wound history error:",
      error
    );


    return res.status(500).json({

      error:
        error.message ||
        "Failed to retrieve wound history"

    });

  }

}