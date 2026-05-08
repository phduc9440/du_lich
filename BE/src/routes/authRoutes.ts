import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  updateUserStatus,
  resetPassword,
  forgotPassword,
  googleLogin,
} from '../controllers/authController';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword); // OTP verification đã được tích hợp vào service
router.post('/google-login', googleLogin); // Sử dụng cùng endpoint login để xử lý Google Login

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
// Admin routes
router.put('/users/status', protect, isAdmin, updateUserStatus);

export default router;

