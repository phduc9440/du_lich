import Admin from "../models/Admin";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { isValidEmail } from '../utils/validation';
import { Op } from 'sequelize';

export interface AdminLoginDTO {
  email: string;
  password: string;
}

export interface AdminRefreshTokenDTO {
  refreshToken: string;
}

export interface AdminRegisterDTO {
  username: string;
  email: string;
  password: string;
  role?: 'super_admin' | 'employee';
  region?: 'northern' | 'central' | 'southern';
  phone?: string | null;
}

export interface UpdateAdminProfileDTO {
  username?: string;
  email?: string;
  phone?: string;
}

class AdminAuthService {
  // Đăng nhập admin
  async login(data: AdminLoginDTO) {
    // Validation
    if (!data.email || !data.password) {
      throw new Error("Vui lòng nhập đầy đủ email và mật khẩu");
    }

    if (typeof data.email !== "string" || typeof data.password !== "string") {
      throw new Error("Email và mật khẩu phải là chuỗi");
    }

    // Tìm admin
    const admin = await Admin.findOne({
      where: { email: data.email.trim() },
    });

    if (!admin) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Lấy password_hash từ admin instance
    const passwordHash = admin.password_hash || admin.getDataValue("password_hash");

    // Kiểm tra password_hash có tồn tại không
    if (!passwordHash || typeof passwordHash !== "string" || passwordHash.trim() === "") {
      throw new Error("Tài khoản không hợp lệ. Vui lòng liên hệ quản trị viên");
    }

    // Kiểm tra password_hash có đúng format bcrypt không
    if (!passwordHash.startsWith("$2a$") && !passwordHash.startsWith("$2b$")) {
      throw new Error("Tài khoản không hợp lệ. Vui lòng liên hệ quản trị viên");
    }

    // Set password_hash vào admin instance để comparePassword có thể dùng
    if (!admin.password_hash) {
      admin.password_hash = passwordHash;
    }

    // Kiểm tra password sử dụng method comparePassword của model
    const isMatch = await admin.comparePassword(data.password);
    if (!isMatch) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Kiểm tra tài khoản có active không
    const isActive = admin.is_active;
    if (!isActive) {
      throw new Error("Tài khoản admin đã bị vô hiệu hóa");
    }

    // Lấy admin ID
    const adminId = admin.id;
    if (!adminId || typeof adminId !== "number") {
      throw new Error("Lỗi khi tạo token. Vui lòng thử lại");
    }

    // Kiểm tra env vars
    if (!process.env.JWT_SECRET) {
      console.error("ERROR: JWT_SECRET is not configured!");
      throw new Error("Lỗi cấu hình server. Vui lòng liên hệ quản trị viên");
    }

    // Lấy role từ admin model
    const adminRole = admin.role || 'employee';
    
    // Tạo tokens với role từ admin model
    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = generateAccessToken(adminId, 'admin');
      refreshToken = generateRefreshToken(adminId); // Refresh token chỉ chứa id
    } catch (error: any) {
      console.error("ERROR generating tokens:", error.message);
      throw new Error("Lỗi khi tạo token. Vui lòng thử lại");
    }

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: adminRole,
        phone: admin.phone,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh token cho admin
  async refreshToken(refreshToken: string) {
    try {
      // Fallback về JWT_SECRET nếu không có JWT_REFRESH_SECRET
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET is not configured");
      }

      // Verify refresh token
      const decoded: any = jwt.verify(refreshToken, secret);

      // Refresh token chỉ chứa id, không có role
      // Kiểm tra decoded có id không
      if (!decoded || !decoded.id) {
        throw new Error("Refresh token không hợp lệ");
      }

      const adminId = typeof decoded.id === 'number' 
        ? decoded.id 
        : parseInt(String(decoded.id), 10);
      
      if (isNaN(adminId) || adminId <= 0) {
        throw new Error("Refresh token không hợp lệ");
      }

      // Tìm admin theo ID
      const admin = await Admin.findByPk(adminId, {
        attributes: { exclude: ['password_hash'] },
      });

      if (!admin) {
        throw new Error("Admin không tồn tại");
      }

      // Kiểm tra tài khoản có active không
      if (!admin.is_active) {
        throw new Error("Tài khoản admin đã bị vô hiệu hóa");
      }

      // Lấy role từ database (không lấy từ refresh token vì token không chứa role)
      const adminRole = admin.role || 'employee';
      // Tạo access token mới với role = 'admin' (vì đây là adminAuthService)
      const newAccessToken = generateAccessToken(adminId, 'admin');

      return {
        accessToken: newAccessToken,
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token đã hết hạn. Vui lòng đăng nhập lại");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Refresh token không hợp lệ");
      }
      throw error;
    }
  }

  // Lấy thông tin admin theo ID
  async getAdminById(adminId: number) {
    const admin = await Admin.findByPk(adminId, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!admin) {
      throw new Error("Admin không tồn tại");
    }

    return admin;
  }

  // Đăng ký admin mới (chỉ super_admin mới có quyền)
  async register(data: AdminRegisterDTO) {
    // Validation
    if (!data.username || !data.email || !data.password) {
      throw new Error("Vui lòng nhập đầy đủ thông tin");
    }

    if (typeof data.username !== "string" || typeof data.email !== "string" || typeof data.password !== "string") {
      throw new Error("Thông tin không hợp lệ");
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      throw new Error("Email không hợp lệ");
    }

    // Validate password strength (ít nhất 6 ký tự)
    if (data.password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Validate username (ít nhất 3 ký tự)
    if (data.username.trim().length < 3) {
      throw new Error("Tên đăng nhập phải có ít nhất 3 ký tự");
    }

    // Kiểm tra email đã tồn tại chưa
    const existingAdminByEmail = await Admin.findOne({
      where: { email: data.email.trim() },
    });

    if (existingAdminByEmail) {
      throw new Error("Email đã được sử dụng");
    }

    // Validate username không được để trống
    if (!data.username || !data.username.trim()) {
      throw new Error("Tên đăng nhập không được để trống");
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Xác định role hợp lệ ('super_admin' | 'employee' | 'guide'), mặc định là 'employee'
    const allowedRoles: Array<'super_admin' | 'employee' | 'guide'> = ['super_admin', 'employee', 'guide'];
    const normalizedRole = (data.role as string | undefined)?.trim() as 'super_admin' | 'employee' | 'guide' | undefined;
    const finalRole: 'super_admin' | 'employee' | 'guide' =
      normalizedRole && allowedRoles.includes(normalizedRole) ? normalizedRole : 'employee';

    // Xác định region hợp lệ ('northern' | 'central' | 'southern'), mặc định là 'northern'
    const allowedRegions: Array<'northern' | 'central' | 'southern'> = ['northern', 'central', 'southern'];
    const normalizedRegion = (data.region as string | undefined)?.trim() as 'northern' | 'central' | 'southern' | undefined;
    const finalRegion: 'northern' | 'central' | 'southern' =
      normalizedRegion && allowedRegions.includes(normalizedRegion) ? normalizedRegion : 'northern';

    // Tạo admin mới với role và region đã xác định
    const newAdmin = await Admin.create({
      username: data.username.trim(),
      email: data.email.trim(),
      password_hash: passwordHash,
      role: finalRole,
      region: finalRegion,
      phone: data.phone ? data.phone.trim() : null,
      is_active: true,
    });

    // Trả về thông tin admin (không bao gồm password_hash)
    return {
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role,
      region: newAdmin.region,
      phone: newAdmin.phone,
      is_active: newAdmin.is_active,
      created_at: newAdmin.created_at,
    };
  }

  // Cập nhật profile admin (username, email, phone)
  async updateProfile(adminId: number, data: UpdateAdminProfileDTO) {
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      throw new Error("Admin không tồn tại");
    }

    // Kiểm tra email nếu có thay đổi
    if (data.email && data.email !== admin.email) {
      const existingAdmin = await Admin.findOne({
        where: { 
          email: data.email.trim(),
          id: { [Op.ne]: adminId }
        },
      });
      if (existingAdmin) {
        throw new Error("Email đã được sử dụng");
      }
    }

    // Validate username không được để trống nếu có thay đổi
    if (data.username !== undefined) {
      if (!data.username || !data.username.trim()) {
        throw new Error("Tên đăng nhập không được để trống");
      }
    }

    // Validate email format nếu có email
    if (data.email && !isValidEmail(data.email)) {
      throw new Error("Email không hợp lệ");
    }

    // Xây dựng object chứa các field cần update
    const updateData: any = {};
    
    if (data.username) {
      updateData.username = data.username.trim();
    }
    if (data.email) {
      updateData.email = data.email.trim();
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone ? data.phone.trim() : null;
    }

    // Nếu không có gì để update
    if (Object.keys(updateData).length === 0) {
      throw new Error("Không có dữ liệu nào để cập nhật");
    }

    // Sử dụng update() method để đảm bảo lưu vào database
    const [affectedRows] = await Admin.update(updateData, {
      where: { id: adminId },
    });

    // Kiểm tra xem có row nào được update không
    if (affectedRows === 0) {
      throw new Error("Không thể cập nhật thông tin. Vui lòng thử lại.");
    }

    // Reload admin để lấy dữ liệu mới nhất từ database
    await admin.reload();

    // Lấy giá trị từ dataValues để tránh vấn đề với public class fields
    const adminIdValue = admin.getDataValue('id');
    const usernameValue = admin.getDataValue('username');
    const emailValue = admin.getDataValue('email');
    const phoneValue = admin.getDataValue('phone');
    const roleValue = admin.getDataValue('role');
    const regionValue = admin.getDataValue('region');

    return {
      id: adminIdValue,
      username: usernameValue,
      email: emailValue,
      phone: phoneValue,
      role: roleValue,
      region: regionValue,
    };
  }
}

export default new AdminAuthService();

