import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import Order from '../models/Order';
import User from '../models/User';
import Tour from '../models/Tour';
import Ticket from '../models/Ticket';
import Admin from '../models/Admin';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

const formatCurrency = (value: number | string) => {
  const numberValue = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numberValue || 0);
};

const formatDate = (value: Date | string | undefined | null) => {
  if (!value) return 'Đang cập nhật';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Đang cập nhật';
  }
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const createTransporter = async () => {
  if (!process.env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM chưa được cấu hình');
  }

  const accessTokenResponse = await oauth2Client.getAccessToken();
  const token =
    typeof accessTokenResponse === 'string'
      ? accessTokenResponse
      : accessTokenResponse?.token;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_FROM,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: token ?? undefined,
    },
  });
};

// Helper function để lấy dữ liệu cơ bản của order
const getOrderDetails = async (orderId: number) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    throw new Error('Không tìm thấy đơn hàng');
  }

  // Validate user_id và tour_id trước khi query
  if (!order.user_id || typeof order.user_id !== 'number' || order.user_id <= 0) {
    throw new Error('ID người dùng không hợp lệ');
  }
  if (!order.tour_id || typeof order.tour_id !== 'number' || order.tour_id <= 0) {
    throw new Error('ID tour không hợp lệ');
  }

  const userId = order.user_id;
  const tourId = order.tour_id;
  
  if (!userId || !tourId) {
    throw new Error('Đơn hàng thiếu thông tin user_id hoặc tour_id');
  }

  const [user, tour, tickets] = await Promise.all([
    User.findByPk(userId),
    Tour.findByPk(tourId),
    Ticket.findAll({ where: { order_id: order.id } }),
  ]);

  if (!user) {
    throw new Error('Không tìm thấy người dùng của đơn hàng');
  }

  if (!tour) {
    throw new Error('Không tìm thấy tour của đơn hàng');
  }

  return { order, user, tour, tickets };
};

// Helper function để tạo HTML bảng vé
const createTicketTableHTML = (tickets: Ticket[], emptyMessage: string = 'Vé của bạn sẽ được cập nhật trong ít phút.') => {
  const mapTicketValue = <T>(ticket: Ticket, key: keyof Ticket | string) => {
    const directValue = (ticket as any)[key];
    if (directValue !== undefined && directValue !== null) {
      return directValue as T;
    }
    if (typeof (ticket as any).getDataValue === 'function') {
      return (ticket as any).getDataValue(key) as T;
    }
    return undefined;
  };

  const ticketRows = tickets.length > 0
    ? tickets
        .map((ticket, index) => {
          const ticketCode =
            mapTicketValue<string>(ticket, 'ticket_code') || `VE-${ticket.id}`;
          const validFrom = mapTicketValue<Date | string>(ticket, 'valid_from');
          const validUntil = mapTicketValue<Date | string>(
            ticket,
            'valid_until'
          );

          return `
        <tr>
          <td>${index + 1}</td>
          <td>${ticketCode}</td>
          <td>${formatDate(validFrom)}</td>
          <td>${formatDate(validUntil)}</td>
        </tr>
      `;
        })
        .join('')
    : `
        <tr>
          <td colspan="4">${emptyMessage}</td>
        </tr>
      `;

  return `
    <table style="width:100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="border:1px solid #ddd; padding:8px;">#</th>
          <th style="border:1px solid #ddd; padding:8px;">Mã vé</th>
          <th style="border:1px solid #ddd; padding:8px;">Hiệu lực từ</th>
          <th style="border:1px solid #ddd; padding:8px;">Hiệu lực đến</th>
        </tr>
      </thead>
      <tbody>
        ${ticketRows}
      </tbody>
    </table>
  `;
};

export const sendPaymentConfirmationEmail = async (orderId: number) => {
  const { order, user, tour, tickets } = await getOrderDetails(orderId);

  // Lấy thông tin hướng dẫn viên nếu có
  let guide = null;
  if (order.guide_id && typeof order.guide_id === 'number' && order.guide_id > 0) {
    guide = await Admin.findByPk(order.guide_id);
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Thanh toán thành công đơn hàng #${order.order_code || order.id}</h2>
      <p>Xin chào ${user.username},</p>
      <p>Cảm ơn bạn đã thanh toán đơn hàng tour <strong>${tour.title}</strong>. Dưới đây là thông tin chi tiết:</p>

      <h3>Thông tin tour</h3>
      <ul>
        <li>Điểm đến: <strong>${tour.destination || 'Đang cập nhật'}</strong></li>
        <li>Điểm xuất phát: <strong>${tour.departure}</strong></li>
        <li>Thời gian: <strong>${formatDate(tour.start_date)} - ${formatDate(tour.end_date)}</strong></li>
        <li>Thời gian xuất phát: <strong>7:30 sáng</strong></li>
        <li>Số vé đã mua: <strong>${order.quantity}</strong></li>
        <li>Đơn giá: <strong>${formatCurrency(tour.price)}</strong></li>

      </ul>

      <h3>Thông tin hướng dẫn viên</h3>
      ${guide ? `
      <ul>
        <li>Tên: <strong>${guide.username || guide.username || 'Đang cập nhật'}</strong></li>
        <li>Email: <strong>${guide.email || 'Đang cập nhật'}</strong></li>
        <li>Số điện thoại: <strong>${guide.phone || 'Đang cập nhật'}</strong></li>
      </ul>
      ` : '<p><em>Hướng dẫn viên sẽ được cập nhật trong ít phút.</em></p>'}

      <h3>Thông tin vé</h3>
      ${createTicketTableHTML(tickets)}

      <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng phản hồi email này hoặc liên hệ bộ phận hỗ trợ khách hàng.</p>
      <p>Chúc bạn có một chuyến đi tuyệt vời!<br/>Đội ngũ Tour du lịch hú hí</p>
    </div>
  `;

  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Xác nhận thanh toán thành công - ${tour.title}`,
    html: htmlContent,
  });
};

export const sendCancellationEmail = async (orderId: number) => {
  const { order, user, tour, tickets } = await getOrderDetails(orderId);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2 style="color: #e74c3c;">Đơn hàng đã bị hủy</h2>
      <p>Xin chào ${user.username},</p>
      <p style="color: #e74c3c; font-weight: bold;">Đơn hàng của bạn với mã <strong>${order.order_code || order.id}</strong> đã bị hủy thành công.</p>

      <h3>Thông tin tour đã hủy</h3>
      <ul>
        <li>Tên tour: <strong>${tour.title}</strong></li>
        <li>Điểm đến: <strong>${tour.destination || 'Đang cập nhật'}</strong></li>
        <li>Điểm xuất phát: <strong>${tour.departure}</strong></li>
        <li>Thời gian: <strong>${formatDate(tour.start_date)} - ${formatDate(tour.end_date)}</strong></li>
        <li>Số vé đã đặt: <strong>${order.quantity}</strong></li>
        <li>Tổng tiền: <strong>${formatCurrency(order.total_price)}</strong></li>
      </ul>

      <h3>Thông tin vé đã hủy</h3>
      ${createTicketTableHTML(tickets, 'Không có vé nào được tạo cho đơn hàng này.')}

      <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng phản hồi email này hoặc liên hệ bộ phận hỗ trợ khách hàng.</p>
      <p>Rất tiếc về sự bất tiện này.<br/>Đội ngũ Tour du lịch hú hí</p>
    </div>
  `;

  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Đơn hàng đã bị hủy - ${order.order_code || order.id}`,
    html: htmlContent,
  });
};

export default {
  sendPaymentConfirmationEmail,
  sendCancellationEmail,
};

