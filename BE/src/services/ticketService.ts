import Ticket from '../models/Ticket';
import Order from '../models/Order';
import Tour from '../models/Tour';
import User from '../models/User';
import Admin from '../models/Admin';
import sequelize from '../config/database';
import { QueryTypes, Op } from 'sequelize';

class TicketService {
  // Helper function để tìm tour với fallback cho BIGINT
  private async findTourById(tourId: number): Promise<Tour | null> {
    const id = Number(tourId);
    if (isNaN(id) || id <= 0) {
      return null;
    }

    let tour = await Tour.findByPk(id);
    if (tour) {
      return tour;
    }

    try {
      const resultsAny: any = await sequelize.query(
        'SELECT * FROM tours WHERE id = :id LIMIT 1',
        {
          replacements: { id: id },
          type: QueryTypes.SELECT,
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
    } catch (error) {
      console.error('Error in findTourById raw query:', error);
    }

    return null;
  }

  // Lấy tickets của user
  async getUserTickets(userId: number, page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { user_id: userId };

    // Filter by status
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    // Filter by ticket_code (mã vé)
    if (filters?.text) {
      where.ticket_code = {
        [Op.like]: `%${filters.text}%`
      };
    }

    const { rows: tickets, count: total } = await Ticket.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Lấy thông tin user và tour cho mỗi ticket - chỉ các field cần thiết
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const ticketOrderId = ticket.getDataValue ? ticket.getDataValue('order_id') : ticket.order_id;
        const ticketUserId = ticket.getDataValue ? ticket.getDataValue('user_id') : ticket.user_id;
        
        // Get order to get tour_id and guide information
        const order = await Order.findByPk(Number(ticketOrderId), {
          include: [
            {
              model: Admin,
              as: 'guide',
              required: false,
              attributes: ['id', 'username', 'email', 'phone', 'role', 'region'],
            },
          ],
        });
        const tourId = order?.getDataValue ? order.getDataValue('tour_id') : order?.tour_id;
        
        const [user, tour] = await Promise.all([
          User.findByPk(Number(ticketUserId)),
          tourId ? this.findTourById(Number(tourId)) : null,
        ]);

        const userData = user?.toJSON();
        const tourData = tour?.toJSON();
        const ticketJson = ticket.toJSON();
        const orderJson = order?.toJSON() as any;
        // Lấy thông tin guide từ bảng orders qua guide_id (trỏ đến id trong bảng admin)
        const guideData = orderJson?.guide;
        
        // Remove order_id from response
        const { order_id, ...ticketWithoutOrderId } = ticketJson as any;
        
        return {
          ...ticketWithoutOrderId,
          user: userData ? {
            username: userData.username,
            phone: userData.phone,
            email: userData.email,
          } : null,
          tour: tourData ? {
            title: tourData.title,
            main_image: tourData.main_image,
            tour_code: tourData.tour_code,
          } : null,
          guide: guideData ? {
            id: guideData.id,
            username: guideData.username,
            email: guideData.email,
            phone: guideData.phone,
            role: guideData.role,
            region: guideData.region,
          } : null,
        };
      })
    );

