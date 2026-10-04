import { AppDataSource } from '../config/database';
import { Recommendation } from '../entities/Recommendation';
import { firstAidRules } from '../data/firstAidRules';
import { medicineRules } from '../data/medicineRules';
import {
  determineSeverity,
  mapPredictLabelToWoundType,
} from './firstAid.service';

const recommendationRepository = AppDataSource.getRepository(Recommendation);

export async function saveRecommendation(
  predictionId: number,
  recommendText: string,
  risk: string,
  proReccom: string,
  warningNote?: string
) {
  try {
    const recommendationData: any = {
      prediction_id: predictionId,
      recommend_text: recommendText,
      risk,
      pro_reccom: proReccom,
      warning_note: warningNote || 'ข้อมูลนี้เป็นการปฐมพยาบาลเบื้องต้น ไม่สามารถทดแทนแพทย์ได้'
    };

    const recommendation = recommendationRepository.create(recommendationData);
    await recommendationRepository.save(recommendation);

    return recommendation;
  } catch (error) {
    console.error('Save recommendation error:', error);
    throw error;
  }
}

export async function getRecommendationByPredictionId(predictionId: number) {
  try {
    const recommendation = await recommendationRepository.findOne({
      where: { prediction_id: predictionId },
      relations: ['prediction']
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    const prediction = recommendation.prediction;
    const woundType = mapPredictLabelToWoundType(prediction?.predict_label || null);

    if (woundType === 'cut' || woundType === 'abrasion' || woundType === 'burn' || woundType === 'bruise') {
      const severity = determineSeverity(
        woundType,
        prediction.wound_size,
        prediction.length,
        prediction.depth
      );

      const ruleKey = woundType === 'cut'
        ? severity === 'large' ? 'cut_large' : 'cut_small'
        : woundType;
      const firstAid = firstAidRules[ruleKey];
      const currentMedicineRules = medicineRules[ruleKey];

      return {
        ...recommendation,
        recommend_text: firstAid.steps.join('\n'),
        pro_reccom: currentMedicineRules.join(', '),
      };
    }

    return recommendation;
  } catch (error) {
    console.error('Get recommendation error:', error);
    throw error;
  }
}
