import { AppDataSource } from '../config/database';
import { WoundImage } from '../entities/WoundImage';
import { ModelInfo } from '../entities/ModelInfo';
import { Prediction } from '../entities/Prediction';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { saveRecommendation } from './recommendation.service';
import { firstAidRules } from '../data/firstAidRules';
import { mapPredictLabelToWoundType, determineSeverity, calculateRiskLevel, getRecommendedMedicines } from './firstAid.service';

const woundRepository = AppDataSource.getRepository(WoundImage);
const modelRepository = AppDataSource.getRepository(ModelInfo);
const predictionRepository = AppDataSource.getRepository(Prediction);

const PYTHON_SCRIPT_PATH = path.join(__dirname, '../../Ai/Prediction/predict_service.py');
const PYTHON_EXE_PATH = fs.existsSync(path.join(__dirname, '../../.venv/Scripts/python.exe'))
  ? path.join(__dirname, '../../.venv/Scripts/python.exe')
  : 'python';

export async function predictWoundService(imageId: number) {
  try {
    // ตรวจสอบและดึงข้อมูล wound image
    const woundImage = await woundRepository.findOneBy({ image_id: imageId });
    if (!woundImage) {
      throw new Error('Image not found');
    }

    // ดึง latest model
    const [latestModel] = await modelRepository.find({
      order: { created_at: 'DESC' },
      take: 1,
    });
    if (!latestModel) {
      throw new Error('No trained model found');
    }

    // อ่านรูปภาพจากดิสก์
    const imagePath = path.join(__dirname, '../../assets/wounds', woundImage.image_path);
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found on disk');
    }

    // เรียก Python script สำหรับทำนาย
    const predictionResult = await runPredictionScript(imagePath);

    // Validate prediction result
    const confidence = predictionResult.confidence_percent ? parseFloat(String(predictionResult.confidence_percent)) : 0;
    const predictLabel = predictionResult.predicted_class || null;
    const woundSize = predictionResult.assessment?.wound_size || null;
    
    // ดึง length และ depth เฉพาะเมื่อเป็น "แผลฉีกขาด"
    let length = null;
    let depth = null;
    if (predictLabel && predictLabel.includes('แผลฉีกขาด')) {
      length = predictionResult.assessment?.length || null;
      depth = predictionResult.assessment?.depth || null;
    }
    
    if (isNaN(confidence)) {
      throw new Error('Invalid confidence value from prediction');
    }

    // บันทึกผลลัพธ์ลง database
    const prediction = predictionRepository.create({
      image_id: imageId,
      model_id: latestModel.model_id,
      confidence: confidence,
      predict_label: predictLabel,
      wound_size: woundSize,
      length: length,
      depth: depth,
    });

    await predictionRepository.save(prediction);

    // ✅ สร้าง recommendation หลัง predict สำเร็จ
    try {
      const woundType = mapPredictLabelToWoundType(predictLabel);
      if (woundType === 'none') {
        return {
          prediction_id: prediction.prediction_id,
          image_id: prediction.image_id,
          model_id: prediction.model_id,
          model_name: latestModel.model_name,
          model_version: latestModel.version,
          confidence: prediction.confidence,
          predict_label: prediction.predict_label,
          wound_size: prediction.wound_size,
          length: prediction.length,
          depth: prediction.depth,
          predict_date: prediction.predict_date.toISOString(),
          image_path: woundImage.image_path,
        };
      }

      const severity = determineSeverity(woundType, woundSize, length, depth);
      const riskLevel = calculateRiskLevel(woundType, woundSize, length, depth);
      const recommendedMedicines = getRecommendedMedicines(woundType, severity);

      // หา first aid rules
      let key: 'cut_small' | 'cut_large' | 'abrasion' | 'burn' | 'bruise' = 'cut_small';
      if (woundType === 'cut') {
        key = severity === 'large' ? 'cut_large' : 'cut_small';
      } else if (woundType === 'abrasion') {
        key = 'abrasion';
      } else if (woundType === 'burn') {
        key = 'burn';
      } else if (woundType === 'bruise') {
        key = 'bruise';
      }

      const result = firstAidRules[key];
      if (result) {
        const recommendText = result.steps.join('\n');
        const proReccom = recommendedMedicines.map(m => m.medicine_name).join(', ');

        await saveRecommendation(
          prediction.prediction_id,
          recommendText,
          riskLevel,
          proReccom
        );
      }
    } catch (recError) {
      // ไม่ยุติการ predict แม้ว่า recommendation จะล้มเหลว
      console.warn('Recommendation save failed, but prediction was saved:', recError);
    }

    return {
      prediction_id: prediction.prediction_id,
      image_id: prediction.image_id,
      model_id: prediction.model_id,
      model_name: latestModel.model_name,
      model_version: latestModel.version,
      confidence: prediction.confidence,
      predict_label: prediction.predict_label,
      wound_size: prediction.wound_size,
      length: prediction.length,
      depth: prediction.depth,
      predict_date: prediction.predict_date.toISOString(),
      image_path: woundImage.image_path,
    };
  } catch (error) {
    console.error('Predict wound service error:', error);
    throw error;
  }
}

function runPredictionScript(imagePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_EXE_PATH, [PYTHON_SCRIPT_PATH, imagePath]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    python.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    python.on('close', (code: number) => {
      if (code === 0 && output) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (error) {
          reject(new Error(`Invalid Python output: ${output}`));
        }
      } else {
        reject(new Error(`Python script failed: ${errorOutput || 'Unknown error'}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      python.kill();
      reject(new Error('Prediction process timeout'));
    }, 2 * 60 * 1000);
  });
}

// ดึงประวัติการทำนายทั้งหมดของรูป
export async function getPredictionsByImage(imageId: number) {
  try {
    const predictions = await predictionRepository.find({
      where: { image_id: imageId },
      relations: ['model'],
      order: { predict_date: 'DESC' },
    });

    return predictions.map(p => ({
      prediction_id: p.prediction_id,
      image_id: p.image_id,
      model_id: p.model_id,
      model_name: p.model.model_name,
      model_version: p.model.version,
      confidence: p.confidence,
      predict_label: p.predict_label,
      wound_size: p.wound_size,
      length: p.length,
      depth: p.depth,
      predict_date: p.predict_date.toISOString(),
    }));
  } catch (error) {
    console.error('Get predictions error:', error);
    throw error;
  }
}

// ดึงประวัติการทำนายทั้งหมด
export async function getAllPredictions(limit: number = 100) {
  try {
    const predictions = await predictionRepository.find({
      relations: ['model', 'image'],
      order: { predict_date: 'DESC' },
      take: limit,
    });

    return predictions.map(p => ({
      prediction_id: p.prediction_id,
      image_id: p.image_id,
      image_path: p.image.image_path,
      model_id: p.model_id,
      model_name: p.model.model_name,
      model_version: p.model.version,
      confidence: p.confidence,
      predict_label: p.predict_label,
      wound_size: p.wound_size,
      length: p.length,
      depth: p.depth,
      predict_date: p.predict_date.toISOString(),
    }));
  } catch (error) {
    console.error('Get all predictions error:', error);
    throw error;
  }
}
