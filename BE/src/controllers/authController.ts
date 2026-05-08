import { Request, Response } from 'express';
import authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { loginWithGoogle } from '../services/googleAuthService';
import { AuthRequest } from '../middleware/auth';
import { isValidEmail } from '../utils/validation';
import { setAuthCookies, updateAccessTokenCookie } from '../utils/cookieHelper';

// POST /api/auth/register - Đăng ký
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, phone } = req.body;

    // Validation cơ bản
    if (!email || !password || !username) {
      return sendError(res, 'Vui lòng nhập đầy đủ email, username và mật khẩu', 400);
    }

    // Kiểm tra định dạng email
    if (!isValidEmail(email)) {
      return sendError(res, 'Email không hợp lệ', 400);
    }

    const result = await authService.register(req.body);
    
    sendSuccess(res, 'Đăng ký thành công', result, undefined, 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/auth/login - Đăng nhập
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 'Vui lòng nhập đầy đủ email và mật khẩu', 400);
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return sendError(res, 'Email và mật khẩu phải là chuỗi', 400);
    }

    // Kiểm tra định dạng email
    if (!isValidEmail(email)) {
      return sendError(res, 'Email không hợp lệ', 400);
    }

    const result = await authService.login({ email, password });
    
    // Lưu token vào cookie
    setAuthCookies(res, result.accessToken, result.refreshToken);
    
    sendSuccess(res, 'Đăng nhập thành công', result);
  } catch (error: any) {
    sendError(res, error.message, 401);
  }
};

// POST /api/auth/google-login - Đăng nhập với Google
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { google_token } = req.body;
    if (!google_token || typeof google_token !== 'string') {
      return sendError(res, 'ID Token không hợp lệ', 400);
    }
    const result = await loginWithGoogle({ google_token });

    // Lưu token vào cookie
    res.cookie('token', result.accessToken, {
      httpOnly: true, // Không cho phép JavaScript truy cập cookie
      secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS trong production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Lax cho development
      path: '/',
      maxAge: 30 * 60 * 1000, // 30 phút (giống thời hạn access token)
    });

    // Lưu refresh token vào cookie riêng
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    
    sendSuccess(res, 'Đăng nhập thành công', result);
  } catch (error: any) {
    sendError(res, error.message, 401);
  }
};

// POST /api/auth/refresh-token - Làm mới access token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Đọc refresh token từ cookie hoặc body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return sendError(res, 'Refresh token là bắt buộc', 400);
    }

    const result = await authService.refreshToken(refreshToken);
    
    // Cập nhật access token trong cookie
    updateAccessTokenCookie(res, result.accessToken);
    
    sendSuccess(res, 'Làm mới token thành công', result);
  } catch (error: any) {
    sendError(res, error.message, 401);
  }
};

// GET /api/auth/me - Lấy thông tin user hiện tại
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const user = await authService.getUserById(req.user.id);
    
    sendSuccess(res, 'Lấy thông tin user thành công', user);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/auth/profile - Cập nhật profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const user = await authService.updateProfile(req.user.id, req.body);
    
    sendSuccess(res, 'Cập nhật profile thành công', user);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/auth/change-password - Đổi mật khẩu
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    await authService.changePassword(req.user.id, req.body);
    
    sendSuccess(res, 'Đổi mật khẩu thành công');
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/auth/forgot-password - Quên mật khẩu
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return sendError(res, 'Vui lòng nhập email', 400);
    }

    const result = await authService.forgotPassword({ email });
    
    return sendSuccess(res, result.message, result);
  } catch (error: any) {
    console.error('Forgot Password Error:', error.message);
    return sendError(res, error.message, 400);
  }
};

// POST /api/auth/reset-password - Đặt lại mật khẩu
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, new_password, otp } = req.body;

    // Validation
    if (!email || !new_password || !otp) {
      return sendError(res, 'Vui lòng nhập đầy đủ email, OTP và mật khẩu mới', 400);
    }

    const result = await authService.resetPassword({
      email,
      new_password,
      otp,
    });
    
    return sendSuccess(res, result.message);
  } catch (error: any) {
    console.error('Reset Password Error:', error.message);
    return sendError(res, error.message, 400);
  }
};

// PUT /api/auth/users/status - Cập nhật trạng thái user (Admin)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const {userId, is_active } = req.body;

    const user = await authService.updateUserStatus(Number(userId), is_active);
    
    sendSuccess(res, 'Cập nhật trạng thái user thành công', user);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// POST /api/auth/logout - Đăng xuất
export const logout = async (req: Request, res: Response) => {
  try {
    // Xóa cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    
    sendSuccess(res, 'Đăng xuất thành công');
  } catch (error: any) {
    sendError(res, error.message);
  }
};
