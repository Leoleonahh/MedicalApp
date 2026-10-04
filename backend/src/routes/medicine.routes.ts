import { Router } from 'express';
import {
  getAllMedicines,
  getMedicineDescription,
  getMedicinesForWoundType
} from '../controllers/medicine.controller';

const router = Router();

// ✅ ต้องเข้าข้างล่างก่อน เพื่อไม่ให้ชนกับ :medicine_name
// GET /api/medicines/wound-type/:wound_type - ดึงยาที่แนะนำสำหรับประเภทแผล
router.get('/wound-type/:wound_type', getMedicinesForWoundType);

// ✅ GET /api/medicines - ดึงรายการยาทั้งหมดพร้อมคำอธิบาย
router.get('/', getAllMedicines);

// ✅ GET /api/medicines/:medicine_name - ดึงคำอธิบายของยาตามชื่อ
router.get('/:medicine_name', getMedicineDescription);

export default router;
