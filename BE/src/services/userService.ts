import { Op } from 'sequelize';
import User from "../models/User";

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
}

class UserService {
  // Lấy danh sách tất cả users (Admin)
  async getAllUsers(page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters?.search) {
      const keyword = `%${filters.search}%`;
      where[Op.or] = [
        { username: { [Op.like]: keyword } },
        { email: { [Op.like]: keyword } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["password_hash"] },
    });

    return {
      users: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Cập nhật thông tin user (Admin)
  async updateUser(userId: number, data: UpdateUserDTO) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Kiểm tra email nếu có thay đổi
    if (data.email && data.email !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email: data.email,
          id: { [Op.ne]: userId }
        },
      });
      if (existingUser) {
        throw new Error("Email đã được sử dụng");
      }
    }

    // Kiểm tra username nếu có thay đổi
    if (data.username && data.username !== user.username) {
      const existingUsername = await User.findOne({
        where: { username: data.username },
      });
      if (existingUsername) {
        throw new Error("Tên người dùng đã được sử dụng");
      }
    }

    // Xây dựng object chứa các field cần update
    const updateData: any = {};
    
    if (data.username !== undefined) {
      updateData.username = data.username;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    if (data.avatar_url !== undefined) {
      updateData.avatar_url = data.avatar_url;
    }
    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active;
    }

    // Nếu không có gì để update
    if (Object.keys(updateData).length === 0) {
      throw new Error("Không có dữ liệu nào để cập nhật");
    }

    // Cập nhật user
    await user.update(updateData);
    await user.reload();

    // Trả về user không có password_hash
    const userResponse: any = user.toJSON();
    delete userResponse.password_hash;

    return userResponse;
  }

  // Lấy tổng số người dùng (Admin)
  async getTotalUsers() {
    const total = await User.count();
    const active = await User.count({ where: { is_active: true } });
    const inactive = await User.count({ where: { is_active: false } });

    return {
      total,
      active,
      inactive,
    };
  }

  // Lấy thông tin profile công khai của user (không cần token)
  async getPublicProfile(identifier: string) {
    // Kiểm tra xem identifier là số (userId) hay chuỗi (username)
    const isNumeric = /^\d+$/.test(identifier);
    
    let user;
    if (isNumeric) {
      // Tìm theo userId
      user = await User.findByPk(parseInt(identifier), {
        attributes: { 
          exclude: ["password_hash"],
        },
      });
    } else {
      // Tìm theo username
      user = await User.findOne({
        where: { username: identifier },
        attributes: { 
          exclude: ["password_hash"],
        },
      });
    }

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Trả về thông tin profile với phone và gender
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };
  }
}

export default new UserService();

