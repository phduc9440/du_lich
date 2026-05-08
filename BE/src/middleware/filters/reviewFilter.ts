import { Response, NextFunction } from 'express';
import { FilteredRequest, ReviewFilters } from './types';

// Middleware xử lý bộ lọc cho Reviews
export const reviewFilterMiddleware = (req: FilteredRequest, res: Response, next: NextFunction) => {
  try {
    const filters: ReviewFilters = {};
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    // Parse type_review (ưu tiên so với các params cũ)
    const typeReviewRaw = typeof req.query.type_review === 'string'
      ? req.query.type_review.trim().toLowerCase()
      : undefined;

    if (typeReviewRaw) {
      filters.type_review = typeReviewRaw;

      if (typeReviewRaw === 'with_image') {
        filters.withImage = true;
      } else if (typeReviewRaw !== 'all') {
        const rating = parseInt(typeReviewRaw, 10);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          filters.rating = rating;
        }
      }
    } else {
      // Backward compatibility: hỗ trợ query cũ (rating, withImage)
      if (req.query.rating) {
        const rating = parseInt(req.query.rating as string);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          filters.rating = rating;
        }
      }

      if (req.query.withImage !== undefined) {
        filters.withImage = req.query.withImage === '1' || req.query.withImage === 'true';
      }
    }

    // Hỗ trợ tour_id (chủ yếu cho admin API)
    if (req.query.tour_id) {
      const tourId = parseInt(req.query.tour_id as string);
      if (!isNaN(tourId)) {
        filters.tour_id = tourId;
      }
    }

    // Gắn filters và pagination vào request
    req.filters = filters;
    req.pagination = pagination;

    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi xử lý bộ lọc review',
      error: error.message,
    });
  }
};

