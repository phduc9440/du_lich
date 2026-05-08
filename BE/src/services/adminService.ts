import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import TourGuide from '../models/TourGuide';
import Tour from '../models/Tour';
import Order from '../models/Order';
import User from '../models/User';

class AdminService {
  async getEmployees(
    page: number = 1,
    limit: number = 10,
    search?: string,
    excludeAdminId?: number,
    roles?: string[],
    is_active?: boolean,
    regions?: string[],
    createdAt?: string,
    updatedAt?: string,
  ) {
    const offset = (page - 1) * limit;
    const where: any = {};

    // Filter theo roles - nếu có roles thì filter, không thì lấy tất cả
    if (roles && roles.length > 0) {
      where.role = { [Op.in]: roles };
    } else {
      // Mặc định lấy tất cả roles
      where.role = { [Op.in]: ['super_admin', 'employee', 'guide'] };
    }

    if (excludeAdminId) {
      where.id = { [Op.ne]: excludeAdminId };
    }

    // Filter theo is_active
    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    // Filter theo regions
    if (regions && regions.length > 0) {
      where.region = { [Op.in]: regions };
    }

    if (search) {
      const keyword = `%${search}%`;
      where[Op.or] = [
        { username: { [Op.like]: keyword } },
        { email: { [Op.like]: keyword } },
      ];
    }

    // Build order clause
    const order: any[] = [];
    
    // Sort theo createdAt
    if (createdAt) {
      const direction = createdAt.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      order.push(['created_at', direction]);
    }
    
    // Sort theo updatedAt
    if (updatedAt) {
      const direction = updatedAt.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      order.push(['updated_at', direction]);
    }
    
    // Mặc định sort theo created_at DESC nếu không có sort nào
    if (order.length === 0) {
      order.push(['created_at', 'DESC']);
    }

    const { count, rows } = await Admin.findAndCountAll({
      where,
      limit,
      offset,
      order,
      attributes: { exclude: ['password_hash'] },
    });

    return {
      employees: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Cập nhật vai trò admin (chỉ cho phép 'super_admin', 'employee', 'guide')
  async updateAdminRole(adminId: number, role: 'super_admin' | 'employee' | 'guide') {
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      throw new Error('Admin không tồn tại');
    }

    const allowedRoles: Array<'super_admin' | 'employee' | 'guide'> = ['super_admin', 'employee', 'guide'];
    if (!allowedRoles.includes(role)) {
      throw new Error('Vai trò không hợp lệ');
    }

    await admin.update({ role });
    await admin.reload();

    const adminJson: any = admin.toJSON();
    delete adminJson.password_hash;

    return adminJson;
  }

  // Đặt lại mật khẩu admin (employee hoặc super_admin)
  async updateAdminPassword(adminId: number, newPassword: string) {
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      throw new Error('Admin không tồn tại');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('Mật khẩu mới không hợp lệ');
    }

    if (newPassword.length < 8) {
      throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await admin.update({ password_hash: passwordHash });
    await admin.reload();

    const adminJson: any = admin.toJSON();
    delete adminJson.password_hash;

    return adminJson;
  }

  // Cập nhật trạng thái admin (khóa/mở khóa tài khoản)
  async updateAdminStatus(adminId: number, is_active: boolean) {
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      throw new Error('Admin không tồn tại');
    }

    await admin.update({ is_active });
    await admin.reload();

    const adminJson: any = admin.toJSON();
    delete adminJson.password_hash;

    return adminJson;
  }

  // Cập nhật vùng (region) của admin
  async updateAdminRegion(adminId: number, region: 'northern' | 'central' | 'southern' | null) {
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      throw new Error('Admin không tồn tại');
    }

    // Validate region
    const allowedRegions: Array<'northern' | 'central' | 'southern' | null> = ['northern', 'central', 'southern', null];
    if (region !== null && !allowedRegions.includes(region)) {
      throw new Error('Vùng không hợp lệ. Vui lòng chọn: northern, central, southern hoặc null');
    }

    await admin.update({ region });
    await admin.reload();

    const adminJson: any = admin.toJSON();
    delete adminJson.password_hash;

