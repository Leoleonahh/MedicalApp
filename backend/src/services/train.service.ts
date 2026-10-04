import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { ModelInfo } from '../entities/ModelInfo';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const userRepository = AppDataSource.getRepository(User);
const modelRepository = AppDataSource.getRepository(ModelInfo);

const PYTHON_SCRIPT_PATH = path.join(__dirname, '../../Ai/Prediction/training/train_model.py');
const MODEL_DIR = path.join(__dirname, '../../Ai/Prediction/model');

export async function trainModelService(userId: number) {
  try {
    // ตรวจสอบว่าผู้ใช้คือ admin หรือไม่
    const admin = await userRepository.findOneBy({ user_id: userId });
    if (!admin) {
      throw new Error('User not found');
    }

    if (admin.role !== 'admin') {
      throw new Error('Only admin can train model');
    }

    // เรียก Python training script
    const trainingResult = await runTrainingScript();

    // สร้าง version
    const version = `v${Date.now()}`;

    // บันทึกลง database
    const modelInfo = modelRepository.create({
      model_name: 'wound_prediction_model',
      version,
      accuracy: trainingResult.accuracy,
      model_path: trainingResult.model_path,
      admin_id: userId,
      action_date: new Date(),
    });

    await modelRepository.save(modelInfo);

    return {
      model_id: modelInfo.model_id,
      model_name: modelInfo.model_name,
      version: modelInfo.version,
      accuracy: modelInfo.accuracy,
      model_path: modelInfo.model_path,
      trained_by: admin.username,
      created_at: modelInfo.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Train model error:', error);
    throw error;
  }
}

function runTrainingScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [PYTHON_SCRIPT_PATH]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data: Buffer) => {
      const message = data.toString();
      console.log('[Training]', message);
      output += message;
    });

    python.stderr.on('data', (data: Buffer) => {
      const message = data.toString();
      console.error('[Training Error]', message);
      errorOutput += message;
    });

    python.on('close', (code: number) => {
      if (code === 0) {
        // อ่าน model file path
        const modelPath = path.join(MODEL_DIR, 'wound_prediction_model.h5');
        
        // ตรวจสอบไฟล์ model มีอยู่หรือไม่
        if (fs.existsSync(modelPath)) {
          resolve({
            accuracy: extractAccuracyFromOutput(output),
            model_path: modelPath,
          });
        } else {
          reject(new Error('Model file not found after training'));
        }
      } else {
        reject(new Error(`Training script failed: ${errorOutput || 'Unknown error'}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to spawn training process: ${error.message}`));
    });

    // Timeout after 30 minutes
    setTimeout(() => {
      python.kill();
      reject(new Error('Training process timeout'));
    }, 30 * 60 * 1000);
  });
}

function extractAccuracyFromOutput(output: string): number {
  // ค้นหา accuracy จาก output (ตัวอย่าง: "✅ Accuracy: 0.9234")
  const accuracyMatch = output.match(/Accuracy:\s*([0-9.]+)/);
  if (accuracyMatch && accuracyMatch[1]) {
    return parseFloat(accuracyMatch[1]);
  }
  return 0;
}

// ดึง model info ทั้งหมด
export async function getAllModels() {
  try {
    const models = await modelRepository.find({
      relations: ['admin'],
      order: { created_at: 'DESC' },
    });

    return models.map(model => ({
      model_id: model.model_id,
      model_name: model.model_name,
      version: model.version,
      accuracy: model.accuracy,
      model_path: model.model_path,
      trained_by: model.admin.username,
      created_at: model.created_at.toISOString(),
      action_date: model.action_date?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Get all models error:', error);
    throw error;
  }
}

// ดึง model info ล่าสุด
export async function getLatestModel() {
  try {
    const model = await modelRepository.findOne({
      relations: ['admin'],
      order: { created_at: 'DESC' },
    });

    if (!model) {
      throw new Error('No model found');
    }

    return {
      model_id: model.model_id,
      model_name: model.model_name,
      version: model.version,
      accuracy: model.accuracy,
      model_path: model.model_path,
      trained_by: model.admin.username,
      created_at: model.created_at.toISOString(),
      action_date: model.action_date?.toISOString() || null,
    };
  } catch (error) {
    console.error('Get latest model error:', error);
    throw error;
  }
}
