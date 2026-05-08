import express from 'express';
import {
  // User routes
  getUserNotifications,
  markAllUserNotificationsAsRead,
} from '../controllers/notificationController';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// ========== USER ROUTES ==========
// User lấy danh sách thông báo của mình
router.get('/user/get-noti', protect, getUserNotifications);
// User đánh dấu tất cả thông báo đã đọc
router.post('/user/read-all', protect, markAllUserNotificationsAsRead);

export default router;

