import { Request, Response } from 'express';
import feedbackService from '../services/feedbackService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { AuthRequest } from '../middleware/auth';

// POST /api/feedbacks/create-feedback - User tạo feedback mới
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Vui lòng đăng nhập', 401);
    }

    // Kiểm tra user không phải admin (chỉ user thường mới tạo được)
    const userRole = req.user.role;
    if (userRole !== 'user') {
      return sendError(res, 'Chỉ user mới có thể tạo feedback', 403);
    }

    const { title, message } = req.body;

    // Validate
    if (!title && !message) {
      return sendError(res, 'Vui lòng nhập ít nhất title hoặc message', 400);
    }

    const feedback = await feedbackService.createFeedback({
      user_id: req.user.id,
      title: title || null,
      message: message || null,
    });

    return sendSuccess(res, 'Tạo feedback thành công', feedback, undefined, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Có lỗi xảy ra khi tạo feedback', 500);
  }
};

// PUT /api/feedbacks/mark-cancelled/:id - Admin đổi trạng thái từ pending sang cancelled
export const markCancelled = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Vui lòng đăng nhập', 401);
    }

    // Kiểm tra phải là admin
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'employee') {
      return sendError(res, 'Chỉ admin mới có quyền thực hiện thao tác này', 403);
    }

    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return sendError(res, 'ID feedback không hợp lệ', 400);
    }

    const feedback = await feedbackService.markCancelled(id);

    return sendSuccess(res, 'Đổi trạng thái feedback thành công', feedback);
  } catch (error: any) {
    return sendError(res, error.message || 'Có lỗi xảy ra khi đổi trạng thái feedback', 500);
  }
};

// GET /api/feedbacks/get-feedback - Admin lấy danh sách feedback với tìm kiếm và phân trang
export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const result = await feedbackService.getAllFeedbacks(page, limit, search);

    return sendSuccess(res, 'Lấy danh sách feedback thành công', result.feedbacks, result.pagination);
  } catch (error: any) {
    return sendError(res, error.message || 'Có lỗi xảy ra khi lấy danh sách feedback', 500);
  }
};

