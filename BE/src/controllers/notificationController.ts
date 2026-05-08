import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notificationService';
import { successResponse, errorResponse } from '../utils/responseHandler';

// ========== USER CONTROLLERS ==========

/**
 * User lấy danh sách thông báo của mình
 */
export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    const result = await notificationService.getUserNotifications(userId);

    return successResponse(res, result, 'Lấy danh sách thông báo thành công');
  } catch (error: any) {
    console.error('❌ Lỗi trong getUserNotifications controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * User đánh dấu tất cả thông báo đã đọc
 */
export const markAllUserNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    await notificationService.markAllNotificationsAsRead(userId);

    return successResponse(res, null, 'Đánh dấu tất cả thông báo đã đọc thành công');
  } catch (error: any) {
    console.error('❌ Lỗi trong markAllUserNotificationsAsRead controller:', error);
    return errorResponse(res, error.message, 500);
  }
};
