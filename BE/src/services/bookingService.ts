import Order from '../models/Order';
import Tour from '../models/Tour';
import User from '../models/User';
import Ticket from '../models/Ticket';
import Coupon from '../models/Coupon';
import UsedCoupon from '../models/UsedCoupon';
import TourGuide from '../models/TourGuide';
import Feedback from '../models/Feedback';
import Admin from '../models/Admin';
import sequelize from '../config/database';
import { QueryTypes, Op, Transaction } from 'sequelize';
import paymentService from './paymentService';
import couponService from './couponService';
import notificationService from './notificationService';
import ticketService from './ticketService';
import tourGuideAssignmentService from './tourGuideAssignmentService';
import { sendCancellationEmail } from './emailService';
export interface CreateBookingDTO {
  user_id: number;
  tour_id: number;
  quantity: number;
  coupon_id?: number;
}

class BookingService {
  // Helper function để tìm tour với fallback cho BIGINT
  private async findTourById(
    tourId: number,
    options?: { transaction?: Transaction; lockForUpdate?: boolean }
  ): Promise<Tour | null> {
    // Đảm bảo tourId là number
    const id = Number(tourId);
    if (isNaN(id) || id <= 0) {
      return null;
    }

    const shouldLock = Boolean(options?.transaction && options?.lockForUpdate);

    // Thử tìm bằng findByPk trước
    let tour = await Tour.findByPk(id, {
      transaction: options?.transaction,
      lock: shouldLock && options?.transaction ? options.transaction.LOCK.UPDATE : undefined,
    });

    if (tour) {
      return tour;
    }

    // Nếu không tìm thấy, thử dùng raw query với nhiều cách (vì Sequelize có thể có vấn đề với BIGINT)
    try {
      // Thử với number
      const resultsAny: any = await sequelize.query(
        `SELECT * FROM tours WHERE id = :id LIMIT 1${shouldLock ? ' FOR UPDATE' : ''}`,
        {
          replacements: { id: id },
          type: QueryTypes.SELECT,
          transaction: options?.transaction,
        }
      );

      let results: any[] = [];
      if (Array.isArray(resultsAny)) {
        results = resultsAny;
      } else if (Array.isArray(resultsAny[0])) {
        results = resultsAny[0];
      } else if (resultsAny && resultsAny.length > 0) {
        results = resultsAny;
      }

      if (results && results.length > 0) {
        return Tour.build(results[0] as any, { isNewRecord: false });
      }

      // Thử với string
      const results2Any: any = await sequelize.query(
        `SELECT * FROM tours WHERE id = :id LIMIT 1${shouldLock ? ' FOR UPDATE' : ''}`,
        {
          replacements: { id: String(id) },
          type: QueryTypes.SELECT,
          transaction: options?.transaction,
        }
      );

      let results2: any[] = [];
      if (Array.isArray(results2Any)) {
        results2 = results2Any;
      } else if (Array.isArray(results2Any[0])) {
        results2 = results2Any[0];
      } else if (results2Any && results2Any.length > 0) {
        results2 = results2Any;
      }

      if (results2 && results2.length > 0) {
        return Tour.build(results2[0] as any, { isNewRecord: false });
      }

      // Thử với CAST
      const results3Any: any = await sequelize.query(
        `SELECT * FROM tours WHERE CAST(id AS UNSIGNED) = CAST(:id AS UNSIGNED) LIMIT 1${
          shouldLock ? ' FOR UPDATE' : ''
        }`,
        {
          replacements: { id: String(id) },
          type: QueryTypes.SELECT,
          transaction: options?.transaction,
        }
      );

      let results3: any[] = [];
      if (Array.isArray(results3Any)) {
        results3 = results3Any;
      } else if (Array.isArray(results3Any[0])) {
        results3 = results3Any[0];
      } else if (results3Any && results3Any.length > 0) {
        results3 = results3Any;
      }

      if (results3 && results3.length > 0) {
        return Tour.build(results3[0] as any, { isNewRecord: false });
      }
    } catch (error) {
      console.error('Error in findTourById raw query:', error);
    }

    return null;
  }

