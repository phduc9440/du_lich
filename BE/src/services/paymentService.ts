
import * as crypto from 'crypto';
import * as qs from 'querystring';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Ticket from '../models/Ticket';
import TourGuide from '../models/TourGuide';
import { sendPaymentConfirmationEmail } from './emailService';
import tourGuideAssignmentService from './tourGuideAssignmentService';

// ============================================================
// VNPay Config
// ============================================================
interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
}

interface CreatePaymentParams {
  orderId: number;
  amount: number;       // VND, không nhân thêm
  orderInfo: string;
  ipAddr?: string;
}

// ============================================================
// Helpers
// ============================================================

/** Sắp xếp object theo key và build query string để ký (VNPay 2.1.0 yêu cầu encode value) */
function buildSortedQueryString(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  return sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
}

/** HMAC-SHA512 */
function hmacSHA512(key: string, data: string): string {
  return crypto.createHmac('sha512', key).update(Buffer.from(data, 'utf-8')).digest('hex');
}

/** Format ngày theo VNPay: yyyyMMddHHmmss (UTC+7) */
function formatVNPayDate(date: Date): string {
  const tzOffset = 7 * 60; // UTC+7
  const local = new Date(date.getTime() + tzOffset * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    local.getUTCFullYear().toString() +
    pad(local.getUTCMonth() + 1) +
    pad(local.getUTCDate()) +
    pad(local.getUTCHours()) +
    pad(local.getUTCMinutes()) +
    pad(local.getUTCSeconds())
  );
}

// ============================================================
// Service
// ============================================================

class PaymentService {
  private config: VNPayConfig;

