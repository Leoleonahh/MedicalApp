import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { AppDataSource } from './config/database';
import { config } from './config/config';
import authRouter from './routes/auth.routes';
import predictRouter from './routes/predict.routes';
import trainRouter from './routes/train.routes';
import woundRoutes from "./routes/wound.routes";
import hotlineRoutes from "./routes/hotline.route";
import firstAidRoutes from "./routes/firstAid.route";
import medicineRoutes from "./routes/medicine.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import pharmacyRoutes from "./routes/pharmacy.routes";
import adminPharmacyRoutes from "./routes/admin.pharmacy.routes";
import pharmacyProductRoutes from "./routes/pharmacyProduct.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import path from "path";
import paymentRoutes from "./routes/payment.routes";
import pharmacyOrderRoutes from "./routes/pharmacyOrder.routes";
import adminStatsRoutes from "./routes/admin.stats.routes";

const app: Express = express();

//CORS
app.use(cors());

// Middleware - ต้องอยู่ก่อน routes!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer สำหรับอัพโหลดไฟล์รูปภาพ
const upload = multer({ storage: multer.memoryStorage() });

// ===========================
// Routes
// ===========================

//ร้านค้าและคำสั่งซื้อที่รอการชำระเงิน
app.use(
    "/pharmacy",
    pharmacyOrderRoutes
);

//อัพโหลด slip การชำระเงิน
app.use("/", paymentRoutes);
app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "assets", "uploads")
  )
);

app.use(
  "/licenses",
  express.static(
    path.join(process.cwd(), "assets", "license")
  )
);

app.use(
  "/wounds",
  express.static(
    path.join(process.cwd(), "assets", "wounds")
  )
);

// Order routes
app.use("/orders", orderRoutes);

//หน้าตะกร้าสินค้า
app.use("/cart", cartRoutes);

//Admin อนุมัติร้านขายยา
app.use("/admin", adminPharmacyRoutes);
app.use("/admin", adminStatsRoutes);

// ร้านขายยาและสินค้า
app.use("/pharmacies", pharmacyRoutes);
app.use("/pharmacies", pharmacyProductRoutes);

//hotlines เบอร์โทรฉุกเฉิน
app.use("/api/hotlines", hotlineRoutes);

// First aid recommendations
app.use("/api/first-aid", firstAidRoutes);

// Medicine descriptions and recommendations
app.use("/api/medicines", medicineRoutes);

// Get saved recommendations
app.use("/api/recommendations", recommendationRoutes);

// upload wound
app.use("/api/wound", woundRoutes);

app.use('/api/auth', authRouter);

// Multer middleware สำหรับ predict route
const uploadMiddleware = upload.single('image');
app.use('/api/predict', uploadMiddleware, predictRouter);

// Training route
app.use('/api/train', trainRouter);

// ===========================
// Health Check
// ===========================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// ===========================
// Error Handling
// ===========================
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===========================
// Start Server
// ===========================
async function startServer() {
  try {
    // เชื่อมต่อ database
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // เริ่ม server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