    return adminJson;
  }

  /**
   * Lấy danh sách tất cả các hướng dẫn viên (guide) với số tour đã hướng dẫn
   * @param page - Số trang
   * @param limit - Số lượng mỗi trang
   * @param search - Tìm kiếm theo username hoặc email
   */
  async getAllGuidesWithTourCount(
    page: number = 1,
    limit: number = 10,
    search?: string
  ) {
    const offset = (page - 1) * limit;
    const where: any = {
      role: 'guide',
      is_active: true,
    };

    if (search) {
      const keyword = `%${search}%`;
      where[Op.or] = [
        { username: { [Op.like]: keyword } },
        { email: { [Op.like]: keyword } },
      ];
    }

    const { count, rows } = await Admin.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password_hash'] },
    });

    // Lấy số tour cho mỗi guide
    const guidesWithTourCount = await Promise.all(
      rows.map(async (admin) => {
        const adminJson: any = admin.toJSON();
        const tourCount = await TourGuide.count({
          where: { guide_id: admin.id },
        });
        return {
          ...adminJson,
          toursNumber: tourCount,
        };
      })
    );

    return {
      guides: guidesWithTourCount,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Lấy danh sách tất cả tours mà guide đã hướng dẫn
   * @param guideId - ID của guide
   */
  async getToursByGuide(guideId: number) {
    // Kiểm tra guide có tồn tại không
    const guide = await Admin.findByPk(guideId);
    if (!guide || guide.role !== 'guide') {
      throw new Error('Hướng dẫn viên không tồn tại');
    }

    // Lấy tất cả tour_guide records của guide
    const tourGuides = await TourGuide.findAll({
      where: {
        guide_id: guideId,
      },
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: [
            'id',
            'tour_code',
            'title',
            'start_date',
            'end_date',
            'main_image',
          ],
          required: true,
        },
      ],
      order: [['start_date', 'DESC']],
    });

    // Map để trả về danh sách tours (có thể trùng lặp)
    const tours = tourGuides.map((tg) => {
      const tourData = tg.toJSON() as any;
      return {
        id: tourData.tour?.id,
        tour_code: tourData.tour?.tour_code,
        title: tourData.tour?.title,
        start_date: tourData.start_date,
        end_date: tourData.end_date,
        tour_start_date: tourData.tour?.start_date,
        tour_end_date: tourData.tour?.end_date,
        main_image: tourData.tour?.main_image,
        guide_id: guideId,
      };
    });

    return tours;
  }

  /**
   * Lấy danh sách đơn hàng của guide trong khoảng thời gian và tour cụ thể
   * @param guideId - ID của guide
   * @param startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param endDate - Ngày kết thúc (YYYY-MM-DD)
   * @param tourId - ID của tour (optional)
   */
  async getOrdersByGuideAndDateRange(
    guideId: number,
    startDate: string,
    endDate: string,
    tourId?: number
  ) {
    // Kiểm tra guide có tồn tại không
    const guide = await Admin.findByPk(guideId);
    if (!guide || guide.role !== 'guide') {
      throw new Error('Hướng dẫn viên không tồn tại');
    }

    const where: any = {
      guide_id: guideId,
      status: { [Op.in]: ['confirmed', 'completed'] },
      [Op.or]: [
        // Order start_date nằm trong khoảng
        {
          start_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        // Order end_date nằm trong khoảng
        {
          end_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        // Order bao phủ toàn bộ khoảng thời gian
        {
          start_date: { [Op.lte]: startDate },
          end_date: { [Op.gte]: endDate },
        },
      ],
    };

    if (tourId) {
      where.tour_id = tourId;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'phone'],
          required: true,
        },
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'tour_code', 'title'],
          required: true,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Map để trả về format phù hợp với frontend
    const orderList = orders.map((order) => {
      const orderData = order.toJSON() as any;
      return {
        id: orderData.id,
        order_code: orderData.order_code,
        customer_name: orderData.user?.username || '',
        phone: orderData.user?.phone || '',
        ticket_quantity: orderData.quantity,
        tour_id: orderData.tour_id,
        tour_code: orderData.tour?.tour_code || '',
        tour_title: orderData.tour?.title || '',
        start_date: orderData.start_date,
        end_date: orderData.end_date,
        total_price: orderData.total_price,
        status: orderData.status,
      };
    });

    return orderList;
  }
}

export default new AdminService();

