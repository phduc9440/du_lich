import { Request, Response } from 'express';
import { Op } from 'sequelize';
import paymentService from '../services/paymentService';
import tourGuideAssignmentService from '../services/tourGuideAssignmentService';
import Order from '../models/Order';
import { sendSuccess, sendError } from '../utils/responseHandler';

// ============================================================
// Helper: extract orderId từ txnRef format ORDER_{id}_{timestamp}
// ============================================================
const extractOrderId = (txnRef: string | undefined): number | null => {
  if (!txnRef) return null;
  const parts = String(txnRef).split('_');
  // format: ORDER_<id>_<timestamp>
  return parts.length >= 2 ? Number(parts[1]) : null;
};

// ============================================================
// Helper: cập nhật status nếu chưa paid
// ============================================================
const updatePaymentIfNotPaid = async (orderId: number, txnRef: string) => {
  const order = await Order.findByPk(orderId);
  if (order && !order.is_paid) {
    await paymentService.updateOrderPaymentStatus(orderId, true, txnRef);
  }
};

// ============================================================
// VNPay Return URL (GET) — người dùng được redirect về sau khi TT
// ============================================================
export const handleVNPayReturn = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string>;

    // Xác minh chữ ký
    const isValid = paymentService.verifySignature(query);
    if (!isValid) {
      console.warn('⚠️ [PaymentController] Chữ ký VNPay return không hợp lệ');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/payment/result?status=error`);
    }

    const vnpResponseCode = query['vnp_ResponseCode'];
    const txnRef          = query['vnp_TxnRef'];      // ORDER_{id}_{timestamp}

    const orderId = extractOrderId(txnRef);
    const isSuccess = vnpResponseCode === '00';

    if (isSuccess && orderId) {
      await updatePaymentIfNotPaid(orderId, txnRef);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const status = isSuccess ? 'success' : 'failed';
    const redirectUrl = orderId
      ? `${frontendUrl}/payment/result?orderId=${orderId}&status=${status}`
      : `${frontendUrl}/payment/result?status=${status}`;

    console.log(`📍 [PaymentController] VNPay return - orderId: ${orderId}, responseCode: ${vnpResponseCode}, redirect: ${status}`);
    return res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('❌ [PaymentController] Lỗi xử lý VNPay return:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/payment/result?status=error`);
  }
};

// ============================================================
// VNPay IPN (POST) — server-to-server, xử lý chính xác nhất
// ============================================================
export const handleVNPayIPN = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string>;

    console.log('📨 [PaymentController] Nhận IPN từ VNPay:', {
      vnp_ResponseCode: query['vnp_ResponseCode'],
      vnp_TxnRef:       query['vnp_TxnRef'],
      vnp_TransactionNo: query['vnp_TransactionNo'],
    });

    // 1. Kiểm tra chữ ký
    if (!paymentService.verifySignature(query)) {
      console.warn('⚠️ [PaymentController] Chữ ký IPN không hợp lệ');
      return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const vnpResponseCode = query['vnp_ResponseCode'];
    const txnRef          = query['vnp_TxnRef'];
    const vnpAmount       = Number(query['vnp_Amount']); // Amount * 100

    const orderId = extractOrderId(txnRef);
    if (!orderId) {
      console.warn(`⚠️ [PaymentController] Không thể parse orderId từ txnRef: ${txnRef}`);
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // 2. Kiểm tra order tồn tại
    const order = await Order.findByPk(orderId);
    if (!order) {
      console.warn(`⚠️ [PaymentController] Không tìm thấy order ${orderId}`);
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // 3. Kiểm tra số tiền khớp (VNPay gửi amount * 100)
    const expectedAmount = Number(order.total_price) * 100;
    if (Math.round(vnpAmount) !== Math.round(expectedAmount)) {
      console.warn(`⚠️ [PaymentController] Số tiền không khớp: nhận ${vnpAmount}, expected ${expectedAmount}`);
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    // 4. Kiểm tra đã xử lý chưa
    if (order.is_paid) {
      console.log(`ℹ️ [PaymentController] Order ${orderId} đã được thanh toán trước đó`);
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // 5. Xử lý kết quả thanh toán
    if (vnpResponseCode === '00') {
      console.log(`✅ [PaymentController] Thanh toán VNPay thành công, orderId: ${orderId}`);
      await paymentService.updateOrderPaymentStatus(orderId, true, txnRef);

      // Phân công guide (đã xử lý trong updateOrderPaymentStatus, nhưng giữ log ở đây)
      console.log(`✅ [PaymentController] Đã cập nhật trạng thái thanh toán cho order ${orderId}`);
    } else {
      console.log(`ℹ️ [PaymentController] VNPay IPN - thanh toán thất bại, responseCode: ${vnpResponseCode}`);
    }

    // VNPay yêu cầu phải phản hồi RspCode 00 để xác nhận đã nhận IPN
    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error: any) {
    console.error('❌ [PaymentController] Lỗi xử lý VNPay IPN:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};