  private async restoreTourCapacityForBooking(
    booking: Order,
    transaction: Transaction
  ) {
    try {
      const quantityRaw = booking.getDataValue
        ? booking.getDataValue('quantity')
        : booking.quantity;
      const quantity = Number(quantityRaw);

      if (isNaN(quantity) || quantity <= 0) {
        return;
      }

      const tourIdRaw = booking.getDataValue
        ? booking.getDataValue('tour_id')
        : booking.tour_id;
      const tourId = Number(tourIdRaw);

      if (isNaN(tourId) || tourId <= 0) {
        console.warn(`⚠️ Không thể hoàn slot vì tour_id không hợp lệ cho booking #${booking.id}`);
        return;
      }

      const tour = await this.findTourById(tourId, {
        transaction,
        lockForUpdate: true,
      });

      if (!tour) {
        console.warn(`⚠️ Không tìm thấy tour #${tourId} để hoàn slot cho booking #${booking.id}`);
        return;
      }

      const currentCapacityRaw = (tour as any).capacity ?? tour.getDataValue?.('capacity');
      const currentCapacity = Number(currentCapacityRaw);

      // Tính ticket_solded từ orders (thay thế cho trường ticket_solded đã xóa)
      const currentTicketSoldResult = await Order.sum('quantity', {
        where: {
          tour_id: tourId,
          status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
        },
        transaction
      });
      const currentTicketSold = Number(currentTicketSoldResult || 0);

      if (isNaN(currentCapacity)) {
        throw new Error('Sức chứa của tour không hợp lệ');
      }

      const restoredTicketSold = Math.max(0, currentTicketSold - quantity);

      const updateData: any = {};

      // Nếu vẫn còn slot thì bật lại tour
      // updateData.is_active = restoredTicketSold < currentCapacity;

      // await Tour.update(updateData as any, {
      //   where: { id: tour.id },
      //   transaction,
      // });
    } catch (error: any) {
      console.error(
        `❌ Lỗi khi hoàn slot tour cho booking #${booking.id}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Kiểm tra xem có guide nào còn rảnh (không trùng lịch) cho tour này không
   * @param tourId - ID của tour
   * @returns true nếu có ít nhất 1 guide rảnh, false nếu không có guide nào rảnh
   */
  private async checkAvailableGuides(tourId: number): Promise<boolean> {
    try {
      // Sử dụng service để lấy danh sách guides có thể phân công
      const availableGuides = await tourGuideAssignmentService.getAvailableGuidesForTour(tourId);
      
      // Kiểm tra xem có guide nào có thể được phân công (canAssign = true)
      // canAssign = true nghĩa là guide không có tour trùng lịch hoặc rảnh trước ngày bắt đầu tour
      const freeGuides = availableGuides.filter(guideInfo => guideInfo.canAssign === true);
      
      return freeGuides.length > 0;
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra guide rảnh:', error.message);
      // Nếu có lỗi, trả về false để an toàn (không cho tạo đơn hàng)
      return false;
    }
  }

  // Tạo booking mới (order)
  async createBooking(data: CreateBookingDTO) {
    // Đảm bảo tour_id là number
    const tourId = Number(data.tour_id);
    if (isNaN(tourId) || tourId <= 0) {
      throw new Error('ID tour không hợp lệ');
    }

    // Đảm bảo user_id là number
    const userId = Number(data.user_id);
    if (isNaN(userId) || userId <= 0) {
      throw new Error('ID người dùng không hợp lệ');
    }

    // Đảm bảo quantity hợp lệ
    const quantity = Number(data.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error('Số lượng vé phải là số dương');
    }

    // Kiểm tra user tồn tại
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // Xử lý coupon nếu có
    let coupon = null;
    if (data.coupon_id) {
      const couponId = Number(data.coupon_id);
      if (isNaN(couponId) || couponId <= 0) {
        throw new Error('ID coupon không hợp lệ');
      }

      // Lấy coupon và validate
      coupon = await Coupon.findByPk(couponId);
      if (!coupon) {
        throw new Error('Mã giảm giá không tồn tại');
      }

      // Kiểm tra coupon còn hoạt động
      // Lấy is_active từ dataValues nếu cần (MySQL có thể trả về 1/0 (number) hoặc true/false (boolean))
      let isActive: any = coupon.is_active !== undefined
        ? coupon.is_active
        : coupon.getDataValue("is_active");
      
      // Xử lý cả trường hợp number (0/1) và boolean (true/false)
      if (isActive === undefined || isActive === null) {
        // Nếu không có giá trị, mặc định là false (không active)
        isActive = false;
      }
      
      // Chuyển đổi về boolean: 0, false, null, undefined -> false; còn lại -> true
      const isActiveBoolean = 
        isActive === true || 
        isActive === 1 || 
        (typeof isActive === 'number' && isActive !== 0) || 
        (typeof isActive === 'string' && isActive === '1');
      
      if (!isActiveBoolean) {
        throw new Error('Mã giảm giá đã bị vô hiệu hóa');
      }

      // Kiểm tra coupon đã hết hạn chưa
      if (coupon.expire_at) {
        const expireDate = new Date(coupon.expire_at);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        if (expireDate < currentDate) {
          throw new Error('Mã giảm giá đã hết hạn');
        }
      }

      // Kiểm tra số lần sử dụng còn lại
      // Lấy max_use từ dataValues nếu cần (MySQL có thể trả về number hoặc string)
      let maxUse: any = coupon.max_use !== undefined
        ? coupon.max_use
        : coupon.getDataValue("max_use");
      
      // Chuyển đổi về number
      const maxUseNumber = Number(maxUse);
      if (isNaN(maxUseNumber)) {
        throw new Error('Mã giảm giá có số lượt sử dụng không hợp lệ');
      }
      
      if (maxUseNumber === 0) {
        throw new Error('Mã giảm giá đã hết lượt sử dụng');
      }
    }

    const transaction = await sequelize.transaction();
    let booking: Order | null = null;
    let totalPrice = 0;

    try {
      // Khóa bản ghi tour để kiểm tra và cập nhật capacity tránh overbooking
      const lockedTour = await this.findTourById(tourId, {
        transaction,
        lockForUpdate: true,
      });

      if (!lockedTour) {
        throw new Error(`Tour không tồn tại với ID: ${tourId}`);
      }

      const tourPrice = (lockedTour as any).price || lockedTour.getDataValue?.('price') || 0;
      totalPrice = Number(tourPrice) * quantity;

      if (coupon) {
      if (coupon.discount_percent) {
        const discountAmount = (totalPrice * coupon.discount_percent) / 100;
        totalPrice = totalPrice - discountAmount;
      } else if (coupon.discount_amount) {
        const discountAmount = Number(coupon.discount_amount);
          totalPrice = Math.max(0, totalPrice - discountAmount);
      }

      totalPrice = Math.round(totalPrice * 100) / 100;
    }

      const MIN_PAYMENT_AMOUNT = 10_000;
      const MAX_PAYMENT_AMOUNT = 50_000_000;

      if (totalPrice < MIN_PAYMENT_AMOUNT) {
        throw new Error('Tổng tiền phải tối thiểu 10.000 VND để tạo thanh toán MoMo');
      }

      if (totalPrice > MAX_PAYMENT_AMOUNT) {
        throw new Error('Tổng tiền vượt quá giới hạn 50.000.000 VND của MoMo');
      }

      const tourStartDate = (lockedTour as any).start_date || lockedTour.getDataValue?.('start_date');
      const tourEndDate = (lockedTour as any).end_date || lockedTour.getDataValue?.('end_date');

    if (!tourStartDate || !tourEndDate) {
      throw new Error('Tour không có thông tin ngày bắt đầu và kết thúc');
    }

    // Kiểm tra tour phải còn ít nhất 2 ngày trước khi bắt đầu
    // Format date theo giờ Việt Nam để tránh lỗi múi giờ
    const formatLocalDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = formatLocalDate(today);
    
    const tourStartDateObj = typeof tourStartDate === 'string' ? new Date(tourStartDate) : tourStartDate;
    const tourStartDateString = formatLocalDate(tourStartDateObj);

    // Tính số ngày còn lại từ hôm nay đến tour.start_date
    const todayTime = today.getTime();
    const tourStartTime = tourStartDateObj.getTime();
    const daysDifference = Math.ceil((tourStartTime - todayTime) / (1000 * 60 * 60 * 24));

    // Nếu tour bắt đầu trong vòng 2 ngày thì không cho đặt
    if (daysDifference < 2) {
      throw new Error(`Không thể đặt tour này do không còn hướng dẫn viên rảnh. Tour sẽ bắt đầu vào ngày ${tourStartDateString}, chỉ còn ${daysDifference} ngày. Vui lòng đặt tour trước ít nhất 2 ngày.`);
    }

    // Kiểm tra xem có guide nào còn rảnh (không trùng lịch) cho tour này không
    const hasAvailableGuide = await this.checkAvailableGuides(tourId);
    if (!hasAvailableGuide) {
      // Tự động tạo feedback cho nhân viên về vấn đề không có guide rảnh
      try {
        // Lấy thông tin tour để đưa vào feedback
        const tourTitle = (lockedTour as any).title || lockedTour.getDataValue?.('title') || 'Tour';
        const tourCode = (lockedTour as any).tour_code || lockedTour.getDataValue?.('tour_code') || tourId.toString();
        const tourStartDate = (lockedTour as any).start_date || lockedTour.getDataValue?.('start_date');
        const tourEndDate = (lockedTour as any).end_date || lockedTour.getDataValue?.('end_date');
        
        // Format ngày để hiển thị
        const formatDate = (date: Date | string | null): string => {
          if (!date) return 'N/A';
          const d = typeof date === 'string' ? new Date(date) : date;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${day}/${month}/${year}`;
        };
        
        const startDateStr = formatDate(tourStartDate);
        const endDateStr = formatDate(tourEndDate);
        
        // Kiểm tra xem đã có feedback về tour này trong vòng 5 phút gần đây chưa (tránh tạo trùng)
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        // Tìm feedback có chứa tour code trong message và được tạo trong 5 phút gần đây
        const existingFeedback = await Feedback.findOne({
          where: {
            [Op.and]: [
              { title: { [Op.like]: '%Tour không thể phân công hướng dẫn viên%' } },
              { message: { [Op.like]: `%${tourCode}%` } },
              { created_at: { [Op.gte]: fiveMinutesAgo } }
            ]
          },
        });
        
        // Nếu đã có feedback về tour này trong 5 phút gần đây, không tạo lại
        if (existingFeedback) {
          console.log(`Lỗi tạo feedback #${tourId} (${tourCode}), bỏ qua tạo feedback trùng. Feedback ID: ${existingFeedback.id}`);
        } else {
          // Tìm admin đầu tiên để gán feedback (hoặc để null nếu không tìm thấy)
          const firstAdmin = await Admin.findOne({
            where: {
              role: { [Op.in]: ['admin', 'super_admin'] },
              is_active: true,
            },
            order: [['id', 'ASC']],
          });
          
          // Tạo feedback tự động
          const feedbackTitle = `Cảnh báo: Tour không thể phân công hướng dẫn viên`;
          const feedbackMessage = `Tour "${tourTitle}" (Mã tour: ${tourCode}) không thể được phân công hướng dẫn viên do hiện tại không còn hướng dẫn viên nào rảnh cho khoảng thời gian từ ${startDateStr} đến ${endDateStr}. Vui lòng kiểm tra và phân công hướng dẫn viên thủ công hoặc điều chỉnh lịch trình tour.`;
          
          const newFeedback = await Feedback.create({
            user_id: firstAdmin?.id || null, // Gán cho admin đầu tiên hoặc null (feedback hệ thống)
            title: feedbackTitle,
            message: feedbackMessage,
            status: 'pending',
          });
        }
      } catch (feedbackError: any) {
        // Không throw error nếu tạo feedback thất bại, chỉ log
        console.error('❌ Lỗi khi tạo feedback tự động:', feedbackError.message);
        console.error('❌ Chi tiết lỗi:', feedbackError);
      }
      
      throw new Error('Hiện tại đang không có hướng dẫn viên. Vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.');
    }

