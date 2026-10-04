import sgMail from "@sendgrid/mail";

const API_KEY = process.env.SENDGRID_API_KEY;

if (!API_KEY) {
  throw new Error("SENDGRID_API_KEY is not defined");
}

sgMail.setApiKey(API_KEY);

export async function sendOTPEmail(email: string, otp: string) {
  try {
    await sgMail.send({
      to: email,
      from: {
        email: "leoprojecthod@gmail.com", // ❗ ต้องเป็น email ที่ verify ใน SendGrid
        name: "Medical App"
      },
      subject: "Password Reset OTP",
      html: `
        <h3>OTP Verification</h3>
        <h2>${otp}</h2>
        <p>OTP will expire in 5 minutes</p>
      `
    });
  } catch (err: any) {
    console.error("SendGrid error body:", err.response?.body);
    throw err;
  }
}