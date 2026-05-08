import Coupon from "../models/Coupon";
import UsedCoupon from "../models/UsedCoupon";
import { Op } from "sequelize";
import notificationService from "./notificationService";

class CouponService {
  // Tìm kiếm mã giảm giá theo code
  async getCouponByCode(code: string) {
    if (!code || code.trim() === "") {
      throw new Error("Vui lòng nhập mã giảm giá");
    }

    // Tìm mã giảm giá theo code và chỉ lấy mã còn hoạt động
    const coupon = await Coupon.findOne({
      where: {
        code: {
          [Op.like]: code.trim(),
        },
        is_active: true, // Chỉ lấy mã giảm giá còn hoạt động
      },
    });

    if (!coupon) {
      throw new Error("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa");
    }

    // Kiểm tra mã giảm giá đã hết hạn chưa
    if (coupon.expire_at) {
      const expireDate = new Date(coupon.expire_at);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (expireDate < currentDate) {
        throw new Error("Mã giảm giá đã hết hạn");
      }
    }

    // Kiểm tra số lần sử dụng còn lại
    if (coupon.max_use <= 0) {
      throw new Error("Mã giảm giá đã hết lượt sử dụng");
    }

    return coupon;
  }

  // Kiểm tra coupon đã được sử dụng cho order này chưa
  async checkCouponUsedForOrder(
    couponId: number,
    orderId: number
  ): Promise<boolean> {
    const usedCoupon = await UsedCoupon.findOne({
      where: {
        coupon_id: couponId,
        order_id: orderId,
      },
    });

    return !!usedCoupon;
  }

  // Lưu used_coupon khi áp dụng coupon cho order
  async markCouponAsUsed(couponId: number, orderId: number) {
    // Kiểm tra đã sử dụng chưa
    const alreadyUsed = await this.checkCouponUsedForOrder(couponId, orderId);
    if (alreadyUsed) {
      throw new Error("Mã giảm giá đã được sử dụng cho đơn hàng này");
    }

    // Tạo used_coupon record
    const usedCoupon = await UsedCoupon.create({
      coupon_id: couponId,
      order_id: orderId,
    });

    return usedCoupon;
  }

  // Lấy số lần sử dụng của coupon
  async getCouponUsageCount(couponId: number): Promise<number> {
    return await UsedCoupon.count({
      where: { coupon_id: couponId },
    });
  }

  // Lấy tất cả mã giảm giá (Admin)
  async getAllCoupons(page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;
    const where: any = {};

    // Filter theo trạng thái active/inactive
    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Search theo mã (tìm kiếm theo code) - ưu tiên search nếu có
    if (filters?.search) {
      where.code = {
        [Op.like]: `%${filters.search}%`,
      };
    } else if (filters?.code) {
      // Filter theo code (exact match hoặc partial match) nếu không có search
      where.code = {
        [Op.like]: `%${filters.code}%`,
      };
    }

    const { rows: coupons, count: total } = await Coupon.findAndCountAll({
      where,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy chi tiết mã giảm giá theo ID (Admin)
  async getCouponById(id: number) {
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new Error("Mã giảm giá không tồn tại");
    }

    return coupon;
  }

  // Tạo mã giảm giá mới (Admin)
  async createCoupon(
    adminId: number,
    data: {
      code: string;
      description?: string;
      discount_percent?: number;
      discount_amount?: number;
      expire_at?: Date;
      max_use?: number;
      discount_limit: number;
    }
  ) {
    // Normalize code: trim và uppercase để so sánh
    const normalizedCode = data.code.trim().toUpperCase();
    
    // Kiểm tra mã giảm giá đã tồn tại chưa (case-insensitive)
    const existingCoupon = await Coupon.findOne({
      where: { 
        code: normalizedCode 
      },
    });

    if (existingCoupon) {
      throw new Error(`Mã giảm giá "${normalizedCode}" đã tồn tại`);
    }

    // Validate: phải có discount_percent hoặc discount_amount (ít nhất 1 trong 2)
    const hasDiscountPercent =
      data.discount_percent !== undefined && data.discount_percent !== null;
    const hasDiscountAmount =
      data.discount_amount !== undefined && data.discount_amount !== null;

    if (!hasDiscountPercent && !hasDiscountAmount) {
      throw new Error(
        "Vui lòng nhập phần trăm giảm giá hoặc số tiền giảm giá (ít nhất 1 trong 2)"
      );
    }

    // Validate: không được có cả 2 loại giảm giá
    if (hasDiscountPercent && hasDiscountAmount) {
      throw new Error(
        "Chỉ được chọn một loại giảm giá (phần trăm hoặc số tiền)"
      );
    }

    // Validate discount_percent nếu có
    if (
      hasDiscountPercent &&
      (data.discount_percent! < 0 || data.discount_percent! > 100)
    ) {
      throw new Error("Phần trăm giảm giá phải từ 0 đến 100");
    }

    // Validate discount_amount nếu có
    if (hasDiscountAmount && data.discount_amount! < 0) {
      throw new Error("Số tiền giảm giá phải là số dương");
    }

    const coupon = await Coupon.create({
      code: normalizedCode, // Sử dụng normalized code
      description: data.description,
      discount_percent: hasDiscountPercent ? data.discount_percent : undefined,
      discount_amount: hasDiscountAmount ? data.discount_amount : undefined,
      expire_at: data.expire_at,
      max_use: data.max_use || 100, // Mặc định 100 nếu không có
      discount_limit: data.discount_limit,
      is_active: true,
    });

    let expireAtFormatted = "";
    if (data.expire_at) {
      const d = new Date(data.expire_at);
      expireAtFormatted = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    }

    await notificationService.sendNotificationToAllUsers(adminId, {
      title: "Mã giảm giá mới!",
      message: `Mã giảm giá mới ${data.code} , giảm ${
        data.discount_amount
          ? data.discount_amount + " VND"
          : data.discount_percent + "%"
      }. ${expireAtFormatted ? `Hạn sử dụng tới ${expireAtFormatted} nhanh tay sử dụng ngay!` : "Nhanh tay sử dụng ngay!"}`,
      type: "promotion",
    });
    return coupon;
  }

  // Cập nhật mã giảm giá (Admin)
  async updateCoupon(
    id: number,
    data: {
      code?: string;
      description?: string;
      discount_percent?: number;
      discount_amount?: number;
      expire_at?: Date;
      max_use?: number;
      is_active?: boolean;
      discount_limit?: number;
    }
  ) {
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new Error("Mã giảm giá không tồn tại");
    }

    // Nếu cập nhật code, kiểm tra xem code mới đã tồn tại chưa
    if (data.code && data.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        where: { code: data.code },
      });

      if (existingCoupon) {
        throw new Error("Mã giảm giá đã tồn tại");
      }
    }

