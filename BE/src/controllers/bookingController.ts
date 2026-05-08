import { Response } from 'express';
import bookingService from '../services/bookingService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { FilteredRequest } from '../middleware/filters';
import { AuthRequest } from '../middleware/auth';

interface AuthFilteredRequest extends FilteredRequest {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

// POST /api/bookings - Tạo booking mới
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    // Validate tour_id
    if (!req.body.tour_id) {
      return sendError(res, 'ID tour là bắt buộc', 400);
    }

    const tourId = Number(req.body.tour_id);
    if (isNaN(tourId) || tourId <= 0) {
      return sendError(res, 'ID tour không hợp lệ', 400);
    }

    // Validate quantity
    if (!req.body.quantity) {
      return sendError(res, 'Số lượng là bắt buộc', 400);
    }

    const quantity = Number(req.body.quantity);
    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return sendError(res, 'Số lượng không hợp lệ', 400);
    }

    // Validate coupon_id (optional)
    let couponId: number | undefined = undefined;
    if (req.body.coupon_id) {
      couponId = Number(req.body.coupon_id);
      if (isNaN(couponId) || couponId <= 0) {
        return sendError(res, 'ID coupon không hợp lệ', 400);
      }
    }

    // start_date, end_date và payment_url sẽ được lấy/tạo tự động từ tour
    const bookingData = {
      user_id: req.user.id,
      tour_id: tourId,
      quantity: quantity,
      coupon_id: couponId,
    };

    const booking = await bookingService.createBooking(bookingData);
    
    sendSuccess(res, 'Đặt tour thành công', booking, undefined, 201);
  } catch (error: any) {
    // Xử lý lỗi unique constraint (order_code có thể trùng)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Lỗi tạo đơn hàng. Vui lòng thử lại.', 400);
    }
    sendError(res, error.message);
  }
};

// GET /api/bookings/my-bookings - Lấy bookings của user hiện tại
export const getMyBookings = async (req: AuthFilteredRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    
    const filters: any = {};
    const statusParam = req.query.booking_status
      ? String(req.query.booking_status).trim().toLowerCase()
      : undefined;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (statusParam && statusParam !== 'all') {
      const normalizedStatus = statusParam === 'canceled' ? 'cancelled' : statusParam;
      if (validStatuses.includes(normalizedStatus)) {
        filters.booking_status = normalizedStatus;
      }
    }

    if (req.query.search) {
      filters.search = String(req.query.search).trim();
    }

    if (req.query.tour_code) {
      filters.tour_code = String(req.query.tour_code).trim();
    }

    if (req.query.tour_title) {
      filters.tour_title = String(req.query.tour_title).trim();
    }

    if (req.query.tour_id) {
      const parsedTourId = parseInt(String(req.query.tour_id), 10);
      if (!isNaN(parsedTourId) && parsedTourId > 0) {
        filters.tour_id = parsedTourId;
      }
    }

    const result = await bookingService.getUserBookings(req.user.id, page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách bookings thành công', result.bookings, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/bookings - Lấy tất cả bookings (Admin)
export const getAllBookings = async (req: AuthFilteredRequest, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters = req.filters || {};

    const result = await bookingService.getAllBookings(page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách bookings thành công', result.bookings, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/bookings/:id - Lấy chi tiết booking
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userRole = req.user?.role ?? 'user';
    const isAdminUser = ['super_admin', 'employee'].includes(userRole);
    const userId = isAdminUser ? undefined : req.user?.id;

    const booking = await bookingService.getBookingById(id, userId);
    
    sendSuccess(res, 'Lấy chi tiết booking thành công', booking);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/bookings/:id/cancel - Hủy booking
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const id = parseInt(req.params.id);
    const adminId = req.user.role === 'super_admin' ? req.user.id : undefined;
    const booking = await bookingService.cancelBooking(id, adminId);
    
    sendSuccess(res, 'Hủy booking thành công', booking);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/bookings/:id/confirm - Xác nhận booking (Admin)
export const confirmBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await bookingService.confirmBooking(id);
    
    sendSuccess(res, 'Xác nhận booking thành công', booking);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/bookings/:id/payment - Cập nhật trạng thái thanh toán (Admin)
export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { is_paid } = req.body;
    
    const booking = await bookingService.updatePaymentStatus(id, is_paid);
    
    sendSuccess(res, 'Cập nhật trạng thái thanh toán thành công', booking);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/bookings/:id/complete - Hoàn thành booking (Admin)
export const completeBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await bookingService.completeBooking(id);
    
    sendSuccess(res, 'Hoàn thành booking thành công', booking);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/bookings/stats/completed - Lấy tổng số đơn hàng đã bán được (Admin)
export const getTotalCompletedOrders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bookingService.getTotalCompletedOrders();
    
    sendSuccess(res, 'Lấy tổng số đơn hàng đã bán được thành công', result);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// DELETE /api/bookings/:id/permanent - Xóa đơn hàng vĩnh viễn (Hard Delete - Admin)
export const hardDeleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return sendError(res, 'ID đơn hàng không hợp lệ', 400);
    }

    const result = await bookingService.hardDeleteOrder(id);
    
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message);
  }
};