import express from 'express';
import { protect, isAdmin } from '../middleware/auth';
import { 
  getAllUsers,
  updateUser,
  getTotalUsers,
  getProfile
} from '../controllers/userController';

const router = express.Router();

// Public routes - Không cần token
router.get('/profile/:identifier', getProfile); // Lấy profile công khai bằng userId hoặc username

// Admin routes - Yêu cầu đăng nhập và phải là admin
router.get('/stats/total', protect, isAdmin, getTotalUsers); // Đặt trước /:id để tránh conflict
router.get('/', protect, isAdmin, getAllUsers);
router.put('/:id', protect, isAdmin, updateUser); // Cập nhật đầy đủ thông tin user

export default router;