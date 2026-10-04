import { Request, Response } from "express";
import { getRecommendationByPredictionId } from "../services/recommendation.service";

// ✅ GET /api/recommendations/:prediction_id - ดึง recommendation ตาม prediction_id
export const getRecommendation = async (req: Request, res: Response) => {
  try {
    const { prediction_id } = req.params;

    if (!prediction_id) {
      return res.status(400).json({ error: "prediction_id is required" });
    }

    const recommendation = await getRecommendationByPredictionId(Number(prediction_id));

    return res.status(200).json({
      message: "Recommendation retrieved successfully",
      data: recommendation
    });
  } catch (error: any) {
    console.error('Get recommendation error:', error);

    if (error.message === 'Recommendation not found') {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    return res.status(500).json({ error: error.message || 'Failed to get recommendation' });
  }
};
