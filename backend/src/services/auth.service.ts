import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { PasswordResetOTP } from '../entities/PasswordResetOTP';
import * as bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { generateOTP, hashOTP } from '../utils/otp.util';
import { sendOTPEmail } from '../utils/email';
import { generateToken } from "../utils/jwt";
import { verifyToken } from "../utils/jwt";

const userRepository = AppDataSource.getRepository(User);
const otpRepository = AppDataSource.getRepository(PasswordResetOTP);

export async function registerUser(username: string, password: string) {
  try {
    // ตรวจสอบ username ซ้ำ
    const existingUser = await userRepository.findOneBy({ username });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง user ใหม่
    const user = userRepository.create({
      username,
      password: hashedPassword,
      role: 'user',
    });

    await userRepository.save(user);

    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      created_at: user.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Register user error:', error);
    throw error;
  }
}

export async function authenticateUser(
    username: string,
    password: string
) {
    try {

        const user =
            await userRepository.findOneBy({
                username
            });

        if (!user) {
            return null;
        }

        // ตรวจสอบ Password
        const isPasswordValid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordValid) {
            return null;
        }

        // อัปเดต last login
        user.last_login = new Date();

        await userRepository.save(user);

        // =====================================
        // สร้าง JWT
        // =====================================

        const token = generateToken({

            user_id:
                user.user_id,

            username:
                user.username,

            role:
                user.role,

        });

        return {

            user,

            token,

        };

    } catch (error) {

        console.error(
            "Authenticate user error:",
            error
        );

        return null;
    }
}

export async function updateUserProfile(
  userId: number,
  birthday?: string,
  email?: string,
  address?: string
) {
  try {
    const user = await userRepository.findOneBy({ user_id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields if provided
    if (birthday) user.birthday = new Date(birthday);
    if (email) user.email = email;
    if (address) user.address = address;

    // Save updated user
    await userRepository.save(user);

    return {
      user_id: user.user_id,
      username: user.username,
      birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
      email: user.email,
      address: user.address,
      role: user.role,
    };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// Auth Middleware
export async function authMiddleware(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
) {

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                error: "No token provided",
            });

        }

        const token =
            authHeader.split(" ")[1];

        const payload =
            verifyToken(token) as {
                user_id: number;
                username: string;
                role: string;
                pharmacy_id?: number | null;
            };

        // หา User จาก Database
        const user =
            await userRepository.findOneBy({
                user_id: payload.user_id,
            });

        if (!user) {

            return res.status(401).json({
                error: "User not found",
            });

        }

        // ใส่ข้อมูลจาก JWT + User
        req.user = {

            ...user,

            pharmacy_id:
                payload.pharmacy_id ?? null,

        };

        next();

    } catch (error) {

        console.error(
            "Auth middleware error:",
            error
        );

        return res.status(401).json({
            error: "Invalid or expired token",
        });

    }
}

/* =========================
   1️⃣ Generate OTP
   ========================= */
export async function generatePasswordOTP(username: string, email: string) {
  try {
    // Find user
    const user = await userRepository.findOneBy({ username });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify email matches
    if (user.email !== email) {
      throw new Error('Email does not match');
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Create OTP record with 15 minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const otpRecord = otpRepository.create({
      user_id: user.user_id,
      otp_code: otpHash,
      expires_at: expiresAt,
      is_used: 0,
    });

    await otpRepository.save(otpRecord);

    // Send OTP email
    await sendOTPEmail(email, otp);

    return true;
  } catch (error) {
    console.error('Generate OTP error:', error);
    throw error;
  }
}

/* =========================
   2️⃣ Verify OTP
   ========================= */
export async function verifyOTP(username: string, otp: string) {
  try {
    const otpHash = hashOTP(otp);

    // Find valid OTP
    const otpRecord = await AppDataSource.createQueryBuilder(PasswordResetOTP, 'o')
      .innerJoin(User, 'u', 'o.user_id = u.user_id')
      .where('u.username = :username', { username })
      .andWhere('o.otp_code = :otp_code', { otp_code: otpHash })
      .andWhere('o.is_used = 0')
      .andWhere('o.expires_at > NOW()')
      .getOne();

    console.log("VERIFY OTP DEBUG");
    console.log("Input username:", username);
    console.log("Input OTP:", otp); 
    
    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    return true;
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
}

 /* =========================
   3️⃣ Reset Password
   ========================= */
export async function resetPassword(
  username: string,
  otp: string,
  newPassword: string,
  confirmPassword: string
) {
  try {

    // ✅ ตรวจสอบ password ใหม่กับ confirm password
    if (newPassword !== confirmPassword) {
      throw new Error('New password and confirm password do not match');
    }


    // ✅ Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      throw new Error(
        'New password must contain uppercase, lowercase, number and be at least 8 characters long'
      );
    }


    const otpHash = hashOTP(otp);


    // Find valid OTP
    const otpRecord = await AppDataSource
      .createQueryBuilder(PasswordResetOTP, 'o')
      .innerJoin(User, 'u', 'o.user_id = u.user_id')
      .where('u.username = :username', { username })
      .andWhere('o.otp_code = :otp_code', { otp_code: otpHash })
      .andWhere('o.is_used = 0')
      .andWhere('o.expires_at > NOW()')
      .getOne();


    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }


    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);


    // Update user password
    await userRepository.update(
      {
        user_id: otpRecord.user_id
      },
      {
        password: hashedPassword
      }
    );


    // Mark OTP as used
    await otpRepository.update(
      {
        otp_id: otpRecord.otp_id
      },
      {
        is_used: 1
      }
    );


    return true;


  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}
/*--------------------------------------------------------------------------------*/