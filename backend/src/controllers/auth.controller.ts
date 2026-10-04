import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import * as bcrypt from 'bcrypt';
import { registerUser, authenticateUser, updateUserProfile } from '../services/auth.service';
import {
  generatePasswordOTP,
  verifyOTP,
  resetPassword
} from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // 1️⃣ ตรวจสอบ input
    if (!username || !password) {
      return res.status(400).json({
        error: 'username and password required',
      });
    }

    // 2️⃣ Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          'password ต้องมีตัวอักษรพิมพ์ใหญ่, ตัวอักษรพิมพ์เล็ก, ตัวเลข และมีความยาวอย่างน้อย 8 ตัวอักษร',
      });
    }

    // 3️⃣ Register user
    const result = await registerUser(username, password);

    return res.status(201).json({
      message: 'Register success',
      user: result,
    });
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: error.message });
    }

    console.error('Register error:', error);
    return res.status(500).json({ error: 'Register failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // ตรวจสอบ input
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const result = await authenticateUser(username, password);

    if (!result) {
      return res.status(401).json({
        error: 'username หรือ password ไม่ถูกต้อง',
      });
    }

    return res.status(200).json({

      success: true,
      
      message: 'Login success',

      token: result.token,

      user: {

        user_id: result.user.user_id,

        username: result.user.username,

        birthday: result.user.birthday,

        email: result.user.email,

        address: result.user.address,

        role: result.user.role,

        last_login: result.user.last_login,

        created_at: result.user.created_at,

      },

    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function getProfile(req: Request & { user?: any }, res: Response) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    user: {
      user_id: user.user_id,
      username: user.username,
      birthday: user.birthday
        ? new Date(user.birthday).toISOString().split('T')[0]
        : null,
      email: user.email,
      address: user.address,
      role: user.role,
      last_login: user.last_login,
      created_at: user.created_at,
    },
  });
}

export async function updateProfile(req: Request & { user?: any }, res: Response) {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { birthday, email, address } = req.body;

    // Check if at least one field is provided
    if (!birthday && !email && !address) {
      return res.status(400).json({
        error: 'At least one field (birthday, email, or address) is required',
      });
    }

    const result = await updateUserProfile(userId, birthday, email, address);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: result,
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Update profile failed' });
  }
}

/*--------------------------------------------------------------------------------*/
export async function requestOTP(req: Request, res: Response) {
  try {
    const { username, email } = req.body;
    await generatePasswordOTP(username, email);
    res.json({ message: "OTP sent to email" });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}

export async function verifyOTPController(req: Request, res: Response) {
  try {
    const { username, otp } = req.body;
    await verifyOTP(username, otp);
    res.json({ message: "OTP verified" });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}

export const resetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {

    const {
      username,
      otp,
      newPassword,
      confirmPassword
    } = req.body;


    // ✅ Validate input
    if (!username || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "username, otp, newPassword and confirmPassword are required"
      });
    }


    await resetPassword(
      username,
      otp,
      newPassword,
      confirmPassword
    );


    return res.status(200).json({
      message: "Password reset successfully"
    });


  } catch (error: any) {

    console.error("Reset password controller error:", error);

    return res.status(400).json({
      error: error.message
    });

  }
};
/*--------------------------------------------------------------------------------*/

export const changePassword = async (req: Request & { user?: any }, res: Response) => {
  try {
    // ดึง user_id จาก middleware
    const userId = req.user?.user_id || req.body.user_id;

    const { oldPassword, newPassword, confirmPassword } = req.body;

    // ✅ ตรวจสอบ input
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - user_id required' });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: 'oldPassword, newPassword and confirmPassword are required',
      });
    }

    // ✅ ตรวจสอบว่า password ใหม่ตรงกับ confirm password หรือไม่
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New password and confirm password do not match',
      });
    }

    // ✅ Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          'New password must contain uppercase, lowercase, number and be at least 8 characters long',
      });
    }

    // ✅ ตรวจสอบว่า password ใหม่ไม่เหมือน password เก่า
    if (oldPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from old password',
      });
    }

    const userRepo = AppDataSource.getRepository(User);

    // 1️⃣ หา user
    const user = await userRepo.findOneBy({ user_id: userId });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // 2️⃣ ตรวจสอบรหัสผ่านเก่า
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Old password is incorrect',
      });
    }

    // 3️⃣ hash password ใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ update password
    user.password = hashedPassword;

    await userRepo.save(user);

    return res.status(200).json({
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('Change password error:', error);

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
};