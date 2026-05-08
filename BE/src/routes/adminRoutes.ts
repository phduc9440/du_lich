import express from 'express';
import { protect, isSuperAdmin } from '../middleware/auth';
import { 
  getEmployees, 
  updateAdminRole, 
  updateAdminPassword, 
  updateAdminStatus,
  updateAdminRegion,
  getAllGuidesWithTourCount,
  getToursByGuide,
  getOrdersByGuideAndDateRange
} from '../controllers/adminController';

const router = express.Router();

// Chỉ super admin mới xem được danh sách employee
router.get('/employees', protect, isSuperAdmin, getEmployees);

// Cập nhật vai trò admin (super_admin <-> employee) - chỉ super_admin
router.put('/change-role', protect, isSuperAdmin, updateAdminRole);

// Đặt lại mật khẩu admin - chỉ super_admin
router.put('/reset-password', protect, isSuperAdmin, updateAdminPassword);

// Cập nhật trạng thái admin (khóa/mở khóa tài khoản) - chỉ super_admin
router.put('/change-status', protect, isSuperAdmin, updateAdminStatus);

// Cập nhật vùng của admin - chỉ super_admin
router.put('/change-region', protect, isSuperAdmin, updateAdminRegion);

// Lấy danh sách tất cả guides với số tour hướng dẫn
router.get('/guides', protect, isSuperAdmin, getAllGuidesWithTourCount);

// Lấy tất cả tours mà guide đã hướng dẫn
router.get('/guides/:guideId/tours', protect, isSuperAdmin, getToursByGuide);

// Lấy đơn hàng của guide trong khoảng thời gian
router.get('/guides/:guide_id/orders/:tour_id/:start_date/:end_date', protect, isSuperAdmin, getOrdersByGuideAndDateRange);

export default router;

