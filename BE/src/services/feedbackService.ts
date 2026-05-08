import Feedback from '../models/Feedback';
import User from '../models/User';
import { Op } from 'sequelize';

export interface CreateFeedbackDTO {
  user_id: number;
  title?: string;
  message?: string;
}

class FeedbackService {
  // Tạo feedback mới (user)
  async createFeedback(data: CreateFeedbackDTO) {
    const feedback = await Feedback.create({
      user_id: data.user_id,
      title: data.title || null,
      message: data.message || null,
      status: 'pending',
    });

    // Lấy thông tin user
    const user = await User.findByPk(data.user_id, {
      attributes: ['id', 'username', 'email'],
    });

    return {
      ...feedback.toJSON(),
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
      } : null,
    };
  }

  // Admin đổi trạng thái từ pending sang cancelled
  async markCancelled(feedbackId: number) {
    const feedback = await Feedback.findByPk(feedbackId);

    if (!feedback) {
      throw new Error('Feedback không tồn tại');
    }

    if (feedback.status !== 'pending') {
      throw new Error('Chỉ có thể hủy feedback có trạng thái pending');
    }

    feedback.status = 'cancelled';
    await feedback.save();

    // Lấy thông tin user
    const user = await User.findByPk(feedback.user_id, {
      attributes: ['id', 'username', 'email'],
    });

    return {
      ...feedback.toJSON(),
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
      } : null,
    };
  }

  // Admin lấy danh sách feedback với tìm kiếm và phân trang
  async getAllFeedbacks(
    page: number = 1,
    limit: number = 10,
    search?: string
  ) {
    const offset = (page - 1) * limit;

    // Xây dựng where clause cho feedback
    const feedbackWhere: any = {};

    // Xây dựng where clause cho user (nếu có search)
    const userWhere: any = {};
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      userWhere[Op.or] = [
        { username: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
      ];
    }

    // Query với include User
    const include: any[] = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email'],
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        required: Object.keys(userWhere).length > 0, // INNER JOIN nếu có search, LEFT JOIN nếu không
      },
    ];

    const { rows: feedbacks, count: total } = await Feedback.findAndCountAll({
      where: feedbackWhere,
      include: include,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true, // Quan trọng khi có include để count đúng
    });

    // Format response
    const formattedFeedbacks = feedbacks.map((feedback) => {
      const feedbackData = feedback.toJSON();
      return {
        ...feedbackData,
        user: feedbackData.user || null,
      };
    });

    return {
      feedbacks: formattedFeedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new FeedbackService();