import express from 'express';
import {
  adminLogin,
  adminRefreshToken,
  getAdminProfile,
  registerAdmin,
  updateAdminProfile,
} from '../controllers/adminAuthController';
import { protect, isAdmin, isSuperAdmin } from '../middleware/auth';

const router = express.Router();

// Admin authentication routes
router.post('/login', adminLogin);
router.post('/refresh-token', adminRefreshToken);
router.get('/profile', protect, isAdmin, getAdminProfile);
router.put('/profile', protect, isAdmin, updateAdminProfile);

// Register admin - Chỉ super_admin mới có quyền tạo tài khoản admin mới
router.post('/register', protect, isSuperAdmin, registerAdmin);

export default router;

