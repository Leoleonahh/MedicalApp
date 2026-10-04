import { Router, Request, Response } from 'express';
import { predictWound, listPredictionsByImage, listAllPredictions } from '../controllers/predict.controller';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import multer from 'multer';

const predictRouter = Router();

// For legacy upload-based prediction (still supports old method)
const upload = multer({ storage: multer.memoryStorage() });

function predictWoundLegacy(imageBuffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    // สร้าง temp file สำหรับ image
    const tempImagePath = path.join(__dirname, '../../temp_image.jpg');
    fs.writeFileSync(tempImagePath, imageBuffer);

    // เรียก Python script จาก Ai folder
    const pythonScriptPath = path.join(__dirname, '../../Ai/Prediction/predict_service.py');
    const python = spawn('python', [pythonScriptPath, tempImagePath]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    python.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    python.on('close', (code: number) => {
      // ลบ temp file
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }

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
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

// POST /api/predict - Predict by image_id (NEW)
predictRouter.post('/', predictWound);

// GET /api/predict?image_id=X - List predictions for specific image
predictRouter.get('/', listPredictionsByImage);

// GET /api/predict/all - List all predictions
predictRouter.get('/all', listAllPredictions);

// POST /api/predict/upload - Legacy upload-based prediction (for backward compatibility)
predictRouter.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log('Processing image for prediction...');
    const result = await predictWoundLegacy(req.file.buffer);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Predict error:', error);
    return res.status(500).json({ error: error.message || 'Prediction failed' });
  }
});

export default predictRouter;
