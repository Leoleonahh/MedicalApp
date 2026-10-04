import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/auth.controller';
import { authMiddleware } from '../services/auth.service';
import {
  requestOTP,
  verifyOTPController,
  resetPasswordController
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/profile', authMiddleware, getProfile);
authRouter.put('/profile', authMiddleware, updateProfile);
authRouter.post("/forgot-password", requestOTP);
authRouter.post("/verify-otp", verifyOTPController);
authRouter.post("/reset-password", resetPasswordController);
authRouter.post("/change-password", authMiddleware, changePassword);

export default authRouter;
