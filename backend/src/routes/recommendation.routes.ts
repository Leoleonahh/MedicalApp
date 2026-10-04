import { Router } from 'express';
import { getRecommendation } from '../controllers/recommendation.controller';

const router = Router();

// ✅ GET /api/recommendations/:prediction_id - ดึง recommendation ตาม prediction_id
router.get('/:prediction_id', getRecommendation);

export default router;
