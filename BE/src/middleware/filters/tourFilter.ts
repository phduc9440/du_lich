import { Response, NextFunction } from 'express';
import { FilteredRequest, TourFilters } from './types';

// Middleware xử lý bộ lọc cho Tours
export const tourFilterMiddleware = (req: FilteredRequest, res: Response, next: NextFunction) => {
  try {
    console.log('🔧 Tour filter middleware - Query params:', req.query);
    
    const filters: TourFilters = {};
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    // Parse các query parameters
    if (req.query.search) {
      filters.search = String(req.query.search).trim();
    }

    // Category IDs - nhận chuỗi comma-separated: category_ids=1,2,3,4
    if (req.query.category_ids) {
      const categoryIdsParam = String(req.query.category_ids).trim();
      
      if (categoryIdsParam) {
        // Xử lý chuỗi comma-separated: "1,2,3,4"
        const categoryIdsArray = categoryIdsParam
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id) && id > 0);
        
        if (categoryIdsArray.length > 0) {
          filters.category_ids = categoryIdsArray;
        }
      }
    }

    if (req.query.destination) {
      filters.destination = String(req.query.destination).trim();
    }

    // Min price (hỗ trợ cả camelCase và snake_case)
    if (req.query.min_price || req.query.minPrice) {
      const minPrice = parseFloat((req.query.min_price || req.query.minPrice) as string);
      if (!isNaN(minPrice) && minPrice >= 0) {
        filters.min_price = minPrice;
      }
    }

    // Max price (hỗ trợ cả camelCase và snake_case)
    if (req.query.max_price || req.query.maxPrice) {
      const maxPrice = parseFloat((req.query.max_price || req.query.maxPrice) as string);
      if (!isNaN(maxPrice) && maxPrice >= 0) {
        filters.max_price = maxPrice;
      }
    }

    if (req.query.sort) {
      const sortValue = String(req.query.sort).trim();
      // Chỉ cho phép các giá trị sort hợp lệ
      const validSorts = ['price_asc', 'price_desc', 'rating_desc', 'created_desc', 'name_asc', 'name_desc'];
      if (validSorts.includes(sortValue)) {
        filters.sort = sortValue;
      }
    }

    // Duration filter (short: 1-3 ngày, medium: 4-7 ngày, long: >7 ngày)
    if (req.query.duration) {
      const durationValue = String(req.query.duration).trim();
      const validDurations = ['short', 'medium', 'long'];
      if (validDurations.includes(durationValue)) {
        filters.duration = durationValue;
      }
    }

    // Types filter (các loại tour)
    if (req.query.types) {
      const validTypes = ['beach', 'mountain', 'hiking', 'city', 'cultural'];
      let typesArray: string[] = [];
      
      // Xử lý cả 2 trường hợp: array hoặc string (comma-separated)
      if (Array.isArray(req.query.types)) {
        // Trường hợp: types=mountain&types=city (multiple params)
        typesArray = req.query.types.map(t => String(t).trim()).filter(Boolean);
      } else {
        // Trường hợp: types=mountain,city (comma-separated string)
        const typesValue = String(req.query.types).trim();
        if (typesValue) {
          typesArray = typesValue.split(',').map(t => t.trim()).filter(Boolean);
        }
      }
      
      // Chỉ giữ lại các types hợp lệ
      const filteredTypes = typesArray.filter(t => validTypes.includes(t));
      if (filteredTypes.length > 0) {
        filters.types = filteredTypes;
      }
    }

    // Stock filter (còn vé hay không)
    if (req.query.stock !== undefined) {
      const stockValue = String(req.query.stock).trim();
      if (stockValue === '0' || stockValue === '1') {
        filters.stock = parseInt(stockValue, 10);
      }
    }

    // Rating filter (rating tối thiểu)
    if (req.query.rating) {
      const ratingValue = parseFloat(req.query.rating as string);
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        filters.rating = ratingValue;
      }
    }

    // Start date filter (hỗ trợ cả camelCase và snake_case)
    if (req.query.startDate || req.query.start_date) {
      const startDate = String(req.query.startDate || req.query.start_date).trim();
      // Validate date format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        filters.start_date = startDate;
      }
    }

    // End date filter (hỗ trợ cả camelCase và snake_case)
    if (req.query.endDate || req.query.end_date) {
      const endDate = String(req.query.endDate || req.query.end_date).trim();
      // Validate date format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        filters.end_date = endDate;
      }
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

    // Gắn filters và pagination vào request
    req.filters = filters;
    req.pagination = pagination;

    console.log('✅ Parsed filters:', filters);
    console.log('✅ Pagination:', pagination);

    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi xử lý bộ lọc',
      error: error.message,
    });
  }
};

