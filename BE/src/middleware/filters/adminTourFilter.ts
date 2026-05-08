import { Response, NextFunction } from 'express';
import { FilteredRequest, SortDirection, SortTuple, TourFilters } from './types';

const SORTABLE_FIELDS = ['start_date', 'end_date', 'price', 'created_at', 'updated_at'] as const;

const parseSortDirection = (value: unknown): SortDirection | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'asc' || normalized === 'desc') {
    return normalized.toUpperCase() as SortDirection;
  }
  return undefined;
};

const parseBoolean = (value: unknown): boolean | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }
  return null;
};

export const adminTourFilterMiddleware = (req: FilteredRequest, res: Response, next: NextFunction) => {
  try {
    const filters: TourFilters = {};
    const pagination = {
      page: parseInt(req.query.page as string, 10) > 0 ? parseInt(req.query.page as string, 10) : 1,
      limit: parseInt(req.query.limit as string, 10) > 0 ? parseInt(req.query.limit as string, 10) : 10,
    };

    if (req.query.search) {
      filters.search = String(req.query.search).trim();
    }

    if (req.query.destination) {
      filters.destination = String(req.query.destination).trim();
    }

    // Region filter - nhận chuỗi "n,s,c" hoặc "northern,central,southern"
    if (req.query.region || req.query.regions) {
      const regionParam = String(req.query.region || req.query.regions).trim();
      
      if (regionParam) {
        // Map từ viết tắt sang tên đầy đủ
        const regionMap: Record<string, string> = {
          'n': 'northern',
          's': 'southern',
          'c': 'central',
          'northern': 'northern',
          'southern': 'southern',
          'central': 'central',
        };
        
        const validRegions = ['northern', 'central', 'southern'];
        
        // Xử lý chuỗi comma-separated: "n,s,c" hoặc "northern,central,southern"
        const regionsArray = regionParam
          .split(',')
          .map(r => r.trim().toLowerCase())
          .map(r => regionMap[r] || r) // Chuyển đổi viết tắt sang tên đầy đủ
          .filter(r => validRegions.includes(r)); // Chỉ giữ lại các region hợp lệ
        
        if (regionsArray.length > 0) {
          filters.regions = regionsArray;
        }
      }
    }

    if (req.query.category_ids) {
      const ids = String(req.query.category_ids)
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id) && id > 0);

      if (ids.length > 0) {
        filters.category_ids = ids;
      }
    }

    if (req.query.min_price) {
      const minPrice = parseFloat(String(req.query.min_price));
      if (!isNaN(minPrice) && minPrice >= 0) {
        filters.min_price = minPrice;
      }
    }

    if (req.query.max_price) {
      const maxPrice = parseFloat(String(req.query.max_price));
      if (!isNaN(maxPrice) && maxPrice >= 0) {
        filters.max_price = maxPrice;
      }
    }

    if (req.query.rating) {
      const ratingValue = parseFloat(String(req.query.rating));
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        filters.rating = ratingValue;
      }
    }

    const sortOrders: SortTuple[] = [];

    const registerSort = (field: (typeof SORTABLE_FIELDS)[number], rawValue: unknown): boolean => {
      const direction = parseSortDirection(rawValue);
      if (direction) {
        sortOrders.push([field, direction]);
        return true;
      }
      return false;
    };

    const startDateParam = req.query.start_date || req.query.startDate;
    if (startDateParam && !registerSort('start_date', startDateParam)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(startDateParam))) {
        filters.start_date = String(startDateParam);
      }
    }

    const endDateParam = req.query.end_date || req.query.endDate;
    if (endDateParam && !registerSort('end_date', endDateParam)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(endDateParam))) {
        filters.end_date = String(endDateParam);
      }
    }

    if (req.query.price) {
      registerSort('price', req.query.price);
    }

    if (req.query.created_at) {
      registerSort('created_at', req.query.created_at);
    }

    if (req.query.updated_at) {
      registerSort('updated_at', req.query.updated_at);
    }

    if (req.query.is_active !== undefined) {
      const boolValue = parseBoolean(req.query.is_active);
      const normalized = String(req.query.is_active).trim().toLowerCase();

      if (boolValue === null && normalized !== 'all' && normalized !== '') {
        return res.status(400).json({
          success: false,
          message: 'Tham số is_active chỉ chấp nhận giá trị true, false hoặc all',
        });
      }

      if (boolValue !== null) {
        filters.is_active = boolValue;
      }
    }

    req.filters = {
      ...filters,
      sortOrders: sortOrders.length > 0 ? sortOrders : undefined,
    };

    req.pagination = pagination;

    next();
  } catch (error: any) {
    console.error('❌ Lỗi khi xử lý bộ lọc admin tour:', error);
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi xử lý bộ lọc tour cho admin',
      error: error.message,
    });
  }
};


