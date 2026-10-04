import { Request, Response } from "express";
import { medicineDescriptions } from "../data/medicineDescriptions";
import { medicineRules } from "../data/medicineRules";

// ✅ Get all medicines with descriptions
export const getAllMedicines = async (req: Request, res: Response) => {
  try {
    const allMedicines = Object.entries(medicineDescriptions).map(([key, value]) => ({
      medicine_name: value.name,
      description: value.description
    }));

    return res.status(200).json({
      message: "All medicines retrieved successfully",
      total: allMedicines.length,
      data: allMedicines
    });
  } catch (error: any) {
    console.error('Get all medicines error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get medicines' });
  }
};

// ✅ Get medicine description by name
export const getMedicineDescription = async (req: Request, res: Response) => {
  try {
    const { medicine_name } = req.params;

    if (!medicine_name) {
      return res.status(400).json({ error: "medicine_name is required" });
    }

    const medicineInfo = medicineDescriptions[medicine_name];

    if (!medicineInfo) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    return res.status(200).json({
      message: "Medicine description retrieved successfully",
      data: medicineInfo
    });
  } catch (error: any) {
    console.error('Get medicine description error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get medicine description' });
  }
};

// ✅ Get medicines recommended for specific wound type
export const getMedicinesForWoundType = async (req: Request, res: Response) => {
  try {
    const { wound_type } = req.params; // 'cut_small', 'cut_large', 'abrasion', 'burn', 'bruise'

    if (!wound_type) {
      return res.status(400).json({ error: "wound_type is required" });
    }

    const medicineNames = medicineRules[wound_type as keyof typeof medicineRules];

    if (!medicineNames) {
      return res.status(404).json({ error: "Wound type not found" });
    }

    const medicines = medicineNames.map(name => ({
      medicine_name: name,
      description: medicineDescriptions[name]?.description || 'ไม่มีรายละเอียด'
    }));

    return res.status(200).json({
      message: `Medicines for ${wound_type} retrieved successfully`,
      wound_type,
      total: medicines.length,
      data: medicines
    });
  } catch (error: any) {
    console.error('Get medicines for wound type error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get medicines' });
  }
};
