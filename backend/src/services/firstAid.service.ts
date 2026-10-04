import { AppDataSource } from '../config/database';
import { Prediction } from '../entities/Prediction';
import { medicineRules } from '../data/medicineRules';
import { medicineDescriptions } from '../data/medicineDescriptions';

const predictionRepository = AppDataSource.getRepository(Prediction);

export async function getPredictionById(predictionId: number) {
  try {
    const prediction = await predictionRepository.findOne({
      where: { prediction_id: predictionId },
      relations: ['model', 'image'],
    });

    if (!prediction) {
      throw new Error('Prediction not found');
    }

    return prediction;
  } catch (error) {
    console.error('Get prediction error:', error);
    throw error;
  }
}

// Map predict_label to wound type
export function mapPredictLabelToWoundType(predictLabel: string | null): string {
  if (!predictLabel) return 'unknown';
  if (predictLabel === 'ไม่มีบาดแผล') return 'none';

  if (predictLabel.includes('แผลฉีกขาด')) {
    return 'cut';
  } else if (predictLabel.includes('แผลถลอก')) {
    return 'abrasion';
  } else if (predictLabel.includes('แผลน้ำร้อนลวก')) {
    return 'burn';
  } else if (predictLabel.includes('แผลฟกช้ำ')) {
    return 'bruise';
  }

  return 'unknown';
}

// Determine severity based on wound_size and other factors
export function determineSeverity(
  woundType: string,
  woundSize: string | null,
  length: string | null,
  depth: string | null
): string {
  if (woundType === 'cut') {
    // สำหรับแผลฉีกขาด ดูจาก length และ depth
    if (length === 'ยาว' && depth === 'ลึก') {
      return 'large';
    }
    return 'small';
  }

  // สำหรับ wound type อื่นๆ ดูจาก wound_size
  if (woundSize === 'ใหญ่') {
    return 'large';
  } else if (woundSize === 'ปานกลาง') {
    return 'moderate';
  }

  return 'small';
}

// ✅ Calculate risk level [ต่ำ, กลาง, สูง] based on wound characteristics
export function calculateRiskLevel(
  woundType: string,
  woundSize: string | null,
  length: string | null,
  depth: string | null
): 'ต่ำ' | 'กลาง' | 'สูง' {
  // คำนวณคะแนนความเสี่ยง
  let riskScore = 0;

  // ประเมินจาก wound_size
  if (woundSize === 'ใหญ่') {
    riskScore += 3;
  } else if (woundSize === 'ปานกลาง') {
    riskScore += 2;
  } else if (woundSize === 'เล็ก') {
    riskScore += 1;
  }

  // ประเมินจาก length (สำหรับแผลฉีกขาด)
  if (length === 'ยาว') {
    riskScore += 3;
  } else if (length === 'ปานกลาง') {
    riskScore += 2;
  } else if (length === 'สั้น') {
    riskScore += 1;
  }

  // ประเมินจาก depth (สำหรับแผลฉีกขาด)
  if (depth === 'ลึก') {
    riskScore += 3;
  } else if (depth === 'ปานกลาง') {
    riskScore += 2;
  } else if (depth === 'ตื้น') {
    riskScore += 1;
  }

  // ลดคะแนนถ้าค่าเป็น null
  let validCount = 0;
  if (woundSize) validCount++;
  if (length) validCount++;
  if (depth) validCount++;

  // หากมีข้อมูล ให้ประเมินความเสี่ยง
  if (validCount > 0) {
    const avgRiskScore = riskScore / validCount;

    // ✅ กำหนดระดับความเสี่ยง
    if (avgRiskScore >= 2.67) {
      return 'สูง';      // 2.67-3: สูง (ใหญ่ ยาว ลึก)
    } else if (avgRiskScore >= 1.67) {
      return 'กลาง';     // 1.67-2.66: กลาง (ผสม)
    } else {
      return 'ต่ำ';      // < 1.67: ต่ำ (เล็ก สั้น ตื้น)
    }
  }

  return 'กลาง'; // Default
}

// ✅ Get recommended medicines for wound type
export function getRecommendedMedicines(
  woundType: string,
  severity: string
): { medicine_name: string; description: string }[] {
  // Map woundType to medicine rule key
  let medicineKey: 'cut_small' | 'cut_large' | 'abrasion' | 'burn' | 'bruise' = 'cut_small';

  if (woundType === 'cut') {
    medicineKey = severity === 'large' ? 'cut_large' : 'cut_small';
  } else if (woundType === 'abrasion') {
    medicineKey = 'abrasion';
  } else if (woundType === 'burn') {
    medicineKey = 'burn';
  } else if (woundType === 'bruise') {
    medicineKey = 'bruise';
  }

  // Get medicine names from rules
  const medicineNames = medicineRules[medicineKey] || [];

  // Get descriptions for each medicine
  const medicines = medicineNames.map(name => {
    const medicineInfo = medicineDescriptions[name];
    return {
      medicine_name: name,
      description: medicineInfo?.description || 'ไม่มีรายละเอียด'
    };
  });

  return medicines;
}
