import { Request, Response } from 'express';
import adminService from '../services/adminService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { AuthRequest } from '../middleware/auth';

// GET /api/admins/employees - Danh sách employee (chỉ dành cho super admin)
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const currentAdminId = req.user?.id;
    
    // Parse roles parameter - nhận chuỗi "super_admin,guide,employee"
    let roles: string[] | undefined;
    if (req.query.roles) {
      const rolesParam = String(req.query.roles).trim();
      if (rolesParam) {
        roles = rolesParam
          .split(',')
          .map(r => r.trim().toLowerCase())
          .filter(r => ['super_admin', 'employee', 'guide'].includes(r));
      }
    }
    
    // Parse is_active parameter
    let is_active: boolean | undefined;
    if (req.query.is_active !== undefined) {
      const isActiveValue = String(req.query.is_active).trim().toLowerCase();
      if (isActiveValue === 'true') {
        is_active = true;
      } else if (isActiveValue === 'false') {
        is_active = false;
      }
    }
    
    // Parse region parameter - nhận chuỗi "n,s,c" hoặc "northern,southern,central"
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
    
    // Parse sort parameters
    const createdAt = req.query.createdAt as string | undefined;
    const updatedAt = req.query.updatedAt as string | undefined;

    const result = await adminService.getEmployees(
      page, 
      limit, 
      search, 
      currentAdminId,
      roles,
      is_active,
      regions,
      createdAt,
      updatedAt
    );

    return sendSuccess(res, 'Lấy danh sách admin thành công', result.employees, result.pagination);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// PUT /api/admins/change-role - Cập nhật vai trò admin (chỉ super_admin)
export const updateAdminRole = async (req: Request, res: Response) => {
  try {
    const { id, role } = req.body as { id?: number; role?: 'super_admin' | 'employee' | 'guide' };

    if (!id || isNaN(Number(id))) {
      return sendError(res, 'ID admin không hợp lệ', 400);
    }

    if (!role) {
      return sendError(res, 'Vui lòng cung cấp vai trò mới', 400);
    }

    const adminId = Number(id);
    const updatedAdmin = await adminService.updateAdminRole(adminId, role);

    return sendSuccess(res, 'Cập nhật vai trò admin thành công', updatedAdmin);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// PUT /api/admins/reset-password - Đặt lại mật khẩu admin (chỉ super_admin)
export const updateAdminPassword = async (req: Request, res: Response) => {
  try {
    const { id, password } = req.body as { id?: number; password?: string };

    if (!id || isNaN(Number(id))) {
      return sendError(res, 'ID admin không hợp lệ', 400);
    }

    if (!password) {
      return sendError(res, 'Vui lòng cung cấp mật khẩu mới', 400);
    }

    const adminId = Number(id);
    const updatedAdmin = await adminService.updateAdminPassword(adminId, password);

    return sendSuccess(res, 'Đặt lại mật khẩu admin thành công', updatedAdmin);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// PUT /api/admins/change-status - Cập nhật trạng thái admin (khóa/mở khóa tài khoản) - chỉ super_admin
export const updateAdminStatus = async (req: Request, res: Response) => {
  try {
    const { id, is_active } = req.body as { id?: number; is_active?: boolean };

    if (!id || isNaN(Number(id))) {
      return sendError(res, 'ID admin không hợp lệ', 400);
    }

    if (is_active === undefined || typeof is_active !== 'boolean') {
      return sendError(res, 'Vui lòng cung cấp trạng thái (is_active: true/false)', 400);
    }

    const adminId = Number(id);
    const updatedAdmin = await adminService.updateAdminStatus(adminId, is_active);

    const message = is_active 
      ? 'Mở khóa tài khoản admin thành công' 
      : 'Khóa tài khoản admin thành công';

    return sendSuccess(res, message, updatedAdmin);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// GET /api/admins/guides - Lấy danh sách tất cả guides với số tour hướng dẫn
export const getAllGuidesWithTourCount = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

    const result = await adminService.getAllGuidesWithTourCount(page, limit, search);

    return sendSuccess(res, 'Lấy danh sách hướng dẫn viên thành công', result.guides, result.pagination);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// GET /api/admins/guides/:guideId/tours - Lấy tất cả tours mà guide đã hướng dẫn
export const getToursByGuide = async (req: AuthRequest, res: Response) => {
  try {
    const guideId = parseInt(req.params.guideId);

    if (!guideId || isNaN(guideId)) {
      return sendError(res, 'ID hướng dẫn viên không hợp lệ', 400);
    }

    const tours = await adminService.getToursByGuide(guideId);

    return sendSuccess(res, 'Lấy danh sách tours thành công', tours);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// GET /api/admins/guides/:guide_id/orders/:tour_id/:start_date/:end_date - Lấy đơn hàng của guide trong khoảng thời gian
export const getOrdersByGuideAndDateRange = async (req: AuthRequest, res: Response) => {
  try {
    const guideId = req.params.guide_id ? parseInt(req.params.guide_id as string) : undefined;
    const startDate = req.params.start_date as string;
    const endDate = req.params.end_date as string;
    const tourId = req.params.tour_id ? parseInt(req.params.tour_id as string) : undefined;

    if (!guideId || isNaN(guideId)) {
      return sendError(res, 'ID hướng dẫn viên không hợp lệ', 400);
    }

    if (!startDate || !endDate) {
      return sendError(res, 'Vui lòng cung cấp start_date và end_date', 400);
    }

    const orders = await adminService.getOrdersByGuideAndDateRange(
      guideId,
      startDate,
      endDate,
      tourId
    );

    return sendSuccess(res, 'Lấy danh sách đơn hàng thành công', orders);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

// PUT /api/admins/change-region - Cập nhật vùng của admin (chỉ super_admin)
export const updateAdminRegion = async (req: Request, res: Response) => {
  try {
    const { admin_id, region } = req.body as { admin_id?: number; region?: 'northern' | 'central' | 'southern' | null };

    if (!admin_id || isNaN(Number(admin_id))) {
      return sendError(res, 'ID admin không hợp lệ', 400);
    }

    if (region === undefined) {
      return sendError(res, 'Vui lòng cung cấp vùng mới (region: northern, central, southern hoặc null)', 400);
    }

    const adminId = Number(admin_id);
    const updatedAdmin = await adminService.updateAdminRegion(adminId, region);

    return sendSuccess(res, 'Cập nhật vùng admin thành công', updatedAdmin);
  } catch (error: any) {
    return sendError(res, error.message);
  }
};

