
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Ticket from '../models/Ticket';
import TourGuide from '../models/TourGuide';
import { sendPaymentConfirmationEmail } from './emailService';
import tourGuideAssignmentService from './tourGuideAssignmentService';

interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  returnUrl: string;
  notifyUrl: string;
}

interface CreatePaymentParams {
  orderId: number;
  amount: number;
  orderInfo: string;
  requestId?: string;
}

class PaymentService {
  private config: MoMoConfig;

  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || '',
      accessKey: process.env.MOMO_ACCESS_KEY || '',
      secretKey: process.env.MOMO_SECRET_KEY || '',
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
      returnUrl: process.env.MOMO_RETURN_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payment/momo-return`,
      notifyUrl: process.env.MOMO_NOTIFY_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payment/momo-webhook`,
    };
  }

  private createSignature(data: string): string {
    return crypto.createHmac('sha256', this.config.secretKey).update(data).digest('hex');
  }

  private makeRequest(url: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify(data);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = client.request(options, (res: any) => {
        let responseData = '';

        res.on('data', (chunk: any) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error: any) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async createPayment(params: CreatePaymentParams) {
    const { orderId, amount, orderInfo, requestId } = params;
    
    const requestIdValue = requestId || `${Date.now()}`;
    const orderIdValue = `ORDER_${orderId}_${Date.now()}`;
    const extraData = '';

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${this.config.notifyUrl}&orderId=${orderIdValue}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${this.config.returnUrl}&requestId=${requestIdValue}&requestType=captureWallet`;

    const signature = this.createSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      partnerName: 'Tour Booking',
      storeId: 'MomoTestStore',
      requestId: requestIdValue,
      amount: amount,
      orderId: orderIdValue,
      orderInfo: orderInfo,
      redirectUrl: this.config.returnUrl,
      ipnUrl: this.config.notifyUrl,
      lang: 'vi',
      autoCapture: true,
      orderExpireTime: 15,
      extraData: extraData,
      requestType: 'captureWallet',
      signature: signature,
    };

    try {
      const result = await this.makeRequest(this.config.endpoint, requestBody);

      if (result.resultCode === 0) {
        return {
          payUrl: result.payUrl,
          orderId: orderIdValue,
          requestId: requestIdValue,
        };
      } else {
        throw new Error(result.message || 'Tạo thanh toán thất bại');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi khi tạo thanh toán MoMo');
    }
  }

  verifySignature(data: any): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = data;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const calculatedSignature = this.createSignature(rawSignature);
    return calculatedSignature === signature;
  }

  async updateOrderPaymentStatus(orderId: number, isPaid: boolean, momoTransId?: string) {
    console.log(`📝 [PaymentService] updateOrderPaymentStatus - orderId: ${orderId}, isPaid: ${isPaid}`);
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Kiểm tra xem đơn hàng đã được thanh toán chưa (tránh tạo ticket trùng)
    const wasPaid = order.is_paid;
    console.log(`📝 [PaymentService] Order ${orderId} - wasPaid: ${wasPaid}, isPaid: ${isPaid}`);

    await order.update({
      is_paid: isPaid,
      status: isPaid ? 'confirmed' : order.status,
      payment_url: momoTransId ? `MOMO_${momoTransId}` : order.payment_url,
    });

    // Reload order để đảm bảo có dữ liệu mới nhất
    await order.reload();

    // Nếu thanh toán thành công và chưa từng thanh toán trước đó, tạo ticket
    if (isPaid && !wasPaid) {
      console.log(`✅ [PaymentService] Order ${orderId} thanh toán thành công lần đầu, tạo tickets...`);
      await this.createTicketsForOrder(order);
      try {
        await sendPaymentConfirmationEmail(order.id);
      } catch (error) {
        console.error('Không thể gửi email xác nhận thanh toán:', error);
      }
    }

    // Tự động phân công guide cho tour khi thanh toán thành công
    // Tách riêng logic này để đảm bảo luôn được thực hiện khi thanh toán thành công
    if (isPaid) {
      console.log(`🔄 [PaymentService] Bắt đầu xử lý phân công guide cho order ${orderId}...`);
      try {
        // Lấy tour_id từ order - sử dụng cách truy cập trực tiếp hoặc getDataValue
        const tourId = typeof order.getDataValue === 'function' 
          ? order.getDataValue('tour_id') 
          : order.tour_id;
        
        console.log(`📝 [PaymentService] Order ${orderId} - tour_id: ${tourId}`);
        
        if (!tourId) {
          console.warn(`⚠️ [PaymentService] Order ${orderId} không có tour_id, không thể phân công guide`);
          return order;
        }

        const tourIdNumber = Number(tourId);
        if (isNaN(tourIdNumber)) {
          console.warn(`⚠️ [PaymentService] tour_id ${tourId} không hợp lệ, không thể phân công guide`);
          return order;
        }

        // Tự động phân công guide cho tour
        // Một tour có thể có nhiều guides, nên luôn gọi assignGuideToTour
        // Logic bên trong sẽ kiểm tra xem guide cụ thể đã được phân công chưa
        console.log(`🔄 [PaymentService] Bắt đầu phân công guide cho tour ${tourIdNumber}...`);
        const assignmentResult = await tourGuideAssignmentService.assignGuideToTour(tourIdNumber);
        const assignedGuideId = assignmentResult.guide.id;
        console.log(`✅ [PaymentService] Tự động phân công guide ${assignedGuideId} cho tour ${tourIdNumber} sau khi thanh toán thành công`);
        
        // Cập nhật guide_id cho order hiện tại
        if (!order.guide_id) {
          await order.update({ guide_id: assignedGuideId });
          console.log(`✅ [PaymentService] Đã cập nhật guide_id ${assignedGuideId} cho order ${orderId}`);
        }
        
        // Cập nhật guide_id cho các orders khác của tour này (cùng start_date, end_date, đã thanh toán, chưa có guide_id)
        const orderStartDate = typeof order.getDataValue === 'function' 
          ? order.getDataValue('start_date') 
          : order.start_date;
        const orderEndDate = typeof order.getDataValue === 'function' 
          ? order.getDataValue('end_date') 
          : order.end_date;
        
        if (orderStartDate && orderEndDate) {
          const updatedOrders = await Order.update(
            { guide_id: assignedGuideId },
            {
              where: {
                tour_id: tourIdNumber,
                start_date: orderStartDate,
                end_date: orderEndDate,
                is_paid: true,
                guide_id: { [Op.is]: null },
              },
            }
          );
          if (updatedOrders[0] > 0) {
            console.log(`✅ [PaymentService] Đã cập nhật guide_id ${assignedGuideId} cho ${updatedOrders[0]} orders khác của tour ${tourIdNumber}`);
          }
        }
      } catch (error: any) {
        // Log lỗi chi tiết nhưng không throw để không ảnh hưởng đến việc thanh toán
        console.error(`❌ [PaymentService] Lỗi khi tự động phân công guide sau khi thanh toán (order ${orderId}):`, {
          message: error.message,
          stack: error.stack,
          tourId: order.tour_id,
        });
      }
    } else {
      console.log(`ℹ️ [PaymentService] Order ${orderId} chưa thanh toán (isPaid: ${isPaid}), bỏ qua phân công guide`);
    }

    return order;
  }

  private async createTicketsForOrder(order: Order) {
    try {
      // Lấy thông tin từ order
      const userId = order.getDataValue ? order.getDataValue('user_id') : order.user_id;
      const orderId = order.getDataValue ? order.getDataValue('id') : order.id;
      const quantity = order.getDataValue ? order.getDataValue('quantity') : order.quantity;
      const startDate = order.getDataValue ? order.getDataValue('start_date') : order.start_date;
      const endDate = order.getDataValue ? order.getDataValue('end_date') : order.end_date;

      // Tạo ticket cho mỗi quantity với các trường ban đầu
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = await Ticket.create({
          order_id: Number(orderId),
          user_id: Number(userId),
          valid_from: new Date(startDate),
          valid_until: new Date(endDate),
          status: 'active',
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

  async getOrderByCode(orderCode: string) {
    const order = await Order.findOne({
      where: { order_code: orderCode },
    });

    return order;
  }
}

export default new PaymentService();
