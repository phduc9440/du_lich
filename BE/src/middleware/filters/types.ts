import { Request } from 'express';

export type SortDirection = 'ASC' | 'DESC';
export type SortTuple = [string, SortDirection];

// Interface cho các bộ lọc
export interface TourFilters {
  search?: string;
  category_ids?: number[]; // Hỗ trợ filter theo nhiều categories
  destination?: string;
  min_price?: number;
  max_price?: number;
  duration?: string; // short, medium, long
  types?: string[]; // beach, mountain, hiking, city, cultural
  stock?: number; // 1: còn vé, 0: hết vé
  rating?: number; // rating tối thiểu
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  sort?: string;
  page?: number;
  limit?: number;
  is_active?: boolean;
  sortOrders?: SortTuple[];
  regions?: string[]; // northern, central, southern
}

export interface BookingFilters {
  booking_status?: string;
  status?: string[]; // Mảng các status: ["pending", "confirmed", "cancelled", "completed"]
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  tour_code?: string; // Tìm kiếm theo mã tour
  tour_title?: string;
  tour_id?: number;
  search?: string; // Tìm kiếm trong order_code hoặc tour_code
  page?: number;
  limit?: number;
  ticket?: string; // Sort theo số lượng vé: "asc" hoặc "desc"
  total?: string; // Sort theo tổng tiền: "asc" hoặc "desc"
}

export interface ReviewFilters {
  tour_id?: number;
  rating?: number; // exact rating (1-5) or 'all'
  withImage?: boolean; // có hình ảnh hay không
  type_review?: string;
  page?: number;
  limit?: number;
}

// Request mở rộng với filters
export interface FilteredRequest extends Request {
  filters?: any;
  pagination?: {
    page: number;
    limit: number;
  };
}

