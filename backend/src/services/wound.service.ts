import { AppDataSource } from '../config/database';
import { WoundImage } from '../entities/WoundImage';
import { User } from '../entities/User';
import { Prediction } from '../entities/Prediction';
import { Recommendation } from '../entities/Recommendation';
import { predictWoundService } from './predict.service';

const woundRepository = AppDataSource.getRepository(WoundImage);
const userRepository = AppDataSource.getRepository(User);
const predictionRepository = AppDataSource.getRepository(Prediction);
const recommendationRepository = AppDataSource.getRepository(Recommendation);

interface UploadWoundInput {
  user_id: number;
  image_path: string;
  associated_symptom?: string;
  incident_date?: string;
  wound_site?: string;
  latitude?: number;
  longitude?: number;
}

export async function uploadWoundService(data: UploadWoundInput) {
  try {
    // ตรวจสอบว่า user มีอยู่จริง
    const user = await userRepository.findOneBy({ user_id: data.user_id });
    if (!user) {
      throw new Error('User not found');
    }

    // สร้าง wound image record
    const woundImage = woundRepository.create({
      user_id: data.user_id,
      image_path: data.image_path,
      associated_symptom: data.associated_symptom || null,
      incident_date: data.incident_date ? new Date(data.incident_date) : null,
      wound_site: data.wound_site || null,
      latitude: data.latitude ? parseFloat(data.latitude.toString()) : null,
      longitude: data.longitude ? parseFloat(data.longitude.toString()) : null,
    });

    await woundRepository.save(woundImage);

    let prediction = null;

    try {
      prediction = await predictWoundService(woundImage.image_id);
    } catch (predictionError) {
      console.warn('Prediction after upload failed:', predictionError);
    }

    return {
      image_id: woundImage.image_id,
      user_id: woundImage.user_id,
      image_path: woundImage.image_path,
      upload_date: woundImage.upload_date.toISOString(),
      associated_symptom: woundImage.associated_symptom,
      incident_date: woundImage.incident_date
        ? (woundImage.incident_date instanceof Date
          ? woundImage.incident_date.toISOString().split('T')[0]
          : String(woundImage.incident_date).split('T')[0])
        : null,
      wound_site: woundImage.wound_site,
      latitude: woundImage.latitude,
      longitude: woundImage.longitude,
      prediction,
    };
  } catch (error) {
    console.error('Upload wound error:', error);
    throw error;
  }
}

// ดึงข้อมูลบาดแผลของผู้ใช้
export async function getWoundImages(userId: number, limit: number = 50) {
  try {
    const images = await woundRepository.find({
      where: { user_id: userId },
      order: { upload_date: 'DESC' },
      take: limit,
    });

    return images.map(img => ({
      image_id: img.image_id,
      user_id: img.user_id,
      image_path: img.image_path,
      upload_date: img.upload_date.toISOString(),
      associated_symptom: img.associated_symptom,
      incident_date: img.incident_date 
        ? (img.incident_date instanceof Date 
          ? img.incident_date.toISOString().split('T')[0]
          : String(img.incident_date).split('T')[0])
        : null,
      wound_site: img.wound_site,
      latitude: img.latitude,
      longitude: img.longitude,
    }));
  } catch (error) {
    console.error('Get wound images error:', error);
    throw error;
  }
}

// ดึงรูปบาดแผลเฉพาะ
export async function getWoundImageDetail(
  imageId: number,
  userId: number
) {
  try {

    const image = await woundRepository.findOneBy({
      image_id: imageId
    });

    if (!image) {
      throw new Error("Image not found");
    }

    // ==========================================
    // ตรวจสอบว่า Image เป็นของ User คนนี้หรือไม่
    // ==========================================

    if (image.user_id !== userId) {
      throw new Error(
        "Unauthorized - Image does not belong to this user"
      );
    }

    return {
      image_id: image.image_id,
      user_id: image.user_id,
      image_path: image.image_path,
      upload_date: image.upload_date.toISOString(),
      associated_symptom: image.associated_symptom,
      incident_date: image.incident_date
        ? (
            image.incident_date instanceof Date
              ? image.incident_date.toISOString().split("T")[0]
              : String(image.incident_date).split("T")[0]
          )
        : null,
      wound_site: image.wound_site,
      latitude: image.latitude,
      longitude: image.longitude,
    };

  } catch (error) {

    console.error(
      "Get wound image detail error:",
      error
    );

    throw error;
  }
}

