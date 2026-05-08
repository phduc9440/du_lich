import { Request, Response } from 'express';
import reviewService from '../services/reviewService';
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

// POST /api/reviews - Tạo review mới
export const createReview = async (req: AuthRequest, res: Response) => {
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

    // Validate rating
    if (!req.body.rating) {
      return sendError(res, 'Rating là bắt buộc', 400);
    }

    const rating = Number(req.body.rating);
    if (isNaN(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return sendError(res, 'Rating phải là số nguyên từ 1 đến 5', 400);
    }

    // Validate order_id
    if (!req.body.order_id) {
      return sendError(res, 'ID đơn hàng là bắt buộc', 400);
    }

    const orderId = Number(req.body.order_id);
    if (isNaN(orderId) || orderId <= 0) {
      return sendError(res, 'ID đơn hàng không hợp lệ', 400);
    }

    // Build reviewData
    const reviewData: any = {
      user_id: req.user.id,
      tour_id: tourId,
      rating: rating,
      order_id: orderId,
    };

    // Thêm text nếu có
    if (req.body.text && req.body.text.trim() !== '') {
      reviewData.text = req.body.text.trim();
    }

    // Xử lý images array: [{image_url: '...'}, {image_url: '...'}]
    if (req.body.images && Array.isArray(req.body.images)) {
      const imageUrls = req.body.images
        .map((img: any) => {
          // Hỗ trợ cả {image_url: '...'} và string trực tiếp
          if (typeof img === 'string') {
            return img.trim();
          } else if (img && typeof img === 'object' && img.image_url) {
            return img.image_url.trim();
          }
          return null;
        })
        .filter((url: string | null) => url && url !== '');
      
      if (imageUrls.length > 0) {
        reviewData.images = imageUrls;
      }
    }

    const review = await reviewService.createReview(reviewData);
    
    sendSuccess(res, 'Tạo review thành công', review, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/reviews/tour/:tourId - Lấy reviews của tour
export const getTourReviews = async (req: FilteredRequest, res: Response) => {
  try {
    const tourId = parseInt(req.params.tourId);
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters = req.filters || {};

    const result = await reviewService.getTourReviews(tourId, page, limit, filters);
    
    sendSuccess(res, 'Lấy reviews thành công', result.reviews, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/reviews/stats/:tourId? - Lấy thống kê reviews
export const getReviewStats = async (req: Request, res: Response) => {
  try {
    const tourId = req.params.tourId ? parseInt(req.params.tourId) : undefined;
    const stats = await reviewService.getReviewStats(tourId);
    
    sendSuccess(res, 'Lấy thống kê reviews thành công', stats);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/reviews/my-reviews - Lấy reviews của user hiện tại
export const getMyReviews = async (req: AuthFilteredRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;

    const result = await reviewService.getUserReviews(req.user.id, page, limit);
    
    sendSuccess(res, 'Lấy reviews của bạn thành công', result.reviews, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/reviews - Lấy tất cả reviews (Admin)
export const getAllReviews = async (req: FilteredRequest, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters = req.filters || {};

    const result = await reviewService.getAllReviews(page, limit, filters);
    
    sendSuccess(res, 'Lấy tất cả reviews thành công', result.reviews, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/reviews/:id - Cập nhật review
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const id = parseInt(req.params.id);
    const userId = req.user.role === 'admin' ? 0 : req.user.id;

    const review = await reviewService.updateReview(id, userId, req.body);
    
    sendSuccess(res, 'Cập nhật review thành công', review);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// DELETE /api/reviews/:id - Xóa review
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const id = parseInt(req.params.id);
    const userId = req.user.role === 'admin' ? 0 : req.user.id;

    const result = await reviewService.deleteReview(id, userId);
    
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/reviews/top-5-star - Lấy 10 review 5 sao mới nhất
export const getTop5StarReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await reviewService.getTop5StarReviews();
    
    sendSuccess(res, 'Lấy top 10 reviews 5 sao thành công', reviews);
  } catch (error: any) {
    sendError(res, error.message);
  }
};