    return {
      tickets: ticketsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả tickets (Admin)
  async getAllTickets(page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;

    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filter by ticket_code (mã vé)
    if (filters?.text) {
      where.ticket_code = {
        [Op.like]: `%${filters.text}%`
      };
    }

    const { rows: tickets, count: total } = await Ticket.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Lấy thông tin user và tour cho mỗi ticket
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const ticketOrderId = ticket.getDataValue ? ticket.getDataValue('order_id') : ticket.order_id;
        const ticketUserId = ticket.getDataValue ? ticket.getDataValue('user_id') : ticket.user_id;
        
        const order = await Order.findByPk(Number(ticketOrderId));
        const tourId = order?.getDataValue ? order.getDataValue('tour_id') : order?.tour_id;
        
        const [user, tour] = await Promise.all([
          User.findByPk(Number(ticketUserId)),
          tourId ? this.findTourById(Number(tourId)) : null,
        ]);

        const userData = user?.toJSON();
        const tourData = tour?.toJSON();
        const ticketJson = ticket.toJSON();
        
        const { order_id, ...ticketWithoutOrderId } = ticketJson as any;
        
        return {
          ...ticketWithoutOrderId,
          user: userData ? {
            username: userData.username,
            phone: userData.phone,
            email: userData.email,
          } : null,
          tour: tourData ? {
            title: tourData.title,
            main_image: tourData.main_image,
            tour_code: tourData.tour_code,
          } : null,
        };
      })
    );

    return {
      tickets: ticketsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy chi tiết ticket
  async getTicketById(id: number, userId?: number) {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      throw new Error('Ticket không tồn tại');
    }

    // Nếu không phải admin, kiểm tra quyền sở hữu
    if (userId && ticket.user_id !== userId) {
      throw new Error('Bạn không có quyền xem ticket này');
    }

    const ticketOrderId = ticket.getDataValue ? ticket.getDataValue('order_id') : ticket.order_id;
    const ticketUserId = ticket.getDataValue ? ticket.getDataValue('user_id') : ticket.user_id;
    
    const order = await Order.findByPk(Number(ticketOrderId));
    const tourId = order?.getDataValue ? order.getDataValue('tour_id') : order?.tour_id;
    
    const [user, tour] = await Promise.all([
      User.findByPk(Number(ticketUserId)),
      tourId ? this.findTourById(Number(tourId)) : null,
    ]);

    const userData = user?.toJSON();
    const tourData = tour?.toJSON();
    const ticketJson = ticket.toJSON();
    
    const { order_id, ...ticketWithoutOrderId } = ticketJson as any;
    
    return {
      ...ticketWithoutOrderId,
      user: userData ? {
        username: userData.username,
        phone: userData.phone,
        email: userData.email,
      } : null,
      tour: tourData ? {
        title: tourData.title,
        main_image: tourData.main_image,
        tour_code: tourData.tour_code,
      } : null,
    };
  }

  // Cập nhật trạng thái ticket (Admin)
  async updateTicketStatus(id: number, status: 'active' | 'used' | 'cancelled') {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      throw new Error('Ticket không tồn tại');
    }

    await ticket.update({ status });

    return ticket;
  }

  // Hủy ticket (User hoặc Admin)
  async cancelTicket(id: number, userId?: number) {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      throw new Error('Ticket không tồn tại');
    }

    // Nếu không phải admin, kiểm tra quyền sở hữu
    if (userId && ticket.user_id !== userId) {
      throw new Error('Bạn không có quyền hủy ticket này');
    }

    // Kiểm tra trạng thái ticket
    if (ticket.status === 'used') {
      throw new Error('Không thể hủy ticket đã sử dụng');
    }

    if (ticket.status === 'cancelled') {
      throw new Error('Ticket đã được hủy trước đó');
    }

    await ticket.update({ status: 'cancelled' });

    return ticket;
  }

  // Lấy tất cả tickets theo tour_id với filter status
  async getTicketsByTourId(tourId: number, page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;

    // Kiểm tra tour có tồn tại không
    const tour = await this.findTourById(tourId);
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    // Kiểm tra xem tour có orders không (để debug)
    const ordersCount = await Order.count({
      where: { tour_id: tourId },
    });

    // Build where clause cho Ticket
    const where: any = {};

    // Filter by status
    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    // Filter by ticket_code (mã vé)
    if (filters?.text) {
      where.ticket_code = {
        [Op.like]: `%${filters.text}%`
      };
    }

    // Lấy thông tin tour một lần (không cần lấy lại trong map)
    const tourJson = tour.toJSON();

    // Sử dụng include để join trực tiếp với Order và filter theo tour_id
    const { rows: tickets, count: total } = await Ticket.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          where: {
            tour_id: tourId,
          },
          required: true, // INNER JOIN - chỉ lấy tickets có order thuộc tour này
          attributes: ['id', 'tour_id', 'order_code'],
        },
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'username', 'phone', 'email'],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Xử lý dữ liệu tickets
    const ticketsWithDetails = tickets.map((ticket) => {
      const ticketJson = ticket.toJSON() as any;
      const user = ticketJson.user;

      // Loại bỏ order_id và order object khỏi response
      const { order_id, order: orderObj, user: userObj, ...ticketWithoutRelations } = ticketJson;
      
      return {
        ...ticketWithoutRelations,
        user: user ? {
          username: user.username,
          phone: user.phone,
          email: user.email,
        } : null,
        tour: tourJson ? {
          title: tourJson.title,
          main_image: tourJson.main_image,
          tour_code: tourJson.tour_code,
        } : null,
      };
    });

    return {
      tickets: ticketsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tickets theo order_id
  async getTicketsByOrderId(orderId: number, page: number = 1, limit: number = 10, filters?: any) {
    const offset = (page - 1) * limit;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Admin,
          as: 'guide',
          required: false,
          attributes: ['id', 'username', 'email', 'phone', 'role', 'region'],
        },
      ],
    });
    if (!order) {
      throw new Error('Order không tồn tại');
    }

    const tour = order.tour_id ? await this.findTourById(Number(order.tour_id)) : null;

    const where: any = { order_id: orderId };

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.text) {
      where.ticket_code = {
        [Op.like]: `%${filters.text}%`
      };
    }

    const { rows: tickets, count: total } = await Ticket.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          required: false,
          attributes: ['id', 'username', 'phone', 'email'],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const tourJson = tour ? tour.toJSON() : null;
    const orderJson = order.toJSON() as any;
    const guideData = orderJson.guide;

    const ticketsWithDetails = tickets.map((ticket) => {
      const ticketJson = ticket.toJSON() as any;
      const { user: userObj, order_id, ...ticketWithoutRelations } = ticketJson;

      return {
        ...ticketWithoutRelations,
        user: userObj ? {
          username: userObj.username,
          phone: userObj.phone,
          email: userObj.email,
        } : null,
        tour: tourJson ? {
          title: tourJson.title,
          main_image: tourJson.main_image,
          tour_code: tourJson.tour_code,
        } : null,
        order: {
          id: order.id,
          order_code: order.order_code,
          tour_id: order.tour_id,
          user_id: order.user_id,
        },
        guide: guideData ? {
          id: guideData.id,
          username: guideData.username,
          email: guideData.email,
          phone: guideData.phone,
          role: guideData.role,
          region: guideData.region,
        } : null,
      };
    });

    return {
      tickets: ticketsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tự động cập nhật trạng thái vé từ 'active' sang 'cancelled' 
   * khi đã qua ngày valid_until và vé chưa được sử dụng
   */
  async cancelExpiredTickets(): Promise<{ cancelled: number; message: string }> {
    try {
      // Lấy ngày hôm nay (format YYYY-MM-DD để so sánh với DATEONLY)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Tìm tất cả tickets có status = 'active' và valid_until < hôm nay
      const expiredTickets = await Ticket.findAll({
        where: {
          status: 'active',
          valid_until: {
            [Op.lt]: todayString,
          },
        },
      });

      if (expiredTickets.length === 0) {
        return {
          cancelled: 0,
          message: 'Không có vé nào cần hủy do hết hạn',
        };
      }

      let cancelledCount = 0;

      for (const ticket of expiredTickets) {
        try {
          await ticket.update({ status: 'cancelled' });
          cancelledCount += 1;
          console.log(`✅ Đã hủy vé #${ticket.id} do hết hạn (valid_until: ${ticket.valid_until})`);
        } catch (error) {
          console.error(
            `❌ Lỗi khi cập nhật vé #${ticket.id}:`,
            (error as Error).message
          );
        }
      }

      return {
        cancelled: cancelledCount,
        message:
          cancelledCount === 0
            ? 'Không có vé nào được cập nhật'
            : `Đã tự động hủy ${cancelledCount} vé do hết hạn`,
      };
    } catch (error: any) {
      throw new Error(`Lỗi khi hủy vé hết hạn: ${error.message}`);
    }
  }

  /**
   * Cập nhật tất cả tickets của một order thành 'cancelled'
   */
  async cancelTicketsByOrderId(orderId: number): Promise<number> {
    try {
      const tickets = await Ticket.findAll({
        where: {
          order_id: orderId,
          status: { [Op.in]: ['active'] }, // Chỉ hủy các vé đang active, không hủy vé đã used
        },
      });

      if (tickets.length === 0) {
        return 0;
      }

      let cancelledCount = 0;
      for (const ticket of tickets) {
        try {
          await ticket.update({ status: 'cancelled' });
          cancelledCount += 1;
          console.log(`✅ Đã hủy vé #${ticket.id} do đơn hàng #${orderId} bị hủy`);
        } catch (error) {
          console.error(
            `❌ Lỗi khi hủy vé #${ticket.id}:`,
            (error as Error).message
          );
        }
      }

      return cancelledCount;
    } catch (error: any) {
      console.error(`❌ Lỗi khi hủy tickets của order #${orderId}:`, error.message);
      return 0;
    }
  }
}

export default new TicketService();

