import { Request, Response } from "express";
import { MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../config/database";
import { ModelInfo } from "../entities/ModelInfo";
import { Pharmacy } from "../entities/Pharmacy";
import { Prediction } from "../entities/Prediction";
import { User } from "../entities/User";

export const getAdminStats = async (
  req: Request & { user?: any },
  res: Response
) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const modelRepository = AppDataSource.getRepository(ModelInfo);
    const pharmacyRepository = AppDataSource.getRepository(Pharmacy);
    const predictionRepository = AppDataSource.getRepository(Prediction);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalUsers, activeToday, activeModels, pendingPharmacies, usageByMonth] =
      await Promise.all([
        userRepository.count(),
        userRepository.count({
          where: { last_login: MoreThanOrEqual(startOfToday) },
        }),
        modelRepository.count(),
        pharmacyRepository.count({ where: { status: "notverify" } }),
        predictionRepository
          .createQueryBuilder("prediction")
          .select("DATE_FORMAT(prediction.predict_date, '%Y-%m')", "month")
          .addSelect("COUNT(*)", "count")
          .where("prediction.predict_date >= DATE_SUB(CURDATE(), INTERVAL 7 MONTH)")
          .groupBy("month")
          .orderBy("month", "ASC")
          .getRawMany(),
      ]);

    return res.json({
      success: true,
      data: {
        total_users: totalUsers,
        active_today: activeToday,
        active_models: activeModels,
        pending_pharmacies: pendingPharmacies,
        usage_by_month: usageByMonth.map((item) => ({
          month: item.month,
          count: Number(item.count),
        })),
        system_status: {
          api_server: "Healthy",
          database: AppDataSource.isInitialized ? "Connected" : "Disconnected",
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve admin statistics",
    });
  }
};