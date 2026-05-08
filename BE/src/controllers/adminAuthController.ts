import { Response } from 'express';
import adminAuthService from '../services/adminAuthService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { setAuthCookies, updateAccessTokenCookie } from '../utils/cookieHelper';

// Admin Login
export const adminLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await adminAuthService.login({ email, password });

    // Lưu token vào cookie
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return sendSuccess(res, 'Đăng nhập admin thành công', result, undefined, 200);
  } catch (error: any) {
    console.error('Admin Login Error:', error.message);
    return sendError(res, error.message, 401);
  }
};

// Admin Refresh Token
export const adminRefreshToken = async (req: AuthRequest, res: Response) => {
  try {
    // Đọc refresh token từ cookie hoặc body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return sendError(res, 'Refresh token không được cung cấp', 400);
    }

    const result = await adminAuthService.refreshToken(refreshToken);

    // Cập nhật access token trong cookie
    updateAccessTokenCookie(res, result.accessToken);

    return sendSuccess(res, 'Làm mới token thành công', result, undefined, 200);
  } catch (error: any) {
    console.error('Admin Refresh Token Error:', error.message);
    return sendError(res, error.message, 401);
  }
};

// Get Admin Profile
export const getAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Không tìm thấy thông tin admin', 401);
    }

    const admin = await adminAuthService.getAdminById(req.user.id);

    return sendSuccess(res, 'Lấy thông tin admin thành công', { admin }, undefined, 200);
  } catch (error: any) {
    console.error('Get Admin Profile Error:', error.message);
    return sendError(res, error.message, 404);
  }
};

// Register Admin (chỉ super_admin mới có quyền)
export const registerAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, role, region, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return sendError(res, 'Vui lòng nhập đầy đủ thông tin (username, email, password)', 400);
    }

    const result = await adminAuthService.register({
      username,
      email,
      password,
      role,
      region,
      phone,
    });

    return sendSuccess(res, 'Tạo tài khoản admin thành công', result, undefined, 201);
  } catch (error: any) {
    console.error('Register Admin Error:', error.message);
    return sendError(res, error.message, 400);
  }
};

// Update Admin Profile - Cập nhật thông tin của bản thân (tất cả admin đều dùng được)
export const updateAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Không tìm thấy thông tin admin', 401);
    }

    const { username, email, phone } = req.body;

    const admin = await adminAuthService.updateProfile(req.user.id, {
      username,
      email,
      phone,
    });

    return sendSuccess(res, 'Cập nhật thông tin admin thành công', admin, undefined, 200);
  } catch (error: any) {
    console.error('Update Admin Profile Error:', error.message);
    return sendError(res, error.message, 400);
  }
};

