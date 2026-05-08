import { Response, NextFunction } from 'express';
import { FilteredRequest } from './types';

// Middleware xử lý pagination chung
export const paginationMiddleware = (req: FilteredRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validation
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số trang phải lớn hơn 0',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng mỗi trang phải từ 1 đến 100',
      });
    }

    req.pagination = { page, limit };
    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi xử lý phân trang',
      error: error.message,
    });
  }
};

