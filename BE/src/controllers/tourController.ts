import { Request, Response } from 'express';
import tourService from '../services/tourService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { FilteredRequest } from '../middleware/filters';

interface AuthFilteredRequest extends FilteredRequest {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

// GET /api/tours - Lấy danh sách tours
export const getTours = async (req: FilteredRequest, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters = req.filters || {};

    const result = await tourService.getTours(page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách tours thành công', result.tours, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/admin - Danh sách tours cho admin (bao gồm cả tour inactive)
export const getAdminTours = async (req: FilteredRequest, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters = req.filters || {};

    const result = await tourService.getAdminTours(page, limit, filters);

    sendSuccess(res, 'Lấy danh sách tours cho admin thành công', result.tours, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/admin/v2 - Phiên bản hiển thị capacity còn lại
export const getAdminToursV2 = async (req: FilteredRequest, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters = req.filters || {};

    const result = await tourService.getAdminToursV2(page, limit, filters);

    sendSuccess(res, 'Lấy danh sách tours cho admin (v2) thành công', result.tours, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/featured - Lấy tours nổi bật
export const getFeaturedTours = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const tours = await tourService.getFeaturedTours(limit);
    
    sendSuccess(res, 'Lấy tours nổi bật thành công', tours);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/:id - Lấy chi tiết tour
export const getTourById = async (req: Request, res: Response) => {
  try {

    // Kiểm tra params.id có tồn tại không
    if (!req.params || !req.params.id) {
      console.log('ERROR: params.id không tồn tại');
      return sendError(res, 'ID tour là bắt buộc', 400);
    }

    const idParam = String(req.params.id).trim();
    console.log('idParam after trim:', idParam);
    console.log('idParam length:', idParam.length);
    
    // Kiểm tra nếu idParam rỗng hoặc chỉ có ":" hoặc không hợp lệ
    if (idParam === '' || idParam === ':' || idParam.length === 0) {
      console.log('ERROR: idParam rỗng hoặc không hợp lệ');
      return sendError(res, `ID tour không hợp lệ. URL nhận được: ${req.url}. Vui lòng kiểm tra URL trong Postman - đảm bảo URL là: http://localhost:5000/api/tours/48 (thay 48 bằng ID thực tế)`, 400);
    }
    
    // Kiểm tra idParam có phải là số không (regex)
    const isNumber = /^\d+$/.test(idParam);
    console.log('isNumber regex test:', isNumber);
    
    if (!isNumber) {
      console.log('ERROR: idParam không phải số');
      return sendError(res, `ID tour phải là số: ${idParam}`, 400);
    }

    const id = parseInt(idParam, 10);
    console.log('parsed id:', id);
    console.log('isNaN(id):', isNaN(id));
    console.log('id <= 0:', id <= 0);
    console.log('Number.isInteger(id):', Number.isInteger(id));
    
    // Validation: Kiểm tra ID có hợp lệ không
    if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
      console.log('ERROR: ID không hợp lệ sau khi parse');
      return sendError(res, `ID tour không hợp lệ: ${idParam}`, 400);
    }
    
    console.log('Calling tourService.getTourById with id:', id);
    const tour = await tourService.getTourById(id);
    
    sendSuccess(res, 'Lấy chi tiết tour thành công', tour);
  } catch (error: any) {
    console.log('ERROR in getTourById:', error.message);
    sendError(res, error.message);
  }
};

// POST /api/tours - Tạo tour mới (Admin)
export const createTour = async (req: Request, res: Response) => {
  try {
    const tour = await tourService.createTour(req.body);
    
    sendSuccess(res, 'Tạo tour thành công', tour, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/tours/:id - Cập nhật tour (Admin)
export const updateTour = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tour = await tourService.updateTour(id, req.body);
    
    sendSuccess(res, 'Cập nhật tour thành công', tour);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// DELETE /api/tours/:id - Xóa tour (Soft Delete - Admin)
export const deleteTour = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await tourService.deleteTour(id);
    
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// DELETE /api/tours/:id/permanent - Xóa tour vĩnh viễn (Hard Delete - Admin)
export const hardDeleteTour = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await tourService.hardDeleteTour(id);
    
    sendSuccess(res, result.message);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/tours/:id/schedule - Thêm lịch trình tour (Admin)
export const addTourSchedule = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.id);
    const { day_number, title, detail } = req.body;
    
    const schedule = await tourService.addTourSchedule(tourId, day_number, title, detail);
    
    sendSuccess(res, 'Thêm lịch trình thành công', schedule, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/tours/:id/includes - Thêm dịch vụ bao gồm (Admin)
export const addTourInclude = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.id);
    const { item } = req.body;
    
    const include = await tourService.addTourInclude(tourId, item);
    
    sendSuccess(res, 'Thêm dịch vụ bao gồm thành công', include, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/tours/:id/excludes - Thêm dịch vụ không bao gồm (Admin)
export const addTourExclude = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.id);
    const { item } = req.body;
    
    const exclude = await tourService.addTourExclude(tourId, item);
    
    sendSuccess(res, 'Thêm dịch vụ không bao gồm thành công', exclude, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/tours/:id/gallery - Thêm ảnh gallery (Admin)
export const addTourGallery = async (req: Request, res: Response) => {
  try {
    const tourId = parseInt(req.params.id);
    const { image_url } = req.body;
    
    const gallery = await tourService.addTourGallery(tourId, image_url);
    
    sendSuccess(res, 'Thêm ảnh thành công', gallery, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/gallery/destinations - Lấy 10 ảnh ngẫu nhiên cho thư viện điểm đến
export const getDestinationGallery = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const galleries = await tourService.getDestinationGallery(limit);
    
    sendSuccess(res, 'Lấy thư viện ảnh điểm đến thành công', galleries);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/most-booked - Lấy 10 tour được đặt nhiều nhất (dựa trên số orders completed)
export const getMostBookedTours = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const tours = await tourService.getMostBookedTours(limit);
    
    sendSuccess(res, 'Lấy danh sách tour được đặt nhiều nhất thành công', tours);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tours/recommended - Đề xuất tour dựa vào danh mục người dùng hay mua nhất
export const getRecommendedTours = async (req: AuthFilteredRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Bạn cần đăng nhập để xem đề xuất tour', 401);
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const tours = await tourService.getRecommendedToursByUserCategory(req.user.id, limit);
    
    sendSuccess(res, 'Lấy danh sách tour đề xuất thành công', tours);
  } catch (error: any) {
    sendError(res, error.message);
  }
};