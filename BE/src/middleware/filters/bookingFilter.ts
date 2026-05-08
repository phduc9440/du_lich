import { Response, NextFunction } from 'express';
import { FilteredRequest, BookingFilters } from './types';

// Middleware xử lý bộ lọc cho Bookings
export const bookingFilterMiddleware = (req: FilteredRequest, res: Response, next: NextFunction) => {
  try {
    const filters: BookingFilters = {};
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    // Parse các query parameters
    const typeParam = req.query.booking_status
      ? String(req.query.booking_status).trim().toLowerCase()
      : undefined;

    if (typeParam && typeParam !== 'all') {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (validStatuses.includes(typeParam)) {
        filters.booking_status = typeParam;
      }
    }

    // Parse status parameter - nhận chuỗi "pending,confirmed,cancelled,completed"
    if (req.query.status) {
      const statusParam = String(req.query.status).trim();
      if (statusParam) {
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        const statusArray = statusParam
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(s => validStatuses.includes(s));
        
        if (statusArray.length > 0) {
          filters.status = statusArray;
        }
      }
    }

    // Parse sort parameters
    if (req.query.ticket) {
      const ticketSort = String(req.query.ticket).trim().toLowerCase();
      if (ticketSort === 'asc' || ticketSort === 'desc') {
        filters.ticket = ticketSort;
      }
    }

    if (req.query.total) {
      const totalSort = String(req.query.total).trim().toLowerCase();
      if (totalSort === 'asc' || totalSort === 'desc') {
        filters.total = totalSort;
      }
    }

    // Tìm kiếm theo mã tour (tour_code)
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

    // Tìm kiếm theo search (tìm trong order_code hoặc tour_code)
    if (req.query.search) {
      filters.search = String(req.query.search).trim();
    }

    // Gắn filters và pagination vào request
    req.filters = filters;
    req.pagination = pagination;

    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi xử lý bộ lọc booking',
      error: error.message,
    });
  }
};