      const tourCapacityRaw = (lockedTour as any).capacity ?? lockedTour.getDataValue?.('capacity');
      const currentCapacity = Number(tourCapacityRaw);

      if (isNaN(currentCapacity)) {
        throw new Error('Sức chứa của tour không hợp lệ');
      }

      // Tính ticket_solded từ orders (thay thế cho trường ticket_solded đã xóa)
      const currentTicketSoldResult = await Order.sum('quantity', {
        where: {
          tour_id: tourId,
          status: { [Op.in]: ['pending', 'confirmed', 'completed'] }
        },
        transaction
      });
      const currentTicketSold = Number(currentTicketSoldResult || 0);

      if (isNaN(currentTicketSold)) {
        throw new Error('Số vé đã bán của tour không hợp lệ');
      }

      const remainingSlots = currentCapacity - currentTicketSold;

      if (remainingSlots <= 0) {
        throw new Error('Tour đã hết chỗ, không thể tạo đơn hàng mới');
      }

      if (quantity > remainingSlots) {
        throw new Error(`Số lượng vé còn lại của tour chỉ còn ${remainingSlots}`);
      }

      booking = await Order.create(
        {
      user_id: userId,
      tour_id: tourId,
      quantity: quantity,
      total_price: totalPrice,
      status: 'pending',
      start_date: new Date(tourStartDate),
      end_date: new Date(tourEndDate),
          payment_url: 'pending',
      is_paid: false,
      is_review: false,
        },
        { transaction }
      );

      const updatedTicketSold = currentTicketSold + quantity;

      // Không tự động ẩn tour khi hết vé - để frontend tự filter bằng bộ lọc
      // Chỉ cập nhật ticket_solded, giữ nguyên is_active
      await Tour.update(
        {
          ticket_solded: updatedTicketSold,
          // Không cập nhật is_active - để frontend tự filter
        } as any,
        {
          where: { id: lockedTour.id },
          transaction,
        }
      );

