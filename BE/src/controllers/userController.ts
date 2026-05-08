import { Request, Response } from 'express';
import userService from '../services/userService';
import { sendSuccess, sendError } from '../utils/responseHandler';

// GET /api/users - Lấy danh sách users (Admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const filters = {
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: search ? search : undefined,
    };

    const result = await userService.getAllUsers(page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách users thành công', result.users, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/users/:id - Cập nhật thông tin user (Admin)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.updateUser(userId, req.body);
    
    sendSuccess(res, 'Cập nhật thông tin user thành công', user);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/users/stats/total - Lấy tổng số người dùng (Admin)
export const getTotalUsers = async (req: Request, res: Response) => {
  try {
    const stats = await userService.getTotalUsers();
    
    sendSuccess(res, 'Lấy thống kê người dùng thành công', stats);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/users/profile/:identifier - Lấy thông tin profile công khai (không cần token)
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params; // Có thể là userId hoặc username
    
    if (!identifier) {
      return sendError(res, 'Vui lòng cung cấp userId hoặc username', 400);
    }

    const profile = await userService.getPublicProfile(identifier);
    
    sendSuccess(res, 'Lấy thông tin profile thành công', profile);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