    // Kiểm tra nếu có discount_percent hoặc discount_amount trong data
    const hasDiscountPercent = data.discount_percent !== undefined;
    const hasDiscountAmount = data.discount_amount !== undefined;

    // Nếu có cả 2 loại giảm giá trong data (cả 2 đều được gửi)
    if (hasDiscountPercent && hasDiscountAmount) {
      // Nếu cả 2 đều có giá trị (không null và không undefined)
      if (
        data.discount_percent !== null &&
        data.discount_percent !== undefined &&
        data.discount_amount !== null &&
        data.discount_amount !== undefined
      ) {
        throw new Error(
          "Chỉ được chọn một loại giảm giá (phần trăm hoặc số tiền)"
        );
      }
    }

    // Nếu chỉ có discount_percent trong data, tự động xóa discount_amount
    if (hasDiscountPercent && !hasDiscountAmount) {
      (data as any).discount_amount = null;
    }

    // Nếu chỉ có discount_amount trong data, tự động xóa discount_percent
    if (hasDiscountAmount && !hasDiscountPercent) {
      (data as any).discount_percent = null;
    }

    // Validate discount_percent nếu có giá trị
    if (
      hasDiscountPercent &&
      data.discount_percent !== undefined &&
      data.discount_percent !== null
    ) {
      if (data.discount_percent < 0 || data.discount_percent > 100) {
        throw new Error("Phần trăm giảm giá phải từ 0 đến 100");
      }
    }

    // Validate discount_amount nếu có giá trị
    if (
      hasDiscountAmount &&
      data.discount_amount !== undefined &&
      data.discount_amount !== null
    ) {
      if (data.discount_amount < 0) {
        throw new Error("Số tiền giảm giá phải là số dương");
      }
    }

    // Kiểm tra sau khi update, coupon vẫn phải có ít nhất 1 trong 2 loại giảm giá
    const finalDiscountPercent = hasDiscountPercent
      ? data.discount_percent
      : coupon.discount_percent;
    const finalDiscountAmount = hasDiscountAmount
      ? data.discount_amount
      : coupon.discount_amount;

    if (!finalDiscountPercent && !finalDiscountAmount) {
      throw new Error(
        "Mã giảm giá phải có phần trăm giảm giá hoặc số tiền giảm giá (ít nhất 1 trong 2)"
      );
    }

    await coupon.update(data);

    return coupon;
  }

  // Xóa mã giảm giá (Admin)
  async deleteCoupon(id: number) {
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      throw new Error("Mã giảm giá không tồn tại");
    }

    await coupon.destroy();

    return { message: "Xóa mã giảm giá thành công" };
  }

  // Xóa mã giảm giá vĩnh viễn (Hard Delete - xóa hoàn toàn khỏi database)
  async hardDeleteCoupon(id: number) {
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại');
    }

    // Xóa tất cả dữ liệu liên quan trước
    await UsedCoupon.destroy({ where: { coupon_id: id } });

    // Xóa mã giảm giá chính
    await coupon.destroy();
    
    return { message: 'Xóa mã giảm giá vĩnh viễn thành công (hard delete)' };
  }
}

export default new CouponService();
