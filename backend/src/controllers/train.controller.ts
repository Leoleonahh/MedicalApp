import { Request, Response } from 'express';
import { trainModelService, getAllModels, getLatestModel } from '../services/train.service';

export async function trainModel(req: Request & { user?: any }, res: Response) {
  try {
    // ดึง user_id จาก body หรือ header
    const userId = req.body.user_id || req.headers['x-user-id'] || req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'User ID required. Send user_id in body or x-user-id in header' 
      });
    }

    const userIdNum = parseInt(userId as string);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // เริ่มต้นการเทรน (อาจใช้เวลานาน)
    const result = await trainModelService(userIdNum);

    return res.status(200).json({
      message: 'Model trained and saved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Train model error:', error);

    if (error.message === 'Only admin can train model') {
      return res.status(403).json({ error: 'Only admin can train model' });
    }

    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ error: error.message || 'Training failed' });
  }
}

export async function listModels(req: Request, res: Response) {
  try {
    const models = await getAllModels();

    return res.status(200).json({
      message: 'Models retrieved successfully',
      data: models,
    });
  } catch (error: any) {
    console.error('List models error:', error);
    return res.status(500).json({ error: 'Failed to retrieve models' });
  }
}

export async function getLatestModelInfo(req: Request, res: Response) {
  try {
    const model = await getLatestModel();

    return res.status(200).json({
      message: 'Latest model retrieved successfully',
      data: model,
    });
  } catch (error: any) {
    console.error('Get latest model error:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve model' });
  }
}
