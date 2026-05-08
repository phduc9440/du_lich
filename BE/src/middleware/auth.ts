import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Admin from '../models/Admin';
import { JWTPayload } from '../utils/generateToken';
export interface AuthRequest extends Request {
  user?: any;
  admin?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Đọc token từ cookie trước, nếu không có thì fallback sang Bearer token
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để truy cập tài nguyên này',
      });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
    } catch (verifyError: any) {
      throw verifyError; // Re-throw để catch block xử lý
    }

    // Kiểm tra decoded có id không
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    // Lấy role từ token (mặc định là 'user' nếu không có)
    const userRole = decoded.role || 'user';

    // Chuyển đổi decoded.id sang number (MySQL có thể cần number)
    const userIdRaw = decoded.id;
    const userId = typeof userIdRaw === 'number' 
      ? userIdRaw 
      : typeof userIdRaw === 'bigint' 
        ? Number(userIdRaw)
        : parseInt(String(userIdRaw), 10);
    
    if (isNaN(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }

    // Kiểm tra role để tìm đúng model
    if (userRole === 'admin') {
      // Tìm admin bằng findByPk
      const admin = await Admin.findByPk(userId, {
        attributes: { exclude: ['password_hash'] },
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Quản trị viên không tồn tại',
        });
      }

      // Kiểm tra tài khoản có active không
      if (!admin.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa',
        });
      }

      // Gán admin vào req với thông tin role từ admin model (ưu tiên) hoặc token
      req.user = {
        ...admin.toJSON(),
        role: admin.role || userRole,
      };
    } else {
      // Tìm user bằng findByPk
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại',
        });
      }

      // Kiểm tra tài khoản có active không
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa',
        });
      }

      // Gán user vào req với thông tin role từ token
      req.user = {
        ...user.toJSON(),
        role: userRole,
      };
    }
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token đã hết hạn. Vui lòng sử dụng refresh token để lấy token mới',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
    }

    const userRole = req.user.role;
    
    // Hỗ trợ cả 'admin' (từ token) và 'super_admin', 'employee' (từ model)
    // Nếu roles bao gồm 'admin', cho phép cả super_admin và employee
    const allowedRoles = roles.includes('admin') 
      ? [...roles, 'super_admin', 'employee']
      : roles;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này',
      });
    }

    next();
  };
};

// Middleware kiểm tra có phải là admin không (super_admin, employee, hoặc guide)
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Kiểm tra user đã được authenticate chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
    }

    // Kiểm tra role từ admin model (super_admin, employee, hoặc guide)
    // Hoặc role từ token là 'admin' (backward compatibility)
    const userRole = req.user.role;
    
    // Cho phép super_admin, employee, guide, hoặc 'admin' (từ token, sẽ được set từ model trong protect)
    if (userRole === 'super_admin' || userRole === 'employee' || userRole === 'guide' || userRole === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này. Chỉ admin mới có quyền',
      });
    }
  } catch (error: any) {
    console.error("❌ Lỗi trong middleware isAdmin:", error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra quyền admin',
    });
  }
};

// Middleware kiểm tra có phải là super_admin không
export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Kiểm tra user đã được authenticate chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
    }

    // Kiểm tra role từ admin model
    const userRole = req.user.role;
    
    if (userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này. Chỉ super admin mới có quyền',
      });
    }

    // Nếu là super_admin, cho phép tiếp tục
    next();
  } catch (error: any) {
    console.error("❌ Lỗi trong middleware isSuperAdmin:", error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra quyền super admin',
    });
  }
};

