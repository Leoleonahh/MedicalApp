import { Request, Response } from 'express';
import { predictWoundService, getPredictionsByImage, getAllPredictions } from '../services/predict.service';

export async function predictWound(req: Request, res: Response) {
  try {
    const { image_id } = req.body;

    if (!image_id) {
      return res.status(400).json({ error: 'image_id is required' });
    }

    const result = await predictWoundService(Number(image_id));

    return res.status(200).json({
      message: 'Prediction successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Predict error:', error);

    if (error.message === 'Image not found') {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (error.message === 'No trained model found') {
      return res.status(503).json({ error: 'No trained model available' });
    }

    if (error.message === 'Image file not found on disk') {
      return res.status(404).json({ error: 'Image file not found' });
    }

    return res.status(500).json({ error: error.message || 'Prediction failed' });
  }
}

export async function listPredictionsByImage(req: Request, res: Response) {
  try {
    const { image_id } = req.query;

    if (!image_id) {
      return res.status(400).json({ error: 'image_id is required' });
    }

    const predictions = await getPredictionsByImage(Number(image_id));

    return res.status(200).json({
      message: 'Predictions retrieved successfully',
      data: predictions,
      total: predictions.length,
    });
  } catch (error: any) {
    console.error('List predictions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve predictions' });
  }
}

export async function listAllPredictions(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const predictions = await getAllPredictions(limit);

    return res.status(200).json({
      message: 'All predictions retrieved successfully',
      data: predictions,
      total: predictions.length,
    });
  } catch (error: any) {
    console.error('List all predictions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve predictions' });
  }
}
