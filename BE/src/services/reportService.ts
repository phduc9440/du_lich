import { col, fn, literal, Op, WhereOptions } from 'sequelize';
import { Order, Review, Tour, User } from '../models';
import { buildDateFilter, DateRangeOptions, RangeUnit, resolveDateRange } from '../utils/dateRange';

const COMPLETED_ORDER_STATUSES: Array<'confirmed' | 'completed'> = ['confirmed', 'completed'];

const toNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundTwoDecimals = (value: any): number => Math.round(toNumber(value) * 100) / 100;

type PeriodExpression = {
  select: ReturnType<typeof fn> | ReturnType<typeof literal>;
  groupBy: ReturnType<typeof fn> | string;
};

type OrderMetric = 'revenue' | 'tickets';

type RevenueSummaryRow = {
  totalRevenue: string | number | null;
  orderCount: string | number | null;
  totalTickets: string | number | null;
};

type RevenueBreakdownRow = RevenueSummaryRow & {
  period: string;
  sortDate: string;
};

type TopTourRow = {
  tour_id: number;
  totalRevenue: string | number | null;
  totalTickets: string | number | null;
  orderCount: string | number | null;
  tour: {
    id: number;
    title: string;
    destination?: string;
    main_image?: string;
  };
};

type TopRatedRow = {
  tour_id: number;
  avgRating: string | number | null;
  reviewCount: string | number | null;
  tour: TopTourRow['tour'];
};

type TopUserRow = {
  user_id: number;
  totalSpent: string | number | null;
  orderCount: string | number | null;
  lastOrderAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
};

class ReportService {
  private getOrderDateFilters(options: DateRangeOptions) {
    const { startDate, endDate } = resolveDateRange(options);
    const where: WhereOptions = {
      created_at: buildDateFilter(startDate, endDate),
      is_paid: true,
      status: { [Op.in]: COMPLETED_ORDER_STATUSES },
    };

    return { where, startDate, endDate };
  }

  private getPeriodExpression(range: RangeUnit = 'month'): PeriodExpression {
    const createdAtCol = col('Order.created_at');
    switch (range) {
      case 'day':
        return {
          select: fn('DATE_FORMAT', createdAtCol, '%Y-%m-%d'),
          groupBy: fn('DATE_FORMAT', createdAtCol, '%Y-%m-%d'),
        };
      case 'year':
        return {
          select: fn('DATE_FORMAT', createdAtCol, '%Y'),
          groupBy: fn('DATE_FORMAT', createdAtCol, '%Y'),
        };
      case 'quarter': {
        const quarterExpr = fn(
          'CONCAT',
          fn('YEAR', createdAtCol),
          literal("'-Q'"),
          fn('QUARTER', createdAtCol)
        );
        return {
          select: quarterExpr,
          groupBy: quarterExpr,
        };
      }
      case 'month':
      default:
        return {
          select: fn('DATE_FORMAT', createdAtCol, '%Y-%m'),
          groupBy: fn('DATE_FORMAT', createdAtCol, '%Y-%m'),
        };
    }
  }

