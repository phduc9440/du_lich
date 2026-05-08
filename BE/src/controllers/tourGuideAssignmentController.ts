import { Request, Response } from 'express';
import tourGuideAssignmentService from '../services/tourGuideAssignmentService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/tours/:tourId/assign-guide
 * Phân công guide cho tour bằng thuật toán tham lam
 */
export const assignGuideToTour = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.tourId);

    if (isNaN(tourId) || tourId <= 0) {
      return sendError(res, 'ID tour không hợp lệ', 400);
    }

    const result = await tourGuideAssignmentService.assignGuideToTour(tourId);

    sendSuccess(
      res,
      'Phân công guide thành công',
      {
        tour_id: tourId,
        guide: {
          id: result.guide.id,
          username: result.guide.username,
          email: result.guide.email,
          region: result.guide.region,
        },
        assignment: {
          id: result.tourGuide.id,
          start_date: result.tourGuide.start_date,
          end_date: result.tourGuide.end_date,
        },
      },
      undefined,
      200
    );
  } catch (error: any) {
    console.error('Error assigning guide to tour:', error);
    sendError(res, error.message, 400);
  }
};

/**
 * GET /api/tours/:tourId/available-guides
 * Lấy danh sách guides có thể phân công cho tour (preview)
 */
export const getAvailableGuidesForTour = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.tourId);

    if (isNaN(tourId) || tourId <= 0) {
      return sendError(res, 'ID tour không hợp lệ', 400);
    }

    const guides = await tourGuideAssignmentService.getAvailableGuidesForTour(tourId);

    sendSuccess(res, 'Lấy danh sách guides khả dụng thành công', guides);
  } catch (error: any) {
    console.error('Error getting available guides:', error);
    sendError(res, error.message, 400);
  }
};

/**
 * GET /api/tours/assigned/upcoming
 * Lấy danh sách tour đã phân công từ bảng tour_guides (bao gồm cả quá khứ)
 */
export const getAssignedToursUpcoming = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    
    // Parse sort parameters
    const startDateSort = typeof req.query.start_date === 'string' ? req.query.start_date.trim().toLowerCase() : undefined;
    const endDateSort = typeof req.query.end_date === 'string' ? req.query.end_date.trim().toLowerCase() : undefined;
    const quantityClientSort = typeof req.query.quantity_client === 'string' ? req.query.quantity_client.trim().toLowerCase() : undefined;
    
    // Parse status parameter
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : undefined;

    if (page < 1 || limit < 1) {
      return sendError(res, 'Page và limit phải lớn hơn 0', 400);
    }

    // Parse region parameter - nhận chuỗi "n,s,c"
    let regions: string[] | undefined;
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
          regions = regionsArray;
        }
      }
    }

    const result = await tourGuideAssignmentService.getAssignedToursWithUpcomingStartDate(
      page, 
      limit, 
      search,
      regions,
      undefined, // startDate filter - không dùng nữa
      undefined, // endDate filter - không dùng nữa
      status,
      startDateSort,
      endDateSort,
      quantityClientSort
    );

    sendSuccess(
      res,
      'Lấy danh sách tour đã phân công sắp tới thành công',
      result.tours,
      result.pagination
    );
  } catch (error: any) {
    console.error('Error getting assigned tours upcoming:', error);
    sendError(res, error.message, 400);
  }
};

/**
 * GET /api/tours/guides/by-dates/:tour_id/:start_date/:end_date
 * Lấy danh sách guides theo tour_id, start_date, và end_date
 */
export const getGuidesByTourAndDates = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.tour_id as string);
    console.log('🔍 tourId:', tourId);
    const startDate = req.params.start_date as string;
    const endDate = req.params.end_date as string;

    if (!tourId || isNaN(tourId) || tourId <= 0) {
      return sendError(res, 'tour_id không hợp lệ', 400);
    }

    if (!startDate) {
      return sendError(res, 'start_date là bắt buộc', 400);
    }

    if (!endDate) {
      return sendError(res, 'end_date là bắt buộc', 400);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      return sendError(res, 'start_date phải có định dạng YYYY-MM-DD', 400);
    }

    if (!dateRegex.test(endDate)) {
      return sendError(res, 'end_date phải có định dạng YYYY-MM-DD', 400);
    }

    const guides = await tourGuideAssignmentService.getGuidesByTourAndDates(
      tourId,
      startDate,
      endDate
    );

    sendSuccess(
      res,
      'Lấy danh sách guides thành công',
      guides,
      undefined,
      200
    );
  } catch (error: any) {
    console.error('Error getting guides by tour and dates:', error);
    sendError(res, error.message, 400);
  }
};

/**
 * GET /api/tours/my-tours
 * Lấy tất cả tours của guide đang đăng nhập với pagination và status filter
 */
export const getMyTours = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Vui lòng đăng nhập', 401);
    }

    // Kiểm tra role phải là 'guide'
    if (req.user.role !== 'guide') {
      return sendError(res, 'Chỉ guide mới có quyền truy cập tài nguyên này', 403);
    }

    const guideId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : undefined;

    // Validate status
    if (status && status !== 'valid' && status !== 'invalid') {
      return sendError(res, 'Status phải là "valid" hoặc "invalid"', 400);
    }

    if (page < 1 || limit < 1) {
      return sendError(res, 'Page và limit phải lớn hơn 0', 400);
    }

    const result = await tourGuideAssignmentService.getToursByGuideId(
      guideId,
      page,
      limit,
      status as 'valid' | 'invalid' | undefined
    );

    sendSuccess(
      res,
      'Lấy danh sách tours của guide thành công',
      result.tours,
      result.pagination,
      200
    );
  } catch (error: any) {
    console.error('Error getting my tours:', error);
    sendError(res, error.message, 400);
  }
};

/**
 * GET /api/tours/orders/by-tour/:tour_id/:start_date/:end_date
 * Lấy danh sách đơn hàng được phân công cho guide theo tour_id, start_date, end_date
 */
export const getOrdersByTour = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Vui lòng đăng nhập', 401);
    }

    // Kiểm tra role phải là 'guide'
    if (req.user.role !== 'guide') {
      return sendError(res, 'Chỉ guide mới có quyền truy cập tài nguyên này', 403);
    }

    const { tour_id, start_date, end_date } = req.params;

    // Validate tour_id
    if (!tour_id || typeof tour_id !== 'string') {
      return sendError(res, 'tour_id là bắt buộc', 400);
    }

    const tourId = parseInt(tour_id);
    if (isNaN(tourId) || tourId <= 0) {
      return sendError(res, 'tour_id không hợp lệ', 400);
    }

    // Validate start_date
    if (!start_date || typeof start_date !== 'string') {
      return sendError(res, 'start_date là bắt buộc', 400);
    }

    // Validate end_date
    if (!end_date || typeof end_date !== 'string') {
      return sendError(res, 'end_date là bắt buộc', 400);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date)) {
      return sendError(res, 'start_date phải có định dạng YYYY-MM-DD', 400);
    }

    if (!dateRegex.test(end_date)) {
      return sendError(res, 'end_date phải có định dạng YYYY-MM-DD', 400);
    }

    const guideId = req.user.id;
    const orders = await tourGuideAssignmentService.getOrdersByGuideAndTour(
      guideId,
      tourId,
      start_date,
      end_date
    );

    sendSuccess(
      res,
      'Lấy danh sách đơn hàng thành công',
      orders,
      undefined,
      200
    );
  } catch (error: any) {
    console.error('Error getting orders by tour:', error);
    sendError(res, error.message, 400);
  }
};
