import { Router } from 'express';
import { trainModel, listModels, getLatestModelInfo } from '../controllers/train.controller';

const trainRouter = Router();

// POST /api/train - เทรน model (ต้อง admin)
trainRouter.post('/', trainModel);

// GET /api/train - ดึง model info ทั้งหมด
trainRouter.get('/', listModels);

// GET /api/train/latest - ดึง model info ล่าสุด
trainRouter.get('/latest', getLatestModelInfo);

export default trainRouter;
