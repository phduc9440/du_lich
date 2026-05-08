import { Response } from 'express';

/**
 * Set authentication cookies (token and refreshToken)
 * @param res - Express Response object
 * @param accessToken - Access token string
 * @param refreshToken - Refresh token string
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // Lưu token vào cookie
  res.cookie('token', accessToken, {
    httpOnly: true, // Không cho phép JavaScript truy cập cookie
    secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS trong production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Lax cho development
    path: '/',
    maxAge: 30 * 60 * 1000, // 30 phút (giống thời hạn access token)
  });

  // Lưu refresh token vào cookie riêng
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
};

/**
 * Update access token cookie
 * @param res - Express Response object
 * @param accessToken - New access token string
 */
export const updateAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 30 * 60 * 1000, // 30 phút
  });
};