      await transaction.commit();
    } catch (error: any) {
      await transaction.rollback();
      
      // Xử lý lỗi unique constraint cho order_code (có thể trùng do trigger)
      if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeDatabaseError') {
        // Kiểm tra nếu là lỗi duplicate key cho order_code
        const errorMessage = error.message || '';
        if (errorMessage.includes('order_code') || errorMessage.includes('Duplicate entry')) {
          // Retry tạo order với order_code mới (trigger sẽ tự động tạo lại)
          // Chỉ retry 1 lần để tránh vòng lặp vô hạn
          try {
            const retryTransaction = await sequelize.transaction();
            const retryLockedTour = await this.findTourById(tourId, {
              transaction: retryTransaction,
              lockForUpdate: true,
            });

            if (!retryLockedTour) {
              throw new Error(`Tour không tồn tại với ID: ${tourId}`);
            }

            const retryTourPrice = (retryLockedTour as any).price || retryLockedTour.getDataValue?.('price') || 0;
            let retryTotalPrice = Number(retryTourPrice) * quantity;

            if (coupon) {
              if (coupon.discount_percent) {
                const discountAmount = (retryTotalPrice * coupon.discount_percent) / 100;
                retryTotalPrice = retryTotalPrice - discountAmount;
              } else if (coupon.discount_amount) {
                const discountAmount = Number(coupon.discount_amount);
                retryTotalPrice = Math.max(0, retryTotalPrice - discountAmount);
              }
              retryTotalPrice = Math.round(retryTotalPrice * 100) / 100;
            }

            const retryTourStartDate = (retryLockedTour as any).start_date || retryLockedTour.getDataValue?.('start_date');
            const retryTourEndDate = (retryLockedTour as any).end_date || retryLockedTour.getDataValue?.('end_date');

            if (!retryTourStartDate || !retryTourEndDate) {
              throw new Error('Tour không có thông tin ngày bắt đầu và kết thúc');
            }

            const retryTourCapacityRaw = (retryLockedTour as any).capacity ?? retryLockedTour.getDataValue?.('capacity');
            const retryCurrentCapacity = Number(retryTourCapacityRaw);
            const retryTourTicketSoldRaw = (retryLockedTour as any).ticket_solded ?? (retryLockedTour as any).getDataValue?.('ticket_solded') ?? 0;
            const retryCurrentTicketSold = Number(retryTourTicketSoldRaw);
            const retryRemainingSlots = retryCurrentCapacity - retryCurrentTicketSold;

            if (quantity > retryRemainingSlots) {
              throw new Error(`Số lượng vé còn lại của tour chỉ còn ${retryRemainingSlots}`);
            }

            // Tạo order với order_code được generate tự động bởi trigger (có thể khác lần trước)
            booking = await Order.create(
              {
                user_id: userId,
                tour_id: tourId,
                quantity: quantity,
                total_price: retryTotalPrice,
                status: 'pending',
                start_date: new Date(retryTourStartDate),
                end_date: new Date(retryTourEndDate),
                payment_url: 'pending',
                is_paid: false,
                is_review: false,
              },
              { transaction: retryTransaction }
            );

            // const retryUpdatedTicketSold = retryCurrentTicketSold + quantity;
            // const retryIsActiveAfterUpdate = retryUpdatedTicketSold < retryCurrentCapacity;

            // await Tour.update(
            //   {
            //     ticket_solded: retryUpdatedTicketSold,
            //     is_active: retryIsActiveAfterUpdate,
            //   } as any,
            //   {
            //     where: { id: retryLockedTour.id },
            //     transaction: retryTransaction,
            //   }
            // );

            await retryTransaction.commit();
          } catch (retryError: any) {
            // Nếu retry vẫn lỗi, throw lỗi gốc
            throw new Error('Lỗi khi tạo đơn hàng. Vui lòng thử lại.');
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (!booking) {
      throw new Error('Lỗi khi tạo booking');
    }

    // Lấy lại booking từ database để đảm bảo có đầy đủ thông tin bao gồm id và order_code
    const savedBooking = await Order.findByPk(booking.id);
    
    if (!savedBooking) {
      throw new Error('Lỗi khi tạo booking');
    }

    // Tự động tạo payment URL từ MoMo ngay sau khi tạo order
    // Vì đã có order_id và đầy đủ thông tin để tính toán
    const orderInfo = `Thanh toán đơn hàng ${savedBooking.order_code || savedBooking.id}`;
    const paymentInfo = await paymentService.createPayment({
      orderId: savedBooking.id,
      amount: totalPrice,
      orderInfo: orderInfo,
    });

    // Cập nhật payment_url với URL chính xác từ MoMo
    await savedBooking.update({ payment_url: paymentInfo.payUrl });
    
    // Xử lý coupon: giảm max_use và tạo record trong used_coupons
    if (coupon) {
      try {
        // Lấy coupon_id từ dataValues nếu cần (tránh undefined)
        const couponId = coupon.id || coupon.getDataValue("id");
        if (!couponId) {
          throw new Error('Không thể lấy ID của coupon');
        }

        // Reload coupon để đảm bảo có dữ liệu mới nhất từ database
        await coupon.reload();
        
        // Lấy max_use từ dataValues sau khi reload
        let maxUse: any = coupon.max_use !== undefined
          ? coupon.max_use
          : coupon.getDataValue("max_use");
        
        // Chuyển đổi về number
        const maxUseNumber = Number(maxUse);
        if (isNaN(maxUseNumber)) {
          throw new Error('Mã giảm giá có số lượt sử dụng không hợp lệ');
        }
        
        // Kiểm tra lại max_use trước khi giảm (tránh race condition)
        if (maxUseNumber === 0) {
          console.warn(`⚠️ Coupon #${couponId} đã hết lượt sử dụng khi tạo order`);
          
          // Cập nhật is_active = false (0) khi max_use === 0
          await Coupon.update(
            { is_active: false },
            { where: { id: couponId } }
          );
          console.log(`✅ Đã vô hiệu hóa coupon #${couponId} vì hết lượt sử dụng`);
        } else {
          // Giảm max_use đi 1 và đảm bảo không bao giờ âm
          const newMaxUse = Math.max(0, maxUseNumber - 1);
          
          // Nếu max_use sau khi giảm = 0, thì cập nhật cả is_active = false
          const updateData: any = { max_use: newMaxUse };
          if (newMaxUse === 0) {
            updateData.is_active = false;
          }
          
          // Update max_use (và is_active nếu cần) trong database
          await Coupon.update(
            updateData,
            { where: { id: couponId } }
          );

          // Tạo record trong used_coupons
          await UsedCoupon.create({
            coupon_id: couponId,
            order_id: savedBooking.id,
          });

          if (newMaxUse === 0) {
            console.log(`✅ Đã áp dụng coupon #${couponId} cho order #${savedBooking.id}, max_use còn lại: ${newMaxUse} và đã vô hiệu hóa coupon`);
          } else {
            console.log(`✅ Đã áp dụng coupon #${couponId} cho order #${savedBooking.id}, max_use còn lại: ${newMaxUse}`);
          }
        }
      } catch (error: any) {
        const couponId = coupon.id || coupon.getDataValue("id") || 'unknown';
        console.error(`❌ Lỗi khi xử lý coupon #${couponId}:`, error.message);
        // Không throw error để không làm fail việc tạo order
        // Order đã được tạo thành công, chỉ là không thể áp dụng coupon
      }
    }
    
    // Reload để lấy payment_url mới nhất và trả về trong response
    await savedBooking.reload();
    
    // Tự động check và hủy các booking expired (chạy bất đồng bộ, không chờ kết quả)
    this.cancelExpiredPendingBookings().catch((error) => {
      console.error('Lỗi khi tự động hủy booking expired:', error);
    });
    
    return savedBooking || booking;
  }

  // Lấy danh sách bookings của user
  async getUserBookings(userId: number, page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { user_id: userId };

    const emptyResult = {
      bookings: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };

    const normalizeTourIds = (ids: number[]) =>
      Array.from(
        new Set(
          ids
            .map((id) => Number(id))
            .filter((id) => !isNaN(id) && id > 0)
        )
      );

    let tourIdFilters: number[] | undefined;
    const mergeTourIds = (ids: number[]) => {
      const normalized = normalizeTourIds(ids);
      if (normalized.length === 0) {
        tourIdFilters = [];
        return;
      }
      if (!tourIdFilters) {
        tourIdFilters = normalized;
      } else {
        const normalizedSet = new Set(normalized);
        tourIdFilters = tourIdFilters.filter((id) => normalizedSet.has(id));
      }
    };

    const noTourMatch = () =>
      typeof tourIdFilters !== 'undefined' && tourIdFilters.length === 0;

    // Filter by status
    if (filters?.booking_status) {
      where.status = filters.booking_status;
    }

    // Helper function để build tour IDs từ condition
    const buildTourIdsFromCondition = async (condition: any) => {
      const tours = await Tour.findAll({
        attributes: ['id'],
        where: condition,
      });

      return tours.map((tour) =>
        tour.getDataValue ? tour.getDataValue('id') : tour.id
      );
    };

    // Xử lý search - tìm trong order_code và tour_code
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      // Tìm trong tour_code để lấy tour_ids
      const tourIdsFromSearch = await buildTourIdsFromCondition({
        tour_code: { [Op.like]: `%${searchTerm}%` },
      });
      
      // Tạo điều kiện OR để tìm trong order_code hoặc tour_id
      const searchConditions: any[] = [
        { order_code: { [Op.like]: `%${searchTerm}%` } },
      ];
      
      if (tourIdsFromSearch.length > 0) {
        searchConditions.push({ tour_id: { [Op.in]: tourIdsFromSearch } });
        mergeTourIds(tourIdsFromSearch);
      }
      
      // Thêm điều kiện search vào where (kết hợp với user_id)
      if (Object.keys(where).length > 0) {
        where[Op.and] = [
          ...(where[Op.and] || []),
          { [Op.or]: searchConditions },
        ];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    if (filters?.tour_id) {
      mergeTourIds([Number(filters.tour_id)]);
    }
    if (noTourMatch()) {
      return emptyResult;
    }

    if (filters?.tour_code) {
      const tours = await Tour.findAll({
        attributes: ['id'],
        where: {
          tour_code: {
            [Op.like]: `%${filters.tour_code}%`,
          },
        },
      });

      const tourIds = tours.map((tour) =>
        tour.getDataValue ? tour.getDataValue('id') : tour.id
      );
      mergeTourIds(tourIds);
    }
    if (noTourMatch()) {
      return emptyResult;
    }

    if (filters?.tour_title) {
      const tours = await Tour.findAll({
        attributes: ['id'],
        where: {
          title: {
            [Op.like]: `%${filters.tour_title}%`,
          },
        },
      });

      const tourIds = tours.map((tour) =>
        tour.getDataValue ? tour.getDataValue('id') : tour.id
      );
      mergeTourIds(tourIds);
    }

    if (noTourMatch()) {
      return emptyResult;
    }

    if (tourIdFilters && tourIdFilters.length > 0) {
      where.tour_id =
        tourIdFilters.length === 1
          ? tourIdFilters[0]
          : { [Op.in]: tourIdFilters };
    }

    const { rows: bookings, count: total } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Lấy thông tin tour cho mỗi booking - chỉ lấy các field cần thiết
    const bookingsWithTour = await Promise.all(
      bookings.map(async (booking) => {
        const bookingTourId = booking.getDataValue ? booking.getDataValue('tour_id') : booking.tour_id;
        const tour = await this.findTourById(Number(bookingTourId));
        const tourData = tour?.toJSON();
        return {
          ...booking.toJSON(),
          tour: tourData ? {
            tour_code: tourData.tour_code,
            main_image: tourData.main_image,
            title: tourData.title,
          } : null,
        };
      })
    );

    return {
      bookings: bookingsWithTour,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả bookings (admin)
  async getAllBookings(page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;

    // Xây dựng where clause từ filters
    const where: any = {};
    
    if (filters?.booking_status) {
      where.status = filters.booking_status;
    }
    
    // Filter theo status (mảng) - ưu tiên hơn booking_status
    if (filters?.status && Array.isArray(filters.status) && filters.status.length > 0) {
      where.status = { [Op.in]: filters.status };
    }
    
    if (filters?.payment_status) {
      // Map payment_status sang is_paid
      if (filters.payment_status === 'paid') {
        where.is_paid = true;
      } else if (filters.payment_status === 'pending') {
        where.is_paid = false;
      }
    }
    
    if (filters?.start_date || filters?.end_date) {
      where.created_at = {};
      if (filters.start_date) {
        where.created_at['$gte'] = new Date(filters.start_date);
      }
      if (filters.end_date) {
        where.created_at['$lte'] = new Date(filters.end_date);
      }
    }

    const normalizeTourIds = (ids: number[]) =>
      Array.from(
        new Set(
          ids
            .map((id) => Number(id))
            .filter((id) => !isNaN(id) && id > 0)
        )
      );

    let tourIdFilters: number[] | undefined;
    const mergeTourIds = (ids: number[]) => {
      const normalized = normalizeTourIds(ids);
      if (normalized.length === 0) {
        tourIdFilters = [];
        return;
      }
      if (!tourIdFilters) {
        tourIdFilters = normalized;
      } else {
        const normalizedSet = new Set(normalized);
        tourIdFilters = tourIdFilters.filter((id) => normalizedSet.has(id));
      }
    };

    const noTourMatch = () =>
      typeof tourIdFilters !== 'undefined' && tourIdFilters.length === 0;

    const buildTourIdsFromCondition = async (condition: any) => {
      const tours = await Tour.findAll({
        attributes: ['id'],
        where: condition,
      });

      return tours.map((tour) =>
        tour.getDataValue ? tour.getDataValue('id') : tour.id
      );
    };

    // Xử lý search - tìm trong order_code và tour_code
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      // Tìm trong tour_code để lấy tour_ids
      const tourIdsFromSearch = await buildTourIdsFromCondition({
        tour_code: { [Op.like]: `%${searchTerm}%` },
      });
      
      // Tạo điều kiện OR để tìm trong order_code hoặc tour_id
      const searchConditions: any[] = [
        { order_code: { [Op.like]: `%${searchTerm}%` } },
      ];
      
      if (tourIdsFromSearch.length > 0) {
        searchConditions.push({ tour_id: { [Op.in]: tourIdsFromSearch } });
        mergeTourIds(tourIdsFromSearch);
      }
      
      // Thêm điều kiện search vào where
      if (Object.keys(where).length > 0) {
        where[Op.and] = [
          ...(where[Op.and] || []),
          { [Op.or]: searchConditions },
        ];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    if (filters?.tour_id) {
      mergeTourIds([Number(filters.tour_id)]);
    }
    if (noTourMatch()) {
      return {
        bookings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    if (filters?.tour_code) {
      const ids = await buildTourIdsFromCondition({
        tour_code: { [Op.like]: `%${filters.tour_code}%` },
      });
      mergeTourIds(ids);
    }
    if (noTourMatch()) {
      return {
        bookings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    if (filters?.tour_title) {
      const ids = await buildTourIdsFromCondition({
        title: { [Op.like]: `%${filters.tour_title}%` },
      });
      mergeTourIds(ids);
    }

    if (noTourMatch()) {
      return {
        bookings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    if (tourIdFilters && tourIdFilters.length > 0) {
      // Nếu đã có điều kiện OR từ search, cần kết hợp với AND
      if (where[Op.or]) {
        // Tìm điều kiện tour_id trong OR và thay thế
        const orConditions = where[Op.or];
        const hasTourIdInOr = orConditions.some((cond: any) => cond.tour_id);
        if (hasTourIdInOr) {
          // Cập nhật tour_id trong OR conditions
          orConditions.forEach((cond: any) => {
            if (cond.tour_id && cond.tour_id[Op.in]) {
              cond.tour_id[Op.in] = tourIdFilters;
            }
          });
        } else {
          // Thêm tour_id vào OR conditions
          orConditions.push({ tour_id: { [Op.in]: tourIdFilters } });
        }
      } else {
        where.tour_id =
          tourIdFilters.length === 1
            ? tourIdFilters[0]
            : { [Op.in]: tourIdFilters };
      }
    }

    // Build order clause
    const order: any[] = [];
    
    // Sort theo số lượng vé (quantity)
    if (filters?.ticket) {
      const direction = filters.ticket.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      order.push(['quantity', direction]);
    }
    
    // Sort theo tổng tiền (total_price)
    if (filters?.total) {
      const direction = filters.total.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      order.push(['total_price', direction]);
    }
    
    // Mặc định sort theo created_at DESC nếu không có sort nào
    if (order.length === 0) {
      order.push(['created_at', 'DESC']);
    }

    const { rows: bookings, count: total } = await Order.findAndCountAll({
      where,
      limit,
      offset,
      order,
    });

    // Lấy thông tin tour, user và tickets cho mỗi booking - chỉ lấy các field cần thiết
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const bookingId = booking.getDataValue ? booking.getDataValue('id') : booking.id;
        const bookingTourId = booking.getDataValue ? booking.getDataValue('tour_id') : booking.tour_id;
        const bookingUserId = booking.getDataValue ? booking.getDataValue('user_id') : booking.user_id;
        const [tour, user, tickets] = await Promise.all([
          this.findTourById(Number(bookingTourId)),
          User.findByPk(Number(bookingUserId)),
          Ticket.findAll({ where: { order_id: Number(bookingId) } }),
        ]);
        const tourData = tour?.toJSON();
        return {
          ...booking.toJSON(),
          tour: tourData ? {
            tour_code: tourData.tour_code,
            main_image: tourData.main_image,
            title: tourData.title,
          } : null,
          user: user ? {
            id: user.getDataValue ? user.getDataValue('id') : user.id,
            username: user.getDataValue ? user.getDataValue('username') : user.username,
            email: user.getDataValue ? user.getDataValue('email') : user.email,
          } : null,
          tickets: tickets.map(ticket => ticket.toJSON()),
        };
      })
    );

    return {
      bookings: bookingsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy chi tiết booking
  async getBookingById(id: number, userId?: number) {
    const booking = await Order.findByPk(id);

    if (!booking) {
      throw new Error('Booking không tồn tại');
    }

    // Nếu là user thường, chỉ được xem booking của mình
    if (userId && booking.user_id !== userId) {
      throw new Error('Bạn không có quyền xem booking này');
    }

    const bookingTourId = booking.getDataValue ? booking.getDataValue('tour_id') : booking.tour_id;
    const bookingUserId = booking.getDataValue ? booking.getDataValue('user_id') : booking.user_id;
    const [tour, user, tickets] = await Promise.all([
      this.findTourById(Number(bookingTourId)),
      User.findByPk(Number(bookingUserId)),
      Ticket.findAll({ where: { order_id: id } }),
    ]);

    return {
      ...booking.toJSON(),
      tour: tour?.toJSON(),
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
      } : null,
      tickets,
    };
  }

  // Helper function: Hoàn trả coupon khi hủy đơn hàng
  private async refundCouponForOrder(orderId: number) {
    try {
      // Tìm used_coupon với order_id tương ứng
      const usedCoupon = await UsedCoupon.findOne({
        where: { order_id: orderId },
      });

      if (!usedCoupon) {
        // Không có coupon được sử dụng cho order này
        return;
      }

      // Lấy coupon_id
      const couponId = usedCoupon.coupon_id || usedCoupon.getDataValue("coupon_id");
      if (!couponId) {
        console.warn(`⚠️ Không thể lấy coupon_id từ used_coupon cho order #${orderId}`);
        return;
      }

      // Lấy coupon từ database
      const coupon = await Coupon.findByPk(couponId);
      if (!coupon) {
        console.warn(`⚠️ Coupon #${couponId} không tồn tại khi hoàn trả cho order #${orderId}`);
        return;
      }

      // Lấy max_use hiện tại
      let maxUse: any = coupon.max_use !== undefined
        ? coupon.max_use
        : coupon.getDataValue("max_use");
      
      const maxUseNumber = Number(maxUse);
      if (isNaN(maxUseNumber)) {
        console.warn(`⚠️ Coupon #${couponId} có max_use không hợp lệ: ${maxUse}`);
        return;
      }

      // Tăng max_use lên 1
      const newMaxUse = maxUseNumber + 1;
      
      // Nếu max_use > 0, set is_active = true
      const updateData: any = { max_use: newMaxUse };
      if (newMaxUse > 0) {
        updateData.is_active = true;
      }

      // Cập nhật coupon trong database
      await Coupon.update(
        updateData,
        { where: { id: couponId } }
      );

      // Xóa record trong used_coupons (hoàn trả coupon)
      await usedCoupon.destroy();

      console.log(`✅ Đã hoàn trả coupon #${couponId} cho order #${orderId}, max_use tăng lên: ${newMaxUse}`);
    } catch (error: any) {
      console.error(`❌ Lỗi khi hoàn trả coupon cho order #${orderId}:`, error.message);
      // Không throw error để không làm fail việc hủy booking
    }
  }

  // Hủy booking
  async cancelBooking(id: number, adminId?: number) {
    const booking = await Order.findByPk(id);

    if (!booking) {
      throw new Error('Booking không tồn tại');
    }
    if (adminId === undefined) {
      throw new Error('Chỉ admin tổng mới có quyền hủy booking');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking đã được hủy trước đó');
    }

    if (booking.status === 'completed') {
      throw new Error('Không thể hủy booking đã hoàn thành');
    }

    // Lưu guide_id và tour_id trước khi hủy để kiểm tra xóa tour_guides
    const guideId = booking.getDataValue ? booking.getDataValue('guide_id') : booking.guide_id;
    const tourId = booking.getDataValue ? booking.getDataValue('tour_id') : booking.tour_id;
    const guideIdNum = guideId ? Number(guideId) : null;
    const tourIdNum = tourId ? Number(tourId) : null;

    const transaction = await sequelize.transaction();
    try {
      // CHỈ cập nhật status thành 'cancelled', KHÔNG xóa guide_id ở bảng orders
      // Giữ lại guide_id để ticket vẫn có thể lấy thông tin guide
      await booking.update({ status: 'cancelled' }, { transaction });
      await this.restoreTourCapacityForBooking(booking, transaction);
      await transaction.commit();
      sendCancellationEmail(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Cập nhật tất cả tickets của order thành 'cancelled'
    try {
      const cancelledTicketsCount = await ticketService.cancelTicketsByOrderId(id);
      if (cancelledTicketsCount > 0) {
        console.log(`✅ Đã hủy ${cancelledTicketsCount} vé của đơn hàng #${id}`);
      } else {
        console.log(`ℹ️ Đơn hàng #${id} không có vé nào cần hủy (có thể đã được hủy trước đó hoặc chưa có vé)`);
      }
    } catch (error: any) {
      // Silent error - không ảnh hưởng đến việc hủy booking nhưng vẫn log để debug
      console.error(`❌ Lỗi khi hủy tickets của order #${id}:`, error.message);
    }

    // Hoàn trả coupon nếu có
    await this.refundCouponForOrder(id);

    // CHỈ xóa ở bảng tour_guides (KHÔNG xóa guide_id ở bảng orders)
    // Xóa tour khỏi tour_guides nếu guide không còn tour nào
    try {
      if (guideIdNum && tourIdNum) {
        // Kiểm tra xem tour này còn order confirmed nào không (sau khi hủy đơn này)
        const remainingConfirmedOrders = await Order.count({
          where: {
            tour_id: tourIdNum,
            guide_id: guideIdNum,
            status: { [Op.in]: ['confirmed', 'completed'] },
            id: { [Op.ne]: id }, // Loại trừ order vừa hủy
          },
        });

        // Nếu tour không còn order confirmed nào, kiểm tra xem guide còn tour nào khác không
        if (remainingConfirmedOrders === 0) {
          // Đếm tổng số tour của guide trong bảng tour_guides
          const totalToursCount = await TourGuide.count({
            where: {
              guide_id: guideIdNum,
            },
          });

          // Nếu guide chỉ có 1 tour (tour này), sau khi hủy đơn guide sẽ về 0 tour
          // => CHỈ xóa record trong bảng tour_guides (KHÔNG xóa guide_id ở bảng orders)
          // Để tour không hiển thị trên trang admin/guide-tour
          if (totalToursCount === 1) {
            const tourGuide = await TourGuide.findOne({
              where: {
                tour_id: tourIdNum,
                guide_id: guideIdNum,
              },
            });

            if (tourGuide) {
              await tourGuide.destroy();
              console.log(`✅ Đã xóa tour #${tourIdNum} khỏi bảng tour_guides vì guide #${guideIdNum} không còn tour nào sau khi hủy đơn`);
              console.log(`ℹ️ Lưu ý: guide_id trong bảng orders vẫn được giữ lại để ticket có thể lấy thông tin guide`);
            }
          }
        }
      }
    } catch (error: any) {
      // Silent error - không ảnh hưởng đến việc hủy booking
      console.error(`❌ Lỗi khi kiểm tra và xóa tour khỏi tour_guides:`, error.message);
    }

    // Tạo thông báo về việc hủy booking
    await notificationService.sendNotificationToUser(
      adminId,
      booking.user_id || 0,
      {
        title: 'Đơn hàng đã bị hủy',
        message: `Đơn hàng của bạn với mã đơn hàng ${booking.order_code || booking.id} đã bị hủy thành công.`,
        type: 'order',
      }
    );

    // Log để debug
    console.log(`✅ Booking #${id} đã được hủy thành công`);

    // Reload để đảm bảo lấy dữ liệu mới nhất từ DB
    await booking.reload();

    return booking;
  }

  // Xác nhận booking (admin)
  async confirmBooking(id: number) {
    const booking = await Order.findByPk(id);

    if (!booking) {
      throw new Error('Booking không tồn tại');
    }

    // Cho phép xác nhận booking ở bất kỳ trạng thái nào
    // if (booking.status !== 'pending') {
    //   throw new Error('Chỉ có thể xác nhận booking đang chờ');
    // }

    // Cập nhật status thành confirmed và lưu vào DB
    await booking.update({ status: 'confirmed' });

    console.log(`✅ Booking #${id} đã được xác nhận`);
    await booking.reload();

    return booking;
  }

  // Cập nhật trạng thái thanh toán
  async updatePaymentStatus(id: number, isPaid: boolean) {
    const booking = await Order.findByPk(id);

    if (!booking) {
      throw new Error('Booking không tồn tại');
    }

    await booking.update({ is_paid: isPaid });

    return booking;
  }

  // Hoàn thành booking
  async completeBooking(id: number) {
    const booking = await Order.findByPk(id);

    if (!booking) {
      throw new Error('Booking không tồn tại');
    }

    await booking.update({ status: 'completed' });

    return booking;
  }

  // Lấy tổng số đơn hàng đã bán được (status = completed)
  async getTotalCompletedOrders() {
    const total = await Order.count({
      where: { status: 'completed' },
    });

    return {
      total_completed_orders: total,
      message: `Tổng số đơn hàng đã bán được: ${total}`,
    };
  }

  // Tự động hủy các booking pending quá 24 tiếng
  // Thời gian mặc định: 24 tiếng (có thể thay đổi bằng env variable PENDING_BOOKING_TIMEOUT_HOURS)
  async cancelExpiredPendingBookings(): Promise<{ cancelled: number; message: string }> {
    try {
      const timeoutAgo = new Date();
      timeoutAgo.setHours(timeoutAgo.getHours() - 16);
      timeoutAgo.setMinutes(timeoutAgo.getMinutes() - 41);

      const expiredBookings = await Order.findAll({
        where: {
          status: 'pending',
          is_paid: false,
          created_at: {
            [Op.lt]: timeoutAgo,
          },
        },
      });

      if (expiredBookings.length === 0) {
        return {
          cancelled: 0,
          message: 'Không có booking nào cần hủy',
        };
      }

      let cancelledCount = 0;

      for (const bookingRecord of expiredBookings) {
        const bookingIdRaw = bookingRecord.getDataValue
          ? bookingRecord.getDataValue('id')
          : bookingRecord.id;
        const bookingId = Number(bookingIdRaw);

        if (isNaN(bookingId) || bookingId <= 0) {
          continue;
        }

        const transaction = await sequelize.transaction();
        try {
          const booking = await Order.findByPk(bookingId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!booking || booking.status !== 'pending') {
            await transaction.rollback();
            continue;
          }

          await booking.update({ status: 'cancelled' }, { transaction });
          await this.restoreTourCapacityForBooking(booking, transaction);
          await transaction.commit();
          await this.refundCouponForOrder(bookingId);
          cancelledCount += 1;
        } catch (error) {
          await transaction.rollback();
          console.error(
            `❌ Lỗi khi hủy booking pending #${bookingId}:`,
            (error as Error).message
          );
        }
      }

      return {
        cancelled: cancelledCount,
        message:
          cancelledCount === 0
            ? 'Không có booking nào cần hủy'
            : `Đã tự động hủy ${cancelledCount} booking pending quá thời gian`,
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi hủy booking hết hạn: ${error.message}`);
    }
  }

  // Xóa đơn hàng vĩnh viễn (Hard Delete - xóa hoàn toàn khỏi database)
  async hardDeleteOrder(id: number) {
    const order = await Order.findByPk(id);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Xóa tất cả dữ liệu liên quan trước
    await Promise.all([
      Ticket.destroy({ where: { order_id: id } }),
      UsedCoupon.destroy({ where: { order_id: id } }),
    ]);

    // Xóa đơn hàng chính
    await order.destroy();
    
    return { message: 'Xóa đơn hàng vĩnh viễn thành công (hard delete)' };
  }

  /**
   * Tự động chuyển trạng thái orders từ 'confirmed' sang 'completed' 
   * sau khi đã qua ngày end_date
   */
  async completeExpiredConfirmedOrders(): Promise<{ completed: number; message: string }> {
    try {
      // Lấy ngày hôm nay (format YYYY-MM-DD để so sánh với DATEONLY)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Tìm tất cả orders có status = 'confirmed' và end_date < hôm nay
      // end_date là DATEONLY nên so sánh với string format YYYY-MM-DD
      const expiredOrders = await Order.findAll({
        where: {
          status: 'confirmed',
          end_date: {
            [Op.lt]: todayString,
          },
        },
      });

      if (expiredOrders.length === 0) {
        return {
          completed: 0,
          message: 'Không có order nào cần chuyển sang completed',
        };
      }

      let completedCount = 0;

      for (const order of expiredOrders) {
        try {
          await order.update({ status: 'completed' });
          completedCount += 1;
          console.log(`✅ Đã chuyển order #${order.id} từ confirmed sang completed (end_date: ${order.end_date})`);
        } catch (error) {
          console.error(
            `❌ Lỗi khi cập nhật order #${order.id}:`,
            (error as Error).message
          );
        }
      }

      return {
        completed: completedCount,
        message:
          completedCount === 0
            ? 'Không có order nào được cập nhật'
            : `Đã tự động chuyển ${completedCount} order từ confirmed sang completed`,
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi chuyển trạng thái orders: ${error.message}`);
    }
  }
}

export default new BookingService();