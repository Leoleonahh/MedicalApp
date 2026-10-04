import QRCode from "qrcode";
import generatePayload from "promptpay-qr";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import Tesseract from "tesseract.js";
import path from "path";

const orderRepository = AppDataSource.getRepository(Order);

// ===============================
// Generate PromptPay QR
// ===============================
export const generatePromptPayQR = async (
  promptpay: string,
  amount: number
) => {

  const payload = generatePayload(promptpay, {
    amount,
  });

  return await QRCode.toDataURL(payload);

};

// ===============================
// Get QR ของ Order
// ===============================
export const getOrderPromptPayQR = async (
  orderId: number
) => {

  const order = await orderRepository.findOne({
    where: {
      order_id: orderId,
    },
    relations: [
      "pharmacy",
    ],
  });

  if (!order)
    throw new Error("Order not found");

  if (order.payment_method !== "PROMPTPAY")
    throw new Error("This order is not PromptPay");

  if (!order.pharmacy.promptpay_number)
    throw new Error("PromptPay number not found");

  return await generatePromptPayQR(
    order.pharmacy.promptpay_number,
    Number(order.grand_total)
  );

};

// ===============================
// Upload Slip
// ===============================
// ===============================
// Upload Slip
// ===============================
export const uploadPaymentSlip = async (
  orderId: number,
  filename: string
) => {

  const order = await orderRepository.findOne({
    where: {
      order_id: orderId,
    },
  });

  if (!order)
    throw new Error("Order not found");

  if (order.payment_method !== "PROMPTPAY")
    throw new Error("This order is not PromptPay");

  // บันทึกชื่อไฟล์
  order.payment_slip = filename;

  // อ่าน OCR
  const text = await readSlipOCR(filename);

  // Extract ข้อมูลจาก OCR
  const slip = extractSlipData(text);

  // เปรียบเทียบยอดเงิน
  const match =
    slip.amount === Number(order.grand_total);

  console.log("========== OCR RESULT ==========");
  console.log(text);

  console.log("========== EXTRACT ==========");
  console.log(slip);

  console.log("========== MATCH ==========");
  console.log(match);

  console.log("==============================");

  // ถ้าคุณเพิ่ม Field ใน orders แล้ว
  // สามารถ Uncomment ได้เลย
  /*
  order.ocr_amount = slip.amount;
  order.ocr_datetime = slip.datetime;
  order.ocr_reference = slip.reference;
  order.ocr_match = match;
  */

// บันทึกผล OCR
    order.ocr_amount = slip.amount ?? null;
    order.ocr_datetime = slip.datetime ?? null;
    order.ocr_reference = slip.reference ?? null;
    order.ocr_match = match;

// เปลี่ยนสถานะเป็นรอตรวจสอบ
    order.payment_status = "PENDING_VERIFY";

    await orderRepository.save(order);

    return {
        order,
        text,
        slip,
        match,
    };

};

// ===============================
// OCR
// ===============================
export const readSlipOCR = async (
  filename: string
) => {

  const imagePath = path.join(
    process.cwd(),
    "assets",
    "uploads",
    "slips",
    filename
  );

  const result = await Tesseract.recognize(
    imagePath,
    "tha+eng"
  );

  return result.data.text;

};

// ===============================
// Extract Slip Data
// ===============================
const extractSlipData = (
  text: string
) => {

  // จำนวนเงิน
  const amountMatch = text.match(/(\d+\.\d{2})\s*บาท/);

  // วันที่และเวลา
  const dateMatch = text.match(
    /(\d{1,2}\s+\S+\s+\d{2}\s+\d{2}:\d{2})/
  );

  // Reference
  const refMatch = text.match(
    /([A-Z0-9]{15,})/
  );

  return {

    amount: amountMatch
      ? Number(amountMatch[1])
      : null,

    datetime: dateMatch
      ? dateMatch[1]
      : null,

    reference: refMatch
      ? refMatch[1]
      : null,

  };

};

//ร้านค้ายืนยันการชำระเงิน
export const confirmPayment = async (
    orderId: number,
    verifiedBy: number
) => {

    const order = await orderRepository.findOne({

        where: {
            order_id: orderId,
        },

    });

    if (!order)
        throw new Error("Order not found");

    if (order.payment_status !== "PENDING_VERIFY")
        throw new Error("Order is not waiting for verification");

    order.payment_status = "PAID";

    order.verified_at = new Date();

    order.verified_by = verifiedBy;

    await orderRepository.save(order);

    return order;

};

// ===============================
// Reject Payment
// ===============================
export const rejectPayment = async (
    orderId: number,
    verifiedBy: number,
    reason: string
) => {

    const order = await orderRepository.findOne({
        where: {
            order_id: orderId,
        },
    });

    if (!order)
        throw new Error("Order not found");

    if (order.payment_status !== "PENDING_VERIFY")
        throw new Error("Order is not waiting for verification");

    order.payment_status = "UNPAID";

    order.reject_reason = reason;

    order.verified_by = verifiedBy;

    order.verified_at = new Date();


    await orderRepository.save(order);

    return order;

};