  async getRevenueStats(options: DateRangeOptions & { range?: RangeUnit }) {
    const { where, startDate, endDate } = this.getOrderDateFilters(options);
    const summaryRaw = (await Order.findOne({
      attributes: [
        [fn('SUM', col('Order.total_price')), 'totalRevenue'],
        [fn('COUNT', col('Order.id')), 'orderCount'],
        [fn('SUM', col('Order.quantity')), 'totalTickets'],
      ],
      where,
      raw: true,
    })) as unknown as RevenueSummaryRow | null;

    const totalRevenue = toNumber(summaryRaw?.totalRevenue);
    const orderCount = toNumber(summaryRaw?.orderCount);
    const totalTickets = toNumber(summaryRaw?.totalTickets);
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    const periodExpression = this.getPeriodExpression(options.range);
    const breakdownRaw = (await Order.findAll({
      attributes: [
        [periodExpression.select, 'period'],
        [fn('SUM', col('Order.total_price')), 'totalRevenue'],
        [fn('SUM', col('Order.quantity')), 'totalTickets'],
        [fn('COUNT', col('Order.id')), 'orderCount'],
        [fn('MIN', col('Order.created_at')), 'sortDate'],
      ],
      where,
      group: [periodExpression.groupBy],
      raw: true,
    })) as unknown as RevenueBreakdownRow[];

    const breakdown = breakdownRaw
      .map((row) => ({
        period: row.period as string,
        totalRevenue: toNumber(row.totalRevenue),
        totalTickets: toNumber(row.totalTickets),
        orderCount: toNumber(row.orderCount),
        sortDate: new Date(row.sortDate as string),
      }))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ sortDate, ...rest }) => rest);

    return {
      range: {
        startDate,
        endDate,
      },
      summary: {
        totalRevenue,
        orderCount,
        totalTickets,
        averageOrderValue,
      },
      breakdown,
    };
  }

  async getTopTours(options: DateRangeOptions & { metric?: OrderMetric; limit?: number; search?: string }) {
    const metric = options.metric ?? 'revenue';
    const limit = options.limit ?? 10;
    const { where } = this.getOrderDateFilters(options);

    // Build search filter for Tour model
    const tourWhere: WhereOptions | undefined = options.search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${options.search}%` } },
            { destination: { [Op.like]: `%${options.search}%` } },
            { tour_code: { [Op.like]: `%${options.search}%` } },
          ],
        }
      : undefined;

    // Build include config for Tour
    const tourInclude: any = {
      model: Tour,
      as: 'tour',
      attributes: ['id', 'title', 'tour_code', 'main_image', 'destination'],
    };

    // Add where condition and required flag only when search is provided
    if (tourWhere) {
      tourInclude.where = tourWhere;
      tourInclude.required = true; // INNER JOIN khi có search filter
    }

    // Đếm tổng số tour (không bị giới hạn bởi limit)
    let total = 0;
    if (options.search) {
      // Nếu có search, cần JOIN với Tour để filter
      const totalCountResult = (await Order.findOne({
        attributes: [
          [fn('COUNT', fn('DISTINCT', col('Order.tour_id'))), 'total'],
        ],
        include: [
          {
            model: Tour,
            as: 'tour',
            attributes: [],
            where: tourWhere,
            required: true,
          },
        ],
        where,
        raw: true,
      })) as unknown as { total: string | number } | null;
      total = toNumber(totalCountResult?.total || 0);
    } else {
      // Nếu không có search, chỉ cần đếm từ Order
      const totalCountResult = (await Order.findOne({
        attributes: [
          [fn('COUNT', fn('DISTINCT', col('Order.tour_id'))), 'total'],
        ],
        where,
        raw: true,
      })) as unknown as { total: string | number } | null;
      total = toNumber(totalCountResult?.total || 0);
    }

    const topToursRaw = (await Order.findAll({
      attributes: [
        'tour_id',
        [fn('SUM', col('Order.total_price')), 'totalRevenue'],
        [fn('SUM', col('Order.quantity')), 'totalTickets'],
        [fn('COUNT', col('Order.id')), 'orderCount'],
      ],
      include: [tourInclude],
      where,
      group: ['tour_id', 'tour.id'],
      order:
        metric === 'tickets'
          ? [[literal('totalTickets'), 'DESC']]
          : [[literal('totalRevenue'), 'DESC']],
      limit,
      raw: true,
      nest: true,
    })) as unknown as TopTourRow[];

    const data = topToursRaw.map((row, index) => ({
      rank: index + 1,
      tour: row.tour,
      totalRevenue: toNumber(row.totalRevenue),
      totalTickets: toNumber(row.totalTickets),
      orderCount: toNumber(row.orderCount),
    }));

    return {
      total,
      data,
    };
  }

  async getTopRatedTours(options: DateRangeOptions & { limit?: number; minReviews?: number; search?: string }) {
    const limit = options.limit ?? 10;
    const minReviews = options.minReviews ?? 3;
    const { startDate, endDate } = resolveDateRange(options);

    // Build search filter for Tour model
    const tourWhere: WhereOptions | undefined = options.search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${options.search}%` } },
            { destination: { [Op.like]: `%${options.search}%` } },
            { tour_code: { [Op.like]: `%${options.search}%` } },
          ],
        }
      : undefined;

    // Build include config for Tour
    const tourInclude: any = {
      model: Tour,
      as: 'tour',
      attributes: ['id', 'title', 'tour_code', 'main_image', 'destination'],
    };

    // Add where condition and required flag only when search is provided
    if (tourWhere) {
      tourInclude.where = tourWhere;
      tourInclude.required = true; // INNER JOIN khi có search filter
    }

    const topRatedRaw = (await Review.findAll({
      attributes: [
        'tour_id',
        [fn('AVG', col('Review.rating')), 'avgRating'],
        [fn('COUNT', col('Review.id')), 'reviewCount'],
      ],
      include: [tourInclude],
      where: {
        created_at: buildDateFilter(startDate, endDate),
      },
      group: ['tour_id', 'tour.id'],
      having: literal(`COUNT(*) >= ${minReviews}`),
      order: [
        [literal('avgRating'), 'DESC'],
        [literal('reviewCount'), 'DESC'],
      ],
      limit,
      raw: true,
      nest: true,
    })) as unknown as TopRatedRow[];

    return topRatedRaw.map((row, index) => ({
      rank: index + 1,
      tour: row.tour,
      averageRating: roundTwoDecimals(row.avgRating),
      reviewCount: toNumber(row.reviewCount),
    }));
  }

  async getTopUsers(options: DateRangeOptions & { limit?: number; search?: string }) {
    const limit = options.limit ?? 20;
    const { where } = this.getOrderDateFilters(options);

    // Build search filter for User model
    const userWhere: WhereOptions | undefined = options.search
      ? (() => {
          const searchConditions: any[] = [
            // Tìm theo tên khách hàng (username)
            { username: { [Op.like]: `%${options.search}%` } },
            // Tìm theo email
            { email: { [Op.like]: `%${options.search}%` } },
            // Tìm theo số điện thoại
            { phone: { [Op.like]: `%${options.search}%` } },
          ];

          // Nếu search là số, thêm điều kiện tìm theo ID
          const searchAsNumber = Number(options.search);
          if (!isNaN(searchAsNumber) && searchAsNumber > 0) {
            searchConditions.unshift({ id: searchAsNumber });
          }

          return {
            [Op.or]: searchConditions,
          };
        })()
      : undefined;

    // Build include config for User
    const userInclude: any = {
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'email', 'phone', 'avatar_url'],
    };

    // Add where condition and required flag only when search is provided
    if (userWhere) {
      userInclude.where = userWhere;
      userInclude.required = true; // INNER JOIN khi có search filter
    }

    // Đếm tổng số user (không bị giới hạn bởi limit)
    let total = 0;
    if (options.search) {
      // Nếu có search, cần JOIN với User để filter
      const totalCountResult = (await Order.findOne({
        attributes: [
          [fn('COUNT', fn('DISTINCT', col('Order.user_id'))), 'total'],
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: [],
            where: userWhere,
            required: true,
          },
        ],
        where,
        raw: true,
      })) as unknown as { total: string | number } | null;
      total = toNumber(totalCountResult?.total || 0);
    } else {
      // Nếu không có search, chỉ cần đếm từ Order
      const totalCountResult = (await Order.findOne({
        attributes: [
          [fn('COUNT', fn('DISTINCT', col('Order.user_id'))), 'total'],
        ],
        where,
        raw: true,
      })) as unknown as { total: string | number } | null;
      total = toNumber(totalCountResult?.total || 0);
    }

    const topUsersRaw = (await Order.findAll({
      attributes: [
        'user_id',
        [fn('SUM', col('Order.total_price')), 'totalSpent'],
        [fn('COUNT', col('Order.id')), 'orderCount'],
        [fn('MAX', col('Order.created_at')), 'lastOrderAt'],
      ],
      include: [userInclude],
      where,
      group: ['user_id', 'user.id'],
      order: [[literal('totalSpent'), 'DESC']],
      limit,
      raw: true,
      nest: true,
    })) as unknown as TopUserRow[];

    const data = topUsersRaw.map((row, index) => ({
      rank: index + 1,
      user: row.user,
      totalSpent: toNumber(row.totalSpent),
      orderCount: toNumber(row.orderCount),
      lastOrderAt: row.lastOrderAt,
      averageOrderValue:
        toNumber(row.orderCount) > 0 ? toNumber(row.totalSpent) / toNumber(row.orderCount) : 0,
    }));

    return {
      total,
      data,
    };
  }
}

export default new ReportService();