// ลบรูปบาดแผล
export async function deleteWoundImage(imageId: number, userId: number) {
  try {
    const image = await woundRepository.findOneBy({ image_id: imageId });
    if (!image) {
      throw new Error('Image not found');
    }

    if (image.user_id !== userId) {
      throw new Error('Unauthorized - Image does not belong to this user');
    }

    await woundRepository.remove(image);

    return { message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Delete wound image error:', error);
    throw error;
  }
}

// ✅ ดึงรายละเอียดบาดแผลพร้อม prediction และ recommendation
export async function getWoundDetailWithAnalysis(
  imageId: number,
  userId: number
) {
  try {

    const image =
      await woundRepository.findOneBy({
        image_id: imageId
      });

    if (!image) {
      throw new Error("Image not found");
    }

    // ==========================================
    // ตรวจสอบเจ้าของบาดแผล
    // ==========================================

    if (image.user_id !== userId) {
      throw new Error(
        "Unauthorized - Image does not belong to this user"
      );
    }

    const woundDetail = {
      image_id: image.image_id,
      user_id: image.user_id,
      image_path: image.image_path,
      upload_date: image.upload_date.toISOString(),

      associated_symptom:
        image.associated_symptom,

      incident_date:
        image.incident_date
          ? (
              image.incident_date instanceof Date
                ? image.incident_date
                    .toISOString()
                    .split("T")[0]
                : String(image.incident_date)
                    .split("T")[0]
            )
          : null,

      wound_site:
        image.wound_site,

      latitude:
        image.latitude,

      longitude:
        image.longitude,
    };


    // ==========================================
    // ดึง Prediction ล่าสุด
    // ==========================================

    const [latestPrediction] =
      await predictionRepository.find({

        where: {
          image_id: imageId
        },

        relations: ["model"],

        order: {
          predict_date: "DESC"
        },

        take: 1,

      });


    let prediction = null;
    let recommendation = null;


    // ==========================================
    // Prediction
    // ==========================================

    if (latestPrediction) {

      prediction = {

        prediction_id:
          latestPrediction.prediction_id,

        model_id:
          latestPrediction.model_id,

        model_name:
          latestPrediction.model.model_name,

        model_version:
          latestPrediction.model.version,

        confidence:
          latestPrediction.confidence,

        predict_label:
          latestPrediction.predict_label,

        wound_size:
          latestPrediction.wound_size,

        length:
          latestPrediction.length,

        depth:
          latestPrediction.depth,

        predict_date:
          latestPrediction.predict_date.toISOString(),

      };


      // ==========================================
      // Recommendation
      // ==========================================

      const rec =
        await recommendationRepository.findOne({

          where: {
            prediction_id:
              latestPrediction.prediction_id
          }

        });


      if (rec) {

        recommendation = {

          recommend_id:
            rec.recommend_id,

          risk:
            rec.risk,

          recommend_text:
            rec.recommend_text,

          pro_reccom:
            rec.pro_reccom,

          warning_note:
            rec.warning_note,

          created_at:
            rec.created_at.toISOString(),

        };

      }

    }


    return {

      wound: woundDetail,

      prediction: prediction,

      recommendation: recommendation,

    };

  } catch (error) {

    console.error(
      "Get wound detail with analysis error:",
      error
    );

    throw error;
  }
}

// ✅ ดึงประวัติบาดแผลทั้งหมดของผู้ใช้พร้อมสถานะ prediction ล่าสุด
export async function getWoundHistoryWithStatus(userId: number, limit: number = 50) {
  try {
    const images = await woundRepository.find({
      where: { user_id: userId },
      order: { upload_date: 'DESC' },
      take: limit,
    });

    const woundHistory = await Promise.all(
      images.map(async (img) => {
        // ดึง prediction ล่าสุด
        const [latestPrediction] = await predictionRepository.find({
          where: { image_id: img.image_id },
          order: { predict_date: 'DESC' },
          take: 1,
        });

        return {
          image_id: img.image_id,
          image_path: img.image_path,
          upload_date: img.upload_date.toISOString(),
          wound_site: img.wound_site,
          has_prediction: !!latestPrediction,
          latest_prediction: latestPrediction ? {
            prediction_id: latestPrediction.prediction_id,
            predict_label: latestPrediction.predict_label,
            confidence: latestPrediction.confidence,
            predict_date: latestPrediction.predict_date.toISOString(),
          } : null,
        };
      })
    );

    return woundHistory;
  } catch (error) {
    console.error('Get wound history with status error:', error);
    throw error;
  }
}