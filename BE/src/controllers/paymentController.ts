import { Request, Response } from 'express';
import { Op } from 'sequelize';
import paymentService from '../services/paymentService';
import tourGuideAssignmentService from '../services/tourGuideAssignmentService';
import Order from '../models/Order';
import TourGuide from '../models/TourGuide';
import { sendSuccess, sendError } from '../utils/responseHandler';

// Helper: Extract order ID từ MoMo orderId format (ORDER_{id}_{timestamp})
const extractOrderId = (orderId: string | undefined): number | null => {
  if (!orderId) return null;
  const parts = String(orderId).split('_');
  return parts.length > 1 ? Number(parts[1]) : null;
};

// Helper: Update payment status nếu order chưa thanh toán
const updatePaymentIfNotPaid = async (orderId: number, transId: string) => {
  const order = await Order.findByPk(orderId);
  if (order && !order.is_paid) {
    await paymentService.updateOrderPaymentStatus(orderId, true, transId);
  }
};

export const handleMoMoReturn = async (req: Request, res: Response) => {
  try {
    const { resultCode, orderId, transId } = req.query;

    // Extract order ID từ MoMo format
    const orderCode = extractOrderId(String(orderId));
    
    // Xử lý cập nhật trạng thái thanh toán (nếu thành công)
    if (resultCode === '0' && orderCode) {
      await updatePaymentIfNotPaid(orderCode, String(transId));
    }

    // Lấy frontend URL từ env (mặc định localhost:5173 cho Vite)
    const frontendUrl = process.env.FRONTEND_URL;
    
    // Redirect về frontend với URL sạch - chỉ truyền orderId và status
    // Không truyền các query params nhạy cảm từ MoMo
    const status = resultCode === '0' ? 'success' : 'failed';
    const redirectUrl = orderCode 
      ? `${frontendUrl}/payment/result?orderId=${orderCode}&status=${status}`
      : `${frontendUrl}/payment/result?status=${status}`;
    
    return res.redirect(redirectUrl);
  } catch (error: any) {
    // Lỗi cũng redirect về frontend với status error
    console.error('Lỗi xử lý thanh toán return:', error);
    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(`${frontendUrl}/payment/result?status=error`);
  }
};

export const handleMoMoWebhook = async (req: Request, res: Response) => {
  try {
    console.log('📨 [PaymentController] Nhận webhook từ MoMo:', {
      resultCode: req.body.resultCode,
      orderId: req.body.orderId,
      transId: req.body.transId,
    });

    if (!paymentService.verifySignature(req.body)) {
      console.warn('⚠️ [PaymentController] Chữ ký webhook không hợp lệ');
      return sendError(res, 'Chữ ký không hợp lệ', 400);
    }

    const { resultCode, orderId, transId } = req.body;
    if (resultCode === 0 || resultCode === '0') {
      const orderCode = extractOrderId(String(orderId));
      console.log(`✅ [PaymentController] Thanh toán thành công, orderCode: ${orderCode}`);
      
      if (orderCode) {
        // Kiểm tra xem order đã thanh toán chưa
        const order = await Order.findByPk(orderCode);
        if (order && !order.is_paid) {
          // Cập nhật trạng thái thanh toán
          await paymentService.updateOrderPaymentStatus(orderCode, true, String(transId));
          console.log(`✅ [PaymentController] Đã cập nhật trạng thái thanh toán cho order ${orderCode}`);

          // Tự động phân công guide cho tour
          try {
            const tourId = order.tour_id;
            if (tourId) {
              console.log(`🔄 [PaymentController] Bắt đầu phân công guide cho tour ${tourId} (order ${orderCode})`);
              
              // Tự động phân công guide cho tour
              // Một tour có thể có nhiều guides, nên luôn gọi assignGuideToTour
              // Logic bên trong sẽ kiểm tra xem guide cụ thể đã được phân công chưa
              console.log(`🔄 [PaymentController] Bắt đầu phân công guide cho tour ${tourId} (order ${orderCode})...`);
              const assignmentResult = await tourGuideAssignmentService.assignGuideToTour(Number(tourId));
              const assignedGuideId = assignmentResult.guide.id;
              console.log(`✅ [PaymentController] Đã tự động phân công guide ${assignedGuideId} cho tour ${tourId} sau khi thanh toán thành công`);
              
              // Cập nhật guide_id cho order hiện tại
              if (!order.guide_id) {
                await order.update({ guide_id: assignedGuideId });
                console.log(`✅ [PaymentController] Đã cập nhật guide_id ${assignedGuideId} cho order ${orderCode}`);
              }
              
              // Cập nhật guide_id cho các orders khác của tour này (cùng start_date, end_date, đã thanh toán, chưa có guide_id)
              if (order.start_date && order.end_date) {
                const updatedOrders = await Order.update(
                  { guide_id: assignedGuideId },
                  {
                    where: {
                      tour_id: Number(tourId),
                      start_date: order.start_date,
                      end_date: order.end_date,
                      is_paid: true,
                      guide_id: { [Op.is]: null },
                    },
                  }
                );
                if (updatedOrders[0] > 0) {
                  console.log(`✅ [PaymentController] Đã cập nhật guide_id ${assignedGuideId} cho ${updatedOrders[0]} orders khác của tour ${tourId}`);
                }
              }
            } else {
              console.warn(`⚠️ [PaymentController] Order ${orderCode} không có tour_id, không thể phân công guide`);
            }
          } catch (error: any) {
            // Log lỗi nhưng không throw để không ảnh hưởng đến webhook response
            console.error(`❌ [PaymentController] Lỗi khi tự động phân công guide sau khi thanh toán (order ${orderCode}):`, {
              message: error.message,
              stack: error.stack,
            });
          }
        } else if (order && order.is_paid) {
          console.log(`ℹ️ [PaymentController] Order ${orderCode} đã được thanh toán trước đó, bỏ qua cập nhật`);
        } else {
          console.warn(`⚠️ [PaymentController] Không tìm thấy order với ID: ${orderCode}`);
        }
      } else {
        console.warn(`⚠️ [PaymentController] Không thể extract orderCode từ orderId: ${orderId}`);
      }
    } else {
      console.log(`ℹ️ [PaymentController] Thanh toán không thành công, resultCode: ${resultCode}`);
    }

    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    console.error('❌ [PaymentController] Lỗi xử lý webhook:', error);
    sendError(res, error.message || 'Lỗi xử lý webhook', 500);
  }
};

