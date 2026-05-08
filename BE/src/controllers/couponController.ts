import { Request, Response } from 'express';
import couponService from '../services/couponService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { AuthRequest } from '../middleware/auth';

// GET /api/coupons/search/:code - Tìm kiếm mã giảm giá theo code
export const searchCouponByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const coupon = await couponService.getCouponByCode(code);
    
    sendSuccess(res, 'Tìm thấy mã giảm giá', coupon);
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
};

// GET /api/coupons - Lấy tất cả mã giảm giá (Admin)
export const getAllCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const filters: any = {};
    
    // Filter theo trạng thái
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true';
    }
    
    // Filter theo code
    if (req.query.code) {
      filters.code = String(req.query.code).trim();
    }

    const result = await couponService.getAllCoupons(page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách mã giảm giá thành công', result.coupons, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/coupons/:id - Lấy chi tiết mã giảm giá (Admin)
export const getCouponById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const coupon = await couponService.getCouponById(id);
    
    sendSuccess(res, 'Lấy chi tiết mã giảm giá thành công', coupon);
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
};

// POST /api/coupons - Tạo mã giảm giá mới (Admin)
export const createCoupon = async (req: AuthRequest, res: Response) => {
  const adminId = req.user?.id;
  console.log(adminId);
  try {
    const { code, description, discount_percent, discount_amount, expire_at, max_use, discount_limit } = req.body;

    if (!code || !max_use || discount_limit === undefined) {
      return sendError(res, 'Vui lòng nhập đầy đủ thông tin bắt buộc', 400);
    }

    if (!adminId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const coupon = await couponService.createCoupon(adminId,{
      code: code.trim().toUpperCase(),
      description,
      discount_percent: discount_percent ? parseInt(discount_percent) : undefined,
      discount_amount: discount_amount ? parseFloat(discount_amount) : undefined,
      expire_at: expire_at ? new Date(expire_at) : undefined,
      max_use: parseInt(max_use),
      discount_limit: parseFloat(discount_limit),
    });
    
    sendSuccess(res, 'Tạo mã giảm giá thành công', coupon, undefined, 201);
  } catch (error: any) {
    // Xử lý lỗi unique constraint (mã giảm giá đã tồn tại)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 'Mã giảm giá này đã tồn tại', 400);
    }
    sendError(res, error.message, 400);
  }
};

// PUT /api/coupons/:id - Cập nhật mã giảm giá (Admin)
export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { code, description, discount_percent, discount_amount, expire_at, max_use, is_active } = req.body;

    const updateData: any = {};
    
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (discount_percent !== undefined) updateData.discount_percent = parseInt(discount_percent);
    if (discount_amount !== undefined) updateData.discount_amount = parseFloat(discount_amount);
    if (expire_at !== undefined) updateData.expire_at = new Date(expire_at);
    if (max_use !== undefined) updateData.max_use = parseInt(max_use);
    if (is_active !== undefined) updateData.is_active = is_active;

    const coupon = await couponService.updateCoupon(id, updateData);
    
    sendSuccess(res, 'Cập nhật mã giảm giá thành công', coupon);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
};

// DELETE /api/coupons/:id - Xóa mã giảm giá (Admin)
export const deleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await couponService.deleteCoupon(id);
    
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message, 404);
  }
};

// DELETE /api/coupons/:id/delete-permanent - Xóa mã giảm giá vĩnh viễn (Hard Delete - Admin)
export const hardDeleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return sendError(res, 'ID mã giảm giá không hợp lệ', 400);
    }

    const result = await couponService.hardDeleteCoupon(id);
    
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

