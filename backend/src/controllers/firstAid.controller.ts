import { Request, Response } from "express";
import { firstAidRules } from "../data/firstAidRules";
import { getPredictionById, mapPredictLabelToWoundType, determineSeverity, calculateRiskLevel, getRecommendedMedicines } from "../services/firstAid.service";

export const recommendFirstAid = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { prediction_id } = body;

    // ✅ Validate input
    if (!prediction_id) {
      return res.status(400).json({
        error: "prediction_id is required in request body"
      });
    }

    // ✅ ดึงข้อมูล prediction จาก database
    const prediction = await getPredictionById(Number(prediction_id));

    // ✅ Map predict_label ไป woundType
    const woundType = mapPredictLabelToWoundType(prediction.predict_label);

    if (woundType === "none") {
      return res.status(200).json({
        message: "ไม่พบแผล จึงไม่มีคำแนะนำการปฐมพยาบาล",
        data: {
          prediction_id,
          wound_type: woundType,
          risk_level: null,
          wound_characteristics: {
            size: null,
            length: null,
            depth: null
          },
          recommended_medicines: [],
          steps: [],
          warning: "ผลการประเมินจาก AI อาจคลาดเคลื่อนได้"
        }
      });
    }

    // ✅ กำหนด severity จาก wound_size, length, depth
    const severity = determineSeverity(
      woundType,
      prediction.wound_size,
      prediction.length,
      prediction.depth
    );

    // ✅ คำนวณระดับความเสี่ยง [ต่ำ, กลาง, สูง]
    const riskLevel = calculateRiskLevel(
      woundType,
      prediction.wound_size,
      prediction.length,
      prediction.depth
    );

    // ✅ ดึงยาที่แนะนำสำหรับบาดแผลนี้
    const recommendedMedicines = getRecommendedMedicines(woundType, severity);

    // ✅ หา key สำหรับค้นหา first aid rules
    let key: "cut_small" | "cut_large" | "abrasion" | "burn" | "bruise" = "cut_small";

    if (woundType === "cut") {
      key = severity === "large" ? "cut_large" : "cut_small";
    } else if (woundType === "abrasion") {
      key = "abrasion";
    } else if (woundType === "burn") {
      key = "burn";
    } else if (woundType === "bruise") {
      key = "bruise";
    }

    const result = firstAidRules[key];

    if (!result) {
      return res.status(400).json({
        error: "ไม่พบคำแนะนำสำหรับอาการนี้"
      });
    }

    return res.status(200).json({
      message: "First aid recommendation retrieved successfully",
      data: {
        prediction_id,
        wound_type: woundType,
        risk_level: riskLevel,
        wound_characteristics: {
          size: prediction.wound_size,
          length: prediction.length,
          depth: prediction.depth
        },
        recommended_medicines: recommendedMedicines,
        ...result,
        warning: "ข้อมูลนี้เป็นการปฐมพยาบาลเบื้องต้น ไม่สามารถทดแทนแพทย์ได้"
      }
    });

  } catch (error: any) {
    console.error('First aid recommendation error:', error);

    if (error.message === 'Prediction not found') {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    return res.status(500).json({ error: error.message || 'Failed to get recommendation' });
  }
};