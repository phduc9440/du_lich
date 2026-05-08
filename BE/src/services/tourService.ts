import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';
import Tour from '../models/Tour';
import TourSchedule from '../models/TourSchedule';
import TourInclude from '../models/TourInclude';
import TourExclude from '../models/TourExclude';
import TourGallery from '../models/TourGallery';
import Review from '../models/Review';
import User from '../models/User';
import Category from '../models/Category';
import TourCategory from '../models/TourCategory';
import Order from '../models/Order';
import Ticket from '../models/Ticket';
import Admin from '../models/Admin';
import TourGuide from '../models/TourGuide';
import tourGuideAssignmentService from './tourGuideAssignmentService';

export interface TourFilters {
  search?: string;
  category_ids?: number[]; // Hỗ trợ filter theo nhiều categories
  destination?: string;
  min_price?: number;
  max_price?: number;
  duration?: string; // short, medium, long
  types?: string[]; // array of tour types
  stock?: number; // 1: còn vé, 0: hết vé
  rating?: number; // rating tối thiểu
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  sort?: string;
  sortOrders?: [string, 'ASC' | 'DESC'][];
  is_active?: boolean;
  regions?: string[]; // northern, central, southern
}

export interface CreateTourDTO {
  title: string;
  description?: string;
  destination?: string;
  departure?: string;
  start_date?: Date | string;
  end_date?: Date | string;
  duration?: string;
  price: number | string;
  capacity?: number;
  latitude?: number | string;
  longitude?: number | string;
  main_image?: string;
  is_active?: boolean;
  categories?: string | number[]; // Có thể là chuỗi "1,2,3" hoặc mảng [1,2,3]
  category_ids?: number[]; // Giữ lại để tương thích ngược
  schedule?: Array<{
    day_number: number;
    title: string;
    detail?: string;
  }>;
  includes?: Array<{
    item: string;
  }>;
  excludes?: Array<{
    item: string;
  }>;
  gallery?: Array<{
    image_url: string;
  }>;
}

class TourService {
  /**
   * Tính số vé đã bán cho một tour dựa trên các đơn hàng confirmed
   * trong khoảng start_date và end_date của tour
   */
  private async calculateTicketsSoldForTour(tourId: number, tourStartDate: Date | string, tourEndDate: Date | string): Promise<number> {
    // Chuyển đổi sang string format YYYY-MM-DD để so sánh với DATEONLY
    const tourStartDateStr = tourStartDate instanceof Date 
      ? tourStartDate.toISOString().split('T')[0] 
      : String(tourStartDate).split('T')[0];
    const tourEndDateStr = tourEndDate instanceof Date 
      ? tourEndDate.toISOString().split('T')[0] 
      : String(tourEndDate).split('T')[0];

    // Tìm các đơn hàng confirmed có khoảng thời gian nằm trong khoảng start_date và end_date của tour
    const confirmedOrders = await Order.findAll({
      where: {
        tour_id: tourId,
        status: { [Op.in]: ['confirmed', 'pending'] },
        start_date: {
          [Op.gte]: tourStartDateStr,
          [Op.lte]: tourEndDateStr,
        },
        end_date: {
          [Op.gte]: tourStartDateStr,
          [Op.lte]: tourEndDateStr,
        },
      },
      attributes: ['quantity'],
    });

    // Tính tổng số vé đã bán
    return confirmedOrders.reduce((sum, order) => {
      const quantity = order.getDataValue ? order.getDataValue('quantity') : order.quantity;
      return sum + (Number(quantity) || 0);
    }, 0);
  }

  // Lấy danh sách tours với filters và pagination
  async getTours(page: number = 1, limit: number = 10, filters?: TourFilters) {
    const offset = (page - 1) * limit;

    // Log filters để debug
    console.log('📋 Tour filters received:', JSON.stringify(filters, null, 2));

    // Build where clause
    const where: any = { is_active: true };
    
    // Build include array cho quan hệ nhiều-nhiều với Category
    const include: any[] = [];

    if (filters) {
      // Search by title or destination
      if (filters.search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${filters.search}%` } },
          { destination: { [Op.like]: `%${filters.search}%` } },
          { tour_code: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      // Filter theo category_ids (quan hệ nhiều-nhiều)
      if (filters.category_ids && filters.category_ids.length > 0) {
        include.push({
          model: Category,
          as: 'categories',
          where: {
            id: { [Op.in]: filters.category_ids }
          },
          through: { attributes: [] }, // Ẩn các trường của bảng trung gian
          required: true, // INNER JOIN - chỉ lấy tours có categories khớp
        });
      }

      if (filters.destination) {
        where.destination = { [Op.like]: `%${filters.destination}%` };
      }

      // Region filter - filter theo nhiều regions
      if (filters.regions && filters.regions.length > 0) {
        where.region = { [Op.in]: filters.regions };
      }

      if (filters.min_price || filters.max_price) {
        where.price = {};
        if (filters.min_price) {
          where.price[Op.gte] = filters.min_price;
        }
        if (filters.max_price) {
          where.price[Op.lte] = filters.max_price;
        }
      }

      // Duration filter (short: 1-3 days, medium: 4-7 days, long: >7 days)
      // Sử dụng DATEDIFF để tính số ngày giữa start_date và end_date
      if (filters.duration) {
        const durationRanges: Record<string, any> = {
          short: { min: 1, max: 3 },
          medium: { min: 4, max: 7 },
          long: { min: 8, max: 365 }
        };
        
        const range = durationRanges[filters.duration];
        if (range) {
          // Sử dụng Sequelize literal để tính DATEDIFF
          where[Op.and] = where[Op.and] || [];
          where[Op.and].push(
            sequelize.literal(`DATEDIFF(end_date, start_date) BETWEEN ${range.min} AND ${range.max}`)
          );
        }
      }

      // Rating filter (minimum rating)
      if (filters.rating !== undefined) {
        where.rating = { [Op.gte]: filters.rating };
      }

      // Stock filter sẽ được xử lý sau khi tính tickets_sold động
      // Không filter ở đây vì cần tính tickets_sold từ Order

      // Date range filter (tour starts within this range)
      if (filters.start_date || filters.end_date) {
        where.start_date = {};
        if (filters.start_date) {
          where.start_date[Op.gte] = filters.start_date;
        }
        if (filters.end_date) {
          where.start_date[Op.lte] = filters.end_date;
        }
      }

      // Types filter - filter theo tên category (nếu frontend gửi types)
      if (filters.types && filters.types.length > 0) {
        console.log('🔍 Filtering by types:', filters.types);
        
        // Nếu chưa có include Category, thêm vào với filter theo tên category
        const existingCategoryInclude = include.find(inc => inc.model === Category);
        
        if (existingCategoryInclude) {
          // Đã có include rồi, chỉ cần thêm điều kiện OR
          existingCategoryInclude.where = {
            [Op.or]: [
              existingCategoryInclude.where,
              { category: { [Op.in]: filters.types.map(t => t.toLowerCase()) } }
            ]
          };
        } else {
          // Chưa có include, tạo mới
          include.push({
            model: Category,
            as: 'categories',
            where: {
              category: { [Op.in]: filters.types.map(t => t.toLowerCase()) }
            },
            through: { attributes: [] },
            required: true,
          });
        }
        
        console.log('✅ Filtering by category types:', filters.types);
      }
    }

    // Build order clause
    let order: any = [['created_at', 'DESC']];
    if (filters?.sort) {
      switch (filters.sort) {
        case 'price_asc':
          order = [['price', 'ASC']];
          break;
        case 'price_desc':
          order = [['price', 'DESC']];
          break;
        case 'rating':
        case 'rating_desc':
          order = [['rating', 'DESC']];
          break;
        case 'newest':
        case 'created_desc':
          order = [['created_at', 'DESC']];
          break;
        case 'name_asc':
          order = [['title', 'ASC']];
          break;
        case 'name_desc':
          order = [['title', 'DESC']];
          break;
        default:
          order = [['created_at', 'DESC']];
      }
    }

    // Log where clause để debug
    console.log('🔍 SQL where clause:', JSON.stringify(where, null, 2));
    console.log('📊 Order by:', order);
    console.log('🔗 Include:', JSON.stringify(include, null, 2));

    const { rows: tours, count: total } = await Tour.findAndCountAll({
      where,
      include: include.length > 0 ? include : undefined, // Chỉ thêm include nếu có
      limit,
      offset,
      order,
      distinct: true, // Quan trọng: tránh đếm trùng khi có join
    });

    console.log(`✅ Found ${total} tours (page ${page}, limit ${limit})`);

    let currentPage = page;
    let currentTours = tours;

    if (total > 0) {
      const totalPages = Math.ceil(total / limit);
      if (page > totalPages) {
        currentPage = totalPages;
      }

      if (currentPage < 1) {
        currentPage = 1;
      }

      const adjustedOffset = (currentPage - 1) * limit;

      if (adjustedOffset !== offset) {
        currentTours = await Tour.findAll({
          where,
          include: include.length > 0 ? include : undefined,
          limit,
          offset: adjustedOffset,
          order,
        });
      }
    } else {
      currentPage = 1;
    }

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    // Tính tickets_sold cho mỗi tour và filter theo stock nếu có
    const toursWithTicketsSold = await Promise.all(
      currentTours.map(async (tour) => {
        const tourData = tour.toJSON();
        const tourStartDate = tourData.start_date;
        const tourEndDate = tourData.end_date;
        const capacity = tourData.capacity || 0;

        // Tính tickets_sold
        let ticketsSold = 0;
        if (tourStartDate && tourEndDate) {
          ticketsSold = await this.calculateTicketsSoldForTour(
            Number(tourData.id),
            tourStartDate,
            tourEndDate
          );
        }

        return {
          ...tourData,
          tickets_sold: ticketsSold,
        };
      })
    );

    // Filter theo stock nếu có filter
    let filteredTours = toursWithTicketsSold;
    if (filters?.stock === 1 || filters?.stock === 0) {
      filteredTours = toursWithTicketsSold.filter((tour) => {
        const capacity = tour.capacity || 0;
        const ticketsSold = tour.tickets_sold || 0;
        
        if (filters.stock === 1) {
          // Còn vé: tickets_sold < capacity
          return ticketsSold < capacity;
        } else {
          // Hết vé: tickets_sold >= capacity
          return ticketsSold >= capacity;
        }
      });
    }

    return {
      tours: filteredTours,
      pagination: {
        page: total > 0 ? currentPage : 1,
        limit,
        total: filters?.stock !== undefined ? filteredTours.length : total,
        totalPages: filters?.stock !== undefined 
          ? Math.ceil(filteredTours.length / limit) 
          : totalPages,
      },
    };
  }

  // Lấy danh sách tours cho admin (bao gồm cả tour inactive)
  async getAdminTours(page: number = 1, limit: number = 10, filters?: TourFilters) {
    const offset = (page - 1) * limit;

    console.log('📋 Admin tour filters received:', JSON.stringify(filters, null, 2));

    const where: any = {};
    const include: any[] = [];

    if (filters) {
      if (typeof filters.is_active === 'boolean') {
        where.is_active = filters.is_active;
      }

      if (filters.search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${filters.search}%` } },
          { destination: { [Op.like]: `%${filters.search}%` } },
          { tour_code: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      if (filters.category_ids && filters.category_ids.length > 0) {
        include.push({
          model: Category,
          as: 'categories',
          where: {
            id: { [Op.in]: filters.category_ids }
          },
          through: { attributes: [] },
          required: true,
        });
      }

      if (filters.destination) {
        where.destination = { [Op.like]: `%${filters.destination}%` };
      }

      // Region filter - filter theo nhiều regions
      if (filters.regions && filters.regions.length > 0) {
        where.region = { [Op.in]: filters.regions };
      }

      if (filters.min_price || filters.max_price) {
        where.price = {};
        if (filters.min_price) {
          where.price[Op.gte] = filters.min_price;
        }
        if (filters.max_price) {
          where.price[Op.lte] = filters.max_price;
        }
      }

      if (filters.duration) {
        const durationRanges: Record<string, any> = {
          short: { min: 1, max: 3 },
          medium: { min: 4, max: 7 },
          long: { min: 8, max: 365 }
        };
        
        const range = durationRanges[filters.duration];
        if (range) {
          where[Op.and] = where[Op.and] || [];
          where[Op.and].push(
            sequelize.literal(`DATEDIFF(end_date, start_date) BETWEEN ${range.min} AND ${range.max}`)
          );
        }
      }

      if (filters.rating !== undefined) {
        where.rating = { [Op.gte]: filters.rating };
      }

      if (filters.stock === 1 || filters.stock === 0) {
        const comparisonOperator = filters.stock === 1 ? '<' : '>=';
        where[Op.and] = where[Op.and] || [];
        const capacityComparison = `(SELECT COALESCE(SUM(o.quantity), 0)
          FROM orders o
          WHERE o.tour_id = Tour.id AND o.status = 'confirmed') ${comparisonOperator} Tour.capacity`;
        where[Op.and].push(sequelize.literal(capacityComparison));
      }

      if (filters.start_date || filters.end_date) {
        where.start_date = {};
        if (filters.start_date) {
          where.start_date[Op.gte] = filters.start_date;
        }
        if (filters.end_date) {
          where.start_date[Op.lte] = filters.end_date;
        }
      }

      if (filters.types && filters.types.length > 0) {
        const existingCategoryInclude = include.find(inc => inc.model === Category);
        
        if (existingCategoryInclude) {
          existingCategoryInclude.where = {
            [Op.or]: [
              existingCategoryInclude.where,
              { category: { [Op.in]: filters.types.map(t => t.toLowerCase()) } }
            ]
          };
        } else {
          include.push({
            model: Category,
            as: 'categories',
            where: {
              category: { [Op.in]: filters.types.map(t => t.toLowerCase()) }
            },
            through: { attributes: [] },
            required: true,
          });
        }
      }
    }

    let order: any = [['created_at', 'DESC']];
    if (filters?.sortOrders && filters.sortOrders.length > 0) {
      order = filters.sortOrders;
    } else if (filters?.sort) {
      switch (filters.sort) {
        case 'price_asc':
          order = [['price', 'ASC']];
          break;
        case 'price_desc':
          order = [['price', 'DESC']];
          break;
        case 'rating':
        case 'rating_desc':
          order = [['rating', 'DESC']];
          break;
        case 'newest':
        case 'created_desc':
          order = [['created_at', 'DESC']];
          break;
        case 'name_asc':
          order = [['title', 'ASC']];
          break;
        case 'name_desc':
          order = [['title', 'DESC']];
          break;
        default:
          order = [['created_at', 'DESC']];
      }
    }

    console.log('🔍 Admin SQL where clause:', JSON.stringify(where, null, 2));
    console.log('📊 Admin order by:', order);
    console.log('🔗 Admin include:', JSON.stringify(include, null, 2));

    const { rows: tours, count: total } = await Tour.findAndCountAll({
      where,
      include: include.length > 0 ? include : undefined,
      limit,
      offset,
      order,
      distinct: true,
    });

    console.log(`✅ Admin found ${total} tours (page ${page}, limit ${limit})`);

    let currentPage = page;
    let currentTours = tours;

    if (total > 0) {
      const totalPages = Math.ceil(total / limit);
      if (page > totalPages) {
        currentPage = totalPages;
      }

      if (currentPage < 1) {
        currentPage = 1;
      }

      const adjustedOffset = (currentPage - 1) * limit;

      if (adjustedOffset !== offset) {
        currentTours = await Tour.findAll({
          where,
          include: include.length > 0 ? include : undefined,
          limit,
          offset: adjustedOffset,
          order,
        });
      }
    } else {
      currentPage = 1;
    }

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      tours: currentTours,
      pagination: {
        page: total > 0 ? currentPage : 1,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Phiên bản v2: capacity hiển thị còn lại/ tổng dựa trên đơn xác nhận
  async getAdminToursV2(page: number = 1, limit: number = 10, filters?: TourFilters) {
    const baseResult = await this.getAdminTours(page, limit, filters);
    const tours = baseResult.tours;

    const tourIds = tours.map((tour: any) => tour.id).filter((id: number) => !!id);
    let activeTicketMap: Record<number, number> = {};

    if (tourIds.length > 0) {
      const activeTickets = await Ticket.findAll({
        attributes: [
          [sequelize.col('order.tour_id'), 'tour_id'],
          [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'active_count'],
        ],
        include: [{
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            tour_id: { [Op.in]: tourIds },
          },
        }],
        where: {
          status: 'active',
        },
        group: ['order.tour_id'],
        raw: true,
      });

      activeTicketMap = activeTickets.reduce((acc: Record<number, number>, ticket: any) => {
        acc[ticket.tour_id] = Number(ticket.active_count) || 0;
        return acc;
      }, {});
    }

    const enrichedTours = tours.map((tour: any) => {
      const rawTour = typeof tour.toJSON === 'function' ? tour.toJSON() : tour;
      const totalCapacity = Number(rawTour.capacity) || 0;
      const activeCount = activeTicketMap[rawTour.id] || 0;
      const remaining = Math.max(totalCapacity - activeCount, 0);

      return {
        ...rawTour,
        capacity: `${remaining}/${totalCapacity}`,
        remaining_capacity: remaining,
        active_ticket_count: activeCount,
      };
    });

    return {
      tours: enrichedTours,
      pagination: baseResult.pagination,
    };
  }

  // Lấy chi tiết tour
  async getTourById(id: number) {
    // Validation: Đảm bảo ID là số hợp lệ
    if (isNaN(id) || id <= 0) {
      throw new Error('ID tour không hợp lệ');
    }

    const tour = await Tour.findByPk(id, {
      include: [{
        model: Category,
        as: 'categories',
        through: { attributes: [] }, // Ẩn trường bảng trung gian
      }]
    });

    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    // Đảm bảo id là number trước khi dùng trong query
    const tourId = Number(id);
    
    if (isNaN(tourId)) {
      throw new Error('ID tour không hợp lệ');
    }

    // Lấy thêm thông tin liên quan
    const [schedule, includes, excludes, gallery, reviews] = await Promise.all([
      TourSchedule.findAll({ where: { tour_id: tourId }, order: [['day_number', 'ASC']] }),
      TourInclude.findAll({ where: { tour_id: tourId } }),
      TourExclude.findAll({ where: { tour_id: tourId } }),
      TourGallery.findAll({ where: { tour_id: tourId } }),
      Review.findAll({
        where: { tour_id: tourId },
        limit: 10,
        order: [['created_at', 'DESC']],
      }),
    ]);

    // Tính số vé đã bán dựa trên các đơn hàng confirmed trong khoảng start_date và end_date của tour
    const tourData = tour.toJSON();
    const tourStartDate = tourData.start_date;
    const tourEndDate = tourData.end_date;

    let ticketsSold = 0;
    if (tourStartDate && tourEndDate) {
      // Chuyển đổi sang string format YYYY-MM-DD để so sánh với DATEONLY
      const tourStartDateStr = tourStartDate instanceof Date 
        ? tourStartDate.toISOString().split('T')[0] 
        : String(tourStartDate).split('T')[0];
      const tourEndDateStr = tourEndDate instanceof Date 
        ? tourEndDate.toISOString().split('T')[0] 
        : String(tourEndDate).split('T')[0];

      // Tìm các đơn hàng confirmed có khoảng thời gian nằm trong khoảng start_date và end_date của tour
      // Điều kiện: order.start_date >= tour.start_date AND order.end_date <= tour.end_date
      const confirmedOrders = await Order.findAll({
        where: {
          tour_id: tourId,
          status: { [Op.in]: ['confirmed', 'pending'] },
          start_date: {
            [Op.gte]: tourStartDateStr,
            [Op.lte]: tourEndDateStr,
          },
          end_date: {
            [Op.gte]: tourStartDateStr,
            [Op.lte]: tourEndDateStr,
          },
        },
        attributes: ['quantity'],
      });

      // Tính tổng số vé đã bán
      ticketsSold = confirmedOrders.reduce((sum, order) => {
        const quantity = order.getDataValue ? order.getDataValue('quantity') : order.quantity;
        return sum + (Number(quantity) || 0);
      }, 0);
    }

    return {
      ...tourData,
      schedule,
      includes,
      excludes,
      gallery,
      reviews,
      tickets_sold: ticketsSold,
    };
  }

  // Tạo tour mới
  async createTour(data: CreateTourDTO) {
    const { 
      category_ids, 
      categories, 
      schedule, 
      includes, 
      excludes, 
      gallery,
      price,
      latitude,
      longitude,
      start_date,
      end_date,
      ...tourData 
    } = data;
    
    // Sử dụng transaction để đảm bảo tính nhất quán
    const transaction = await sequelize.transaction();
    
    try {
      // Parse và chuẩn hóa dữ liệu
      let parsedCategoryIds: number[] = [];
      
      // Xử lý categories: có thể là chuỗi "1,2,3" hoặc mảng [1,2,3]
      if (categories) {
        if (typeof categories === 'string') {
          // Parse chuỗi "1,2,3" thành mảng [1,2,3]
          parsedCategoryIds = categories
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id) && id > 0);
        } else if (Array.isArray(categories)) {
          parsedCategoryIds = categories.map(id => 
            typeof id === 'string' ? parseInt(id, 10) : id
          ).filter(id => !isNaN(id) && id > 0);
        }
      }
      
      // Nếu có category_ids (tương thích ngược), ưu tiên dùng nó
      if (category_ids && category_ids.length > 0) {
        parsedCategoryIds = category_ids;
      }
      
      // Chuẩn hóa price, latitude, longitude
      const normalizedPrice = typeof price === 'string' ? parseFloat(price) : price;
      const normalizedLatitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      const normalizedLongitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      
      // Kiểm tra guide rảnh nếu có start_date và end_date
      if (start_date && end_date) {
        const hasAvailableGuide = await tourGuideAssignmentService.checkAvailableGuidesForDates(start_date, end_date);
        if (!hasAvailableGuide) {
          throw new Error('Hiện tại không có hướng dẫn viên nào còn rảnh cho khoảng thời gian này. Vui lòng chọn khoảng thời gian khác.');
        }
      }
      
      // Tạo tour với dữ liệu đã chuẩn hóa
      const tour = await Tour.create({
        ...tourData,
        price: normalizedPrice,
        latitude: normalizedLatitude || 0,
        longitude: normalizedLongitude || 0,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
      } as any, { transaction });
      
      // Tạo categories nếu có
      if (parsedCategoryIds.length > 0) {
        const tourCategoryData = parsedCategoryIds.map(categoryId => ({
          tour_id: tour.id,
          category_id: categoryId,
        }));
        
        await TourCategory.bulkCreate(tourCategoryData, { transaction });
      }
      
      // Tạo schedule nếu có
      if (schedule && Array.isArray(schedule) && schedule.length > 0) {
        const scheduleData = schedule.map(s => ({
          tour_id: tour.id,
          day_number: s.day_number,
          title: s.title,
          detail: s.detail || undefined,
        }));
        
        await TourSchedule.bulkCreate(scheduleData, { transaction });
      }
      
      // Tạo includes nếu có
      if (includes && Array.isArray(includes) && includes.length > 0) {
        const includesData = includes.map(inc => ({
          tour_id: tour.id,
          item: inc.item,
        }));
        
        await TourInclude.bulkCreate(includesData, { transaction });
      }
      
      // Tạo excludes nếu có
      if (excludes && Array.isArray(excludes) && excludes.length > 0) {
        const excludesData = excludes.map(exc => ({
          tour_id: tour.id,
          item: exc.item,
        }));
        
        await TourExclude.bulkCreate(excludesData, { transaction });
      }
      
      // Tạo gallery nếu có
      if (gallery && Array.isArray(gallery) && gallery.length > 0) {
        const galleryData = gallery.map(img => ({
          tour_id: tour.id,
          image_url: img.image_url,
        }));
        
        await TourGallery.bulkCreate(galleryData, { transaction });
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Lấy lại tour với đầy đủ thông tin
      const tourWithDetails = await Tour.findByPk(tour.id, {
        include: [{
          model: Category,
          as: 'categories',
          through: { attributes: [] },
        }]
      });
      
      // Lấy thêm schedule, includes, excludes, gallery
      const [tourSchedule, tourIncludes, tourExcludes, tourGallery] = await Promise.all([
        TourSchedule.findAll({ where: { tour_id: tour.id }, order: [['day_number', 'ASC']] }),
        TourInclude.findAll({ where: { tour_id: tour.id } }),
        TourExclude.findAll({ where: { tour_id: tour.id } }),
        TourGallery.findAll({ where: { tour_id: tour.id } }),
      ]);
      
      return {
        ...tourWithDetails?.toJSON(),
        schedule: tourSchedule,
        includes: tourIncludes,
        excludes: tourExcludes,
        gallery: tourGallery,
      };
    } catch (error: any) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      console.error('❌ Error creating tour, transaction rolled back:', error);
      throw error;
    }
  }

  // Cập nhật tour
  async updateTour(id: number, data: Partial<CreateTourDTO>) {
    const tour = await Tour.findByPk(id);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    const { 
      category_ids, 
      categories, 
      schedule, 
      includes, 
      excludes, 
      gallery,
      price,
      latitude,
      longitude,
      start_date,
      end_date,
      ...tourData 
    } = data;
    
    // Sử dụng transaction để đảm bảo tính nhất quán
    const transaction = await sequelize.transaction();
    
    try {
      // Parse và chuẩn hóa dữ liệu
      let parsedCategoryIds: number[] | undefined = undefined;
      
      // Xử lý categories: có thể là chuỗi "1,2,3" hoặc mảng [1,2,3]
      if (categories !== undefined) {
        parsedCategoryIds = [];
        if (typeof categories === 'string') {
          // Parse chuỗi "1,2,3" thành mảng [1,2,3]
          parsedCategoryIds = categories
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id) && id > 0);
        } else if (Array.isArray(categories)) {
          parsedCategoryIds = categories.map(id => 
            typeof id === 'string' ? parseInt(id, 10) : id
          ).filter(id => !isNaN(id) && id > 0);
        }
      }
      
      // Nếu có category_ids (tương thích ngược), ưu tiên dùng nó
      if (category_ids !== undefined) {
        parsedCategoryIds = category_ids;
      }
      
      // Chuẩn hóa price, latitude, longitude (chỉ chuẩn hóa nếu có trong data)
      const updateData: any = { ...tourData };
      
      if (price !== undefined) {
        updateData.price = typeof price === 'string' ? parseFloat(price) : price;
      }
      if (latitude !== undefined) {
        updateData.latitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      }
      if (longitude !== undefined) {
        updateData.longitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      }
      if (start_date !== undefined) {
        updateData.start_date = start_date ? new Date(start_date) : undefined;
      }
      if (end_date !== undefined) {
        updateData.end_date = end_date ? new Date(end_date) : undefined;
      }
      
      // Kiểm tra guide rảnh nếu có start_date và end_date (mới hoặc cập nhật)
      const finalStartDate = updateData.start_date || tour.start_date;
      const finalEndDate = updateData.end_date || tour.end_date;
      
      if (finalStartDate && finalEndDate) {
        const hasAvailableGuide = await tourGuideAssignmentService.checkAvailableGuidesForDates(
          finalStartDate, 
          finalEndDate, 
          id // Loại trừ tour hiện tại khi kiểm tra
        );
        if (!hasAvailableGuide) {
          await transaction.rollback();
          throw new Error('Hiện tại không có hướng dẫn viên nào còn rảnh cho khoảng thời gian này. Vui lòng chọn khoảng thời gian khác.');
        }
      }
      
      console.log('🔄 Updating tour:', id);
      console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
      console.log('📅 Schedule:', schedule?.length || 0, 'items');
      console.log('✅ Includes:', includes?.length || 0, 'items');
      console.log('❌ Excludes:', excludes?.length || 0, 'items');
      console.log('🖼️ Gallery:', gallery?.length || 0, 'items');
      
      // Cập nhật thông tin tour
      await tour.update(updateData, { transaction });
      
      // Cập nhật categories nếu có
      if (parsedCategoryIds !== undefined) {
        console.log('🏷️ Updating categories:', parsedCategoryIds);
        // Xóa tất cả categories cũ
        await TourCategory.destroy({ where: { tour_id: id }, transaction });
        
        // Thêm categories mới
        if (parsedCategoryIds.length > 0) {
          const tourCategoryData = parsedCategoryIds.map(categoryId => ({
            tour_id: id,
            category_id: categoryId,
          }));
          
          await TourCategory.bulkCreate(tourCategoryData, { transaction });
        }
      }
      
      // Cập nhật schedule nếu có
      if (schedule !== undefined) {
        console.log('📅 Updating schedule...');
        // Xóa tất cả schedule cũ
        const deletedSchedule = await TourSchedule.destroy({ where: { tour_id: id }, transaction });
        console.log(`🗑️ Deleted ${deletedSchedule} old schedule items`);
        
        // Tạo schedule mới nếu có
        if (Array.isArray(schedule) && schedule.length > 0) {
          const scheduleData = schedule.map(s => ({
            tour_id: id,
            day_number: s.day_number,
            title: s.title,
            detail: s.detail || undefined,
          }));
          
          const createdSchedule = await TourSchedule.bulkCreate(scheduleData, { transaction });
          console.log(`✅ Created ${createdSchedule.length} new schedule items`);
        }
      }
      
      // Cập nhật includes nếu có
      if (includes !== undefined) {
        console.log('✅ Updating includes...');
        // Xóa tất cả includes cũ
        const deletedIncludes = await TourInclude.destroy({ where: { tour_id: id }, transaction });
        console.log(`🗑️ Deleted ${deletedIncludes} old includes`);
        
        // Tạo includes mới nếu có
        if (Array.isArray(includes) && includes.length > 0) {
          const includesData = includes.map(inc => ({
            tour_id: id,
            item: inc.item,
          }));
          
          const createdIncludes = await TourInclude.bulkCreate(includesData, { transaction });
          console.log(`✅ Created ${createdIncludes.length} new includes`);
        }
      }
      
      // Cập nhật excludes nếu có
      if (excludes !== undefined) {
        console.log('❌ Updating excludes...');
        // Xóa tất cả excludes cũ
        const deletedExcludes = await TourExclude.destroy({ where: { tour_id: id }, transaction });
        console.log(`🗑️ Deleted ${deletedExcludes} old excludes`);
        
        // Tạo excludes mới nếu có
        if (Array.isArray(excludes) && excludes.length > 0) {
          const excludesData = excludes.map(exc => ({
            tour_id: id,
            item: exc.item,
          }));
          
          const createdExcludes = await TourExclude.bulkCreate(excludesData, { transaction });
          console.log(`✅ Created ${createdExcludes.length} new excludes`);
        }
      }
      
      // Cập nhật gallery nếu có
      if (gallery !== undefined) {
        console.log('🖼️ Updating gallery...');
        // Xóa tất cả gallery cũ
        const deletedGallery = await TourGallery.destroy({ where: { tour_id: id }, transaction });
        console.log(`🗑️ Deleted ${deletedGallery} old gallery items`);
        
        // Tạo gallery mới nếu có
        if (Array.isArray(gallery) && gallery.length > 0) {
          const galleryData = gallery.map(img => ({
            tour_id: id,
            image_url: img.image_url,
          }));
          
          const createdGallery = await TourGallery.bulkCreate(galleryData, { transaction });
          console.log(`✅ Created ${createdGallery.length} new gallery items`);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      // Lấy lại tour với đầy đủ thông tin
      const updatedTour = await Tour.findByPk(id, {
        include: [{
          model: Category,
          as: 'categories',
          through: { attributes: [] },
        }]
      });
      
      // Lấy thêm schedule, includes, excludes, gallery
      const [tourSchedule, tourIncludes, tourExcludes, tourGallery] = await Promise.all([
        TourSchedule.findAll({ where: { tour_id: id }, order: [['day_number', 'ASC']] }),
        TourInclude.findAll({ where: { tour_id: id } }),
        TourExclude.findAll({ where: { tour_id: id } }),
        TourGallery.findAll({ where: { tour_id: id } }),
      ]);
      
      console.log('📊 Final data counts:');
      console.log(`  - Schedule: ${tourSchedule.length}`);
      console.log(`  - Includes: ${tourIncludes.length}`);
      console.log(`  - Excludes: ${tourExcludes.length}`);
      console.log(`  - Gallery: ${tourGallery.length}`);
      
      return {
        ...updatedTour?.toJSON(),
        schedule: tourSchedule,
        includes: tourIncludes,
        excludes: tourExcludes,
        gallery: tourGallery,
      };
    } catch (error: any) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      console.error('❌ Error updating tour, transaction rolled back:', error);
      throw error;
    }
  }

  // Xóa tour (Soft Delete - chỉ ẩn khỏi danh sách)
  async deleteTour(id: number) {
    const tour = await Tour.findByPk(id);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    await tour.update({ is_active: false });
    return { message: 'Xóa tour thành công (soft delete)' };
  }

  // Xóa tour vĩnh viễn (Hard Delete - xóa hoàn toàn khỏi database)
  async hardDeleteTour(id: number) {
    const tour = await Tour.findByPk(id);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    // Xóa tất cả dữ liệu liên quan trước
    await Promise.all([
      TourSchedule.destroy({ where: { tour_id: id } }),
      TourInclude.destroy({ where: { tour_id: id } }),
      TourExclude.destroy({ where: { tour_id: id } }),
      TourGallery.destroy({ where: { tour_id: id } }),
      Review.destroy({ where: { tour_id: id } }),
    ]);

    // Xóa tour chính
    await tour.destroy();
    
    return { message: 'Xóa tour vĩnh viễn thành công (hard delete)' };
  }

  // Thêm lịch trình tour
  async addTourSchedule(tourId: number, dayNumber: number, title: string, detail?: string) {
    const tour = await Tour.findByPk(tourId);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    const schedule = await TourSchedule.create({
      tour_id: tourId,
      day_number: dayNumber,
      title,
      detail,
    });

    return schedule;
  }

  // Thêm dịch vụ bao gồm
  async addTourInclude(tourId: number, item: string) {
    const tour = await Tour.findByPk(tourId);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    const include = await TourInclude.create({
      tour_id: tourId,
      item,
    });

    return include;
  }

  // Thêm dịch vụ không bao gồm
  async addTourExclude(tourId: number, item: string) {
    const tour = await Tour.findByPk(tourId);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    const exclude = await TourExclude.create({
      tour_id: tourId,
      item,
    });

    return exclude;
  }

  // Thêm ảnh vào gallery
  async addTourGallery(tourId: number, imageUrl: string) {
    const tour = await Tour.findByPk(tourId);
    
    if (!tour) {
      throw new Error('Tour không tồn tại');
    }

    const gallery = await TourGallery.create({
      tour_id: tourId,
      image_url: imageUrl,
    });

    return gallery;
  }

  // Lấy tours nổi bật (rating cao nhất)
  async getFeaturedTours(limit: number = 6) {
    // Lấy rất nhiều tours để đảm bảo có đủ destination khác nhau (lấy ít nhất 100 tours)
    const fetchLimit = Math.max(limit * 10, 100);
    const allTours = await Tour.findAll({
      where: { 
        is_active: true
      },
      order: [['rating', 'DESC'], ['total_reviews', 'DESC']],
      limit: fetchLimit,
    });

    // Helper function để normalize destination
    // Lấy phần đầu tiên trước dấu phẩy (tên thành phố), loại bỏ khoảng trắng và chuyển lowercase
    const normalizeDestination = (destination: string | null | undefined): string | null => {
      if (!destination) return null;
      
      // Trim và lowercase
      let normalized = destination.trim().toLowerCase();
      
      // Lấy phần đầu tiên trước dấu phẩy (nếu có)
      // Ví dụ: "Nha Trang, Khánh Hòa" -> "nha trang"
      const commaIndex = normalized.indexOf(',');
      if (commaIndex > 0) {
        normalized = normalized.substring(0, commaIndex).trim();
      }
      
      // Loại bỏ khoảng trắng thừa (thay nhiều khoảng trắng bằng 1)
      normalized = normalized.replace(/\s+/g, ' ').trim();
      
      return normalized || null;
    };

    // Lọc chỉ lấy tours có destination hợp lệ
    const toursWithDestination = allTours.filter(tour => {
      const normalized = normalizeDestination(tour.destination);
      return normalized && normalized.length > 0;
    });

    // Lọc để đảm bảo mỗi tour có destination khác nhau
    // Ưu tiên tours có rating cao và reviews nhiều
    const uniqueDestinationTours: Tour[] = [];
    const seenDestinations = new Set<string>();

    // Vòng lặp đầu tiên: Lấy tours với destination khác nhau, ưu tiên rating cao
    for (const tour of toursWithDestination) {
      const normalizedDestination = normalizeDestination(tour.destination);
      
      if (!normalizedDestination) {
        continue;
      }

      // Nếu destination chưa được thấy, thêm tour vào kết quả
      if (!seenDestinations.has(normalizedDestination)) {
        seenDestinations.add(normalizedDestination);
        uniqueDestinationTours.push(tour);

        // Đã đủ số lượng yêu cầu
        if (uniqueDestinationTours.length >= limit) {
          break;
        }
      }
    }

    // Nếu vẫn chưa đủ, lấy thêm tours từ database với offset lớn hơn
    if (uniqueDestinationTours.length < limit) {
      let offset = fetchLimit;
      const maxAttempts = 5; // Tối đa 5 lần thử
      let attempts = 0;

      while (uniqueDestinationTours.length < limit && attempts < maxAttempts) {
        const additionalTours = await Tour.findAll({
          where: { 
            is_active: true
          },
          order: [['rating', 'DESC'], ['total_reviews', 'DESC']],
          limit: 50,
          offset: offset,
        });

        if (additionalTours.length === 0) {
          break; // Không còn tours nào
        }

        for (const tour of additionalTours) {
          if (uniqueDestinationTours.length >= limit) {
            break;
          }

          // Bỏ qua tour đã có trong kết quả
          if (uniqueDestinationTours.some(t => t.id === tour.id)) {
            continue;
          }

          const normalizedDestination = normalizeDestination(tour.destination);
          if (!normalizedDestination) {
            continue;
          }

          // Ưu tiên destination chưa có
          if (!seenDestinations.has(normalizedDestination)) {
            seenDestinations.add(normalizedDestination);
            uniqueDestinationTours.push(tour);
          }
        }

        offset += 50;
        attempts++;
      }
    }

    // Nếu vẫn chưa đủ (trường hợp hiếm - không đủ destination khác nhau trong database)
    // Thì mới lấy tours trùng destination, nhưng vẫn ưu tiên rating cao
    if (uniqueDestinationTours.length < limit) {
      for (const tour of toursWithDestination) {
        if (uniqueDestinationTours.length >= limit) {
          break;
        }

        // Bỏ qua tour đã có trong kết quả
        if (uniqueDestinationTours.some(t => t.id === tour.id)) {
          continue;
        }

        uniqueDestinationTours.push(tour);
      }
    }

    return uniqueDestinationTours.slice(0, limit);
  }

  // Lấy 8 tour có doanh thu cao nhất dựa trên tổng total_price từ orders
  async getMostBookedTours(limit: number = 8) {
    // Tính tổng total_price (doanh thu) từ orders có status confirmed hoặc completed cho mỗi tour
    const topToursRaw = (await Order.findAll({
      attributes: [
        'tour_id',
        [fn('SUM', col('Order.total_price')), 'totalRevenue'],
      ],
      where: {
        status: { [Op.in]: ['confirmed', 'completed'] }, // Lấy cả confirmed và completed
      },
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: [
            'id',
            'tour_code',
            'title',
            'description',
            'destination',
            'departure',
            'start_date',
            'end_date',
            'duration',
            'price',
            'capacity',
            'rating',
            'total_reviews',
            'latitude',
            'longitude',
            'main_image',
            'is_active',
          ],
          where: {
            is_active: true, // Chỉ lấy tours đang active
          },
          required: true, // INNER JOIN
        },
      ],
      group: ['tour_id', 'tour.id'],
      order: [[literal('totalRevenue'), 'DESC']],
      limit,
      raw: true,
      nest: true,
    })) as any[];

    // Format kết quả - với nest: true, dữ liệu sẽ có cấu trúc { tour_id, totalRevenue, tour: {...} }
    const tours = topToursRaw.map((row: any) => {
      const tour = row.tour || {};
      const totalRevenue = Number(row.totalRevenue || 0);
      
      return {
        ...tour,
        totalRevenue,
      };
    });

    return tours;
  }

  // Lấy 10 ảnh ngẫu nhiên cho thư viện điểm đến
  async getDestinationGallery(limit: number = 10) {
    // Lấy ảnh từ các tour đang active, sắp xếp ngẫu nhiên
    const galleries = await TourGallery.findAll({
      attributes: ['image_url'], // Chỉ lấy image_url
      include: [
        {
          model: Tour,
          as: 'tour',
          where: { is_active: true },
          attributes: [], // Không lấy thông tin tour
        },
      ],
      order: sequelize.random(), // Sắp xếp ngẫu nhiên
      limit,
    });

    // Chỉ trả về danh sách URL ảnh (dùng get() để lấy giá trị từ Sequelize instance)
    return galleries.map((gallery: any) => gallery.get('image_url'));
  }

  // Đề xuất tour dựa vào danh mục người dùng hay mua nhất
  async getRecommendedToursByUserCategory(userId: number, limit: number = 10) {
    // Bước 1: Lấy tất cả orders của user có status = 'completed'
    const completedOrders = await Order.findAll({
      where: {
        user_id: userId,
        status: 'completed',
      },
      attributes: ['tour_id'],
    });

    // Nếu user chưa có order nào completed, trả về tours nổi bật
    if (completedOrders.length === 0) {
      return await this.getFeaturedTours(limit);
    }

    // Bước 2: Lấy danh sách tour_ids từ các orders
    const tourIds = completedOrders.map((order: any) => {
      const tourId = order.getDataValue ? order.getDataValue('tour_id') : order.tour_id;
      return Number(tourId);
    });

    // Bước 3: Lấy category_ids từ tour_categories dựa trên tour_ids
    const tourCategories = await TourCategory.findAll({
      where: {
        tour_id: { [Op.in]: tourIds },
      },
      attributes: ['category_id'],
    });

    // Nếu không có category nào, trả về tours nổi bật
    if (tourCategories.length === 0) {
      return await this.getFeaturedTours(limit);
    }

    // Bước 4: Đếm số lượng tour trong mỗi category
    const categoryCounts: { [key: number]: number } = {};
    tourCategories.forEach((tc: any) => {
      const categoryId = tc.getDataValue ? tc.getDataValue('category_id') : tc.category_id;
      const catId = Number(categoryId);
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });

    // Bước 5: Tìm category có nhiều tour nhất
    let maxCount = 0;
    let favoriteCategoryId: number | null = null;
    for (const [categoryId, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategoryId = Number(categoryId);
      }
    }

    // Nếu không tìm thấy category, trả về tours nổi bật
    if (!favoriteCategoryId) {
      return await this.getFeaturedTours(limit);
    }

    // Bước 6: Lấy tours từ category đó (không bao gồm tours user đã mua)
    const recommendedTours = await Tour.findAll({
      where: {
        is_active: true,
        id: { [Op.notIn]: tourIds }, // Loại bỏ tours user đã mua
      },
      include: [
        {
          model: Category,
          as: 'categories',
          where: {
            id: favoriteCategoryId,
          },
          through: { attributes: [] },
          required: true, // INNER JOIN - chỉ lấy tours có category này
        },
      ],
      order: [
        ['rating', 'DESC'],
        ['total_reviews', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
    });

    // Nếu không đủ tours trong category, bổ sung bằng tours nổi bật (không trùng)
    if (recommendedTours.length < limit) {
      const recommendedTourIds = recommendedTours.map((tour: any) => {
        const id = tour.getDataValue ? tour.getDataValue('id') : tour.id;
        return Number(id);
      });

      const additionalTours = await Tour.findAll({
        where: {
          is_active: true,
          id: { [Op.notIn]: [...tourIds, ...recommendedTourIds] },
        },
        order: [['rating', 'DESC'], ['total_reviews', 'DESC']],
        limit: limit - recommendedTours.length,
      });

      return [...recommendedTours, ...additionalTours];
    }

    return recommendedTours;
  }

  // Deactivate tours 2 days before start_date (start_date <= current_date + 2 days)
  async deactivateExpiredTours(): Promise<{ count: number; tourIds: number[] }> {
    try {
      // Helper: format Date to YYYY-MM-DD using LOCAL time (tránh lệch ngày do UTC+7)
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const today = new Date();
      // Set time to 00:00:00 local time to compare only dates
      today.setHours(0, 0, 0, 0);

      // Calculate date 2 days from today (local)
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      const twoDaysFromNowString = formatLocalDate(twoDaysFromNow); // Format: YYYY-MM-DD (local)

      // Find all active tours where start_date <= today + 2 days
      // Tức là: nếu hôm nay >= (start_date - 2 ngày) thì vô hiệu hóa tour
      const expiredTours = await Tour.findAll({
        where: {
          is_active: true,
          start_date: {
            [Op.lte]: twoDaysFromNowString,
          },
        },
        attributes: ['id', 'start_date'],
      });

      if (expiredTours.length === 0) {
        console.log('✅ [tuandz] Không có tour nào cần vô hiệu hóa (start_date <= hôm nay + 2 ngày)');
        return { count: 0, tourIds: [] };
      }

      const tourIds = expiredTours.map((tour) => tour.id);
      const startDates = expiredTours.map((tour) => {
        const startDate = tour.getDataValue ? tour.getDataValue('start_date') : tour.start_date;
        return startDate;
      });

      // Update is_active to false for all tours where start_date <= today + 2 days
      const [updatedCount] = await Tour.update(
        { is_active: false },
        {
          where: {
            id: {
              [Op.in]: tourIds,
            },
          },
        }
      );

      console.log(`✅ Đã vô hiệu hóa ${updatedCount} tour (start_date <= hôm nay + 2 ngày). Tour IDs: ${tourIds.join(', ')}`);
      console.log(`📅 Các tour bị vô hiệu hóa có start_date: ${startDates.join(', ')}`);

      return {
        count: updatedCount,
        tourIds,
      };
    } catch (error) {
      console.error('❌ Lỗi khi vô hiệu hóa tours hết hạn:', error);
      throw error;
    }
  }
}

export default new TourService();