  constructor() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.config = {
      tmnCode:    process.env.VNPAY_TMN_CODE   || 'DEMO0001',
      hashSecret: process.env.VNPAY_HASH_SECRET || 'DEMOSECRETKEY12345678901234567890',
      url:        process.env.VNPAY_URL         || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl:  process.env.VNPAY_RETURN_URL  || `${backendUrl}/api/v1/payment/vnpay-return`,
    };
  }

  // ----------------------------------------------------------
  // Tạo URL thanh toán VNPay
  // ----------------------------------------------------------
  async createPayment(params: CreatePaymentParams): Promise<{ payUrl: string; txnRef: string }> {
    const { orderId, amount, orderInfo, ipAddr = '127.0.0.1' } = params;

    // VNPay yêu cầu amount * 100 (đơn vị: đồng → VNPay dùng phân)
    const vnpAmount = Math.round(amount * 100);

    const now = new Date();
    const createDate = formatVNPayDate(now);

    // Expire sau 15 phút
    const expireDate = formatVNPayDate(new Date(now.getTime() + 15 * 60 * 1000));

    // txnRef = ORDER_{id}_{timestamp} để sau có thể extract ngược lại
    const txnRef = `ORDER_${orderId}_${Date.now()}`;

    const vnpParams: Record<string, string> = {
      vnp_Version:      '2.1.0',
      vnp_Command:      'pay',
      vnp_TmnCode:      this.config.tmnCode,
      vnp_Locale:       'vn',
      vnp_CurrCode:     'VND',
      vnp_TxnRef:       txnRef,
      vnp_OrderInfo:    orderInfo,
      vnp_OrderType:    'other',
      vnp_Amount:       String(vnpAmount),
      vnp_ReturnUrl:    this.config.returnUrl,
      vnp_IpAddr:       ipAddr,
      vnp_CreateDate:   createDate,
    };

    const signData = buildSortedQueryString(vnpParams);
    const signature = hmacSHA512(this.config.hashSecret, signData);
    vnpParams['vnp_SecureHash'] = signature;

    const queryString = buildSortedQueryString(vnpParams);
    const payUrl = `${this.config.url}?${queryString}`;

    console.log(`✅ [PaymentService] Tạo VNPay URL thành công cho order ${orderId}, txnRef: ${txnRef}`);
    return { payUrl, txnRef };
  }

  // ----------------------------------------------------------
  // Xác minh chữ ký VNPay (dùng trong return & IPN)
  // ----------------------------------------------------------
  verifySignature(query: Record<string, string>): boolean {
    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) return false;

    // Loại bỏ các trường hash khỏi params trước khi tính lại chữ ký
    const params: Record<string, string> = {};
    for (const key of Object.keys(query)) {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
        params[key] = query[key];
      }
    }

    const signData = buildSortedQueryString(params);
    const calculatedHash = hmacSHA512(this.config.hashSecret, signData);
    return calculatedHash === secureHash.toLowerCase();
  }

  // ----------------------------------------------------------
  // Cập nhật trạng thái thanh toán của order
  // ----------------------------------------------------------
  async updateOrderPaymentStatus(orderId: number, isPaid: boolean, vnpayTxnRef?: string) {
    console.log(`📝 [PaymentService] updateOrderPaymentStatus - orderId: ${orderId}, isPaid: ${isPaid}`);

    try {
      const order = await Order.findByPk(orderId);
      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      const wasPaid = order.is_paid;
      
      // 1. Cập nhật trạng thái thanh toán ngay lập tức
      await order.update({
        is_paid: isPaid,
        status: isPaid ? 'confirmed' : order.status,
        payment_url: vnpayTxnRef ? `VNPAY_${vnpayTxnRef}` : order.payment_url,
      });

      await order.reload();

      // Nếu không phải thanh toán thành công thì dừng ở đây
      if (!isPaid) return order;

      // 2. Các logic xử lý sau thanh toán (Tạo vé, Gửi mail, Phân công guide)
      // Bọc từng phần để nếu một phần lỗi không làm sập cả luồng
      if (!wasPaid) {
        console.log(`✅ [PaymentService] Order ${orderId} thanh toán thành công lần đầu, tạo tickets...`);
        try {
          await this.createTicketsForOrder(order);
        } catch (ticketError) {
          console.error('❌ [PaymentService] Lỗi khi tạo vé:', ticketError);
        }

        try {
          await sendPaymentConfirmationEmail(order.id);
        } catch (emailError) {
          console.error('❌ [PaymentService] Không thể gửi email xác nhận:', emailError);
        }
      }

      // 3. Phân công guide tự động
      console.log(`🔄 [PaymentService] Bắt đầu xử lý phân công guide cho order ${orderId}...`);
      try {
        const tourId = typeof order.getDataValue === 'function'
          ? order.getDataValue('tour_id')
          : (order as any).tour_id;

        if (tourId) {
          const assignmentResult = await tourGuideAssignmentService.assignGuideToTour(Number(tourId));
          const assignedGuideId = assignmentResult.guide.id;
          
          await order.update({ guide_id: assignedGuideId });
          console.log(`✅ [PaymentService] Đã phân công guide ${assignedGuideId} cho order ${orderId}`);

          // Cập nhật các order khác cùng tour
          const orderStartDate = order.getDataValue('start_date') || (order as any).start_date;
          const orderEndDate = order.getDataValue('end_date') || (order as any).end_date;

          if (orderStartDate && orderEndDate) {
            await Order.update(
              { guide_id: assignedGuideId },
              {
                where: {
                  tour_id: Number(tourId),
                  start_date: orderStartDate,
                  end_date: orderEndDate,
                  is_paid: true,
                  guide_id: { [Op.is]: null },
                },
              }
            );
          }
        }
      } catch (guideError: any) {
        console.error(`❌ [PaymentService] Lỗi khi phân công guide:`, guideError.message);
      }

      return order;
    } catch (error: any) {
      console.error(`❌ [PaymentService] Lỗi nghiêm trọng trong updateOrderPaymentStatus:`, error.message);
      throw error; // Ném ra để Controller xử lý
    }
  }

  // ----------------------------------------------------------
  // Tạo tickets cho order đã thanh toán
  // ----------------------------------------------------------
  private async createTicketsForOrder(order: Order) {
    try {
      const userId   = order.getDataValue ? order.getDataValue('user_id')   : order.user_id;
      const orderId  = order.getDataValue ? order.getDataValue('id')         : order.id;
      const quantity = order.getDataValue ? order.getDataValue('quantity')   : order.quantity;
      const startDate = order.getDataValue ? order.getDataValue('start_date') : order.start_date;
      const endDate   = order.getDataValue ? order.getDataValue('end_date')   : order.end_date;

      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = await Ticket.create({
          order_id:    Number(orderId),
          user_id:     Number(userId),
          valid_from:  new Date(startDate),
          valid_until: new Date(endDate),
          status:      'active',
        });
        tickets.push(ticket);
      }

      console.log(`Đã tạo ${tickets.length} vé cho đơn hàng #${orderId}`);
      return tickets;
    } catch (error: any) {
      console.error('Lỗi khi tạo ticket:', error);
      throw new Error(`Lỗi khi tạo ticket: ${error.message}`);
    }
  }

  // ----------------------------------------------------------
  // Tìm order theo order_code
  // ----------------------------------------------------------
  async getOrderByCode(orderCode: string) {
    return Order.findOne({ where: { order_code: orderCode } });
  }
}

export default new PaymentService();
