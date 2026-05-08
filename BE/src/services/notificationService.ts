import { log } from "console";
import { NotificationRead } from "../models";
import Notification from "../models/Notification";
import User from "../models/User";
import socketService from "./socketService";
import { Op } from "sequelize";

class NotificationService {
  // ========== ADMIN GỬI THÔNG BÁO CHO USER ==========

  /**
   * Admin gửi thông báo cho một user cụ thể
   */
  async sendNotificationToUser(
    adminId: number,
    userId: number,
    data: {
      title: string;
      message: string;
      type: "order" | "promotion";
    }
  ) {
    try {
      // Kiểm tra user có tồn tại không
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("Người dùng không tồn tại");
      }

      // Tạo thông báo trong database
      const notification = await Notification.create({
        user_id: userId,
        title: data.title,
        message: data.message,
        type: data.type,
      });

      // Gửi real-time qua socket
      socketService.sendNotificationToUser(userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at,
        sender: "admin",
        admin_id: adminId,
      });

      return notification;
    } catch (error) {
      console.error("❌ Lỗi khi gửi thông báo đến user:", error);
      throw error;
    }
  }

  /**
   * Admin gửi thông báo cho tất cả user
   */
  async sendNotificationToAllUsers(
    adminId: number,
    data: {
      title: string;
      message: string;
      type: "order" | "promotion";
    }
  ) {
    try {
      // Tạo thông báo chung (user_id = null)
      const notification = await Notification.create({
        user_id: null,
        title: data.title,
        message: data.message,
        type: data.type,
      });

      // Gửi real-time đến tất cả user (broadcast)
      socketService.sendNotificationToAllUsers({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at,
        sender: "admin",
        admin_id: adminId,
      });

      return notification;
    } catch (error) {
      console.error("❌ Lỗi khi gửi thông báo đến tất cả user:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách thông báo của user
   */
  async getUserNotifications(userId: number) {
    try {
      // 1. Lấy tất cả notification (riêng + chung)
      const notifications = await Notification.findAll({
        where: {
          [Op.or]: [
            { user_id: userId }, // thông báo riêng
            { user_id: null }, // thông báo chung
          ],
        },
        order: [["created_at", "DESC"]],
      });

      // 2. Lấy danh sách notification user đã đọc
      const readList = await NotificationRead.findAll({
        where: { user_id: userId },
        attributes: ["notification_id", "read_at"],
      });

      // 3. Convert sang Map để check nhanh
      const readMap = new Map(
        readList.map((r) => [r.notification_id, r.read_at])
      );

      // 4. Gắn trạng thái "is_read" cho từng notification (dựa vào read_at)
      const formattedNotifications = notifications.map((noti) => {
        const notiJson = noti.toJSON(); // lấy dữ liệu an toàn
        const read_at = readMap.get(notiJson.id);
        const is_read = read_at !== null && read_at !== undefined;
        return {
          ...notiJson,
          is_read,
          read_at: read_at || null,
        };
      });

      // 5. Đếm số thông báo chưa đọc
      const unreadCount = formattedNotifications.filter(
        (n) => !n.is_read
      ).length;

      return {
        notifications: formattedNotifications,
        unreadCount,
      };
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông báo của user:", error);
      throw error;
    }
  }

  // ========== CẬP NHẬT THÔNG BÁO ==========

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  async markAllNotificationsAsRead(userId: number) {
    try {
      // 1️⃣ Lấy tất cả notification của user (riêng + chung)
      const notifications = await Notification.findAll({
        where: {
          [Op.or]: [
            { user_id: userId }, // thông báo riêng
            { user_id: null }, // thông báo chung
          ],
        },
        attributes: ["id"],
      });
      const notificationIds = notifications.map((n) => n.getDataValue("id"));
      if (notificationIds.length === 0) {
        return { message: "Không có thông báo để đánh dấu." };
      }

      const now = new Date();

      // 2️⃣ Lấy những notification đã tồn tại trong notification_reads
      const existingReads = await NotificationRead.findAll({
        where: {
          user_id: userId,
          notification_id: { [Op.in]: notificationIds },
        },
        attributes: ["notification_id"],
      });

      const existingIds = existingReads.map((r) => r.notification_id);

      // 3️⃣ Tạo mới những notification chưa có trong notification_reads
      const newRecords = notificationIds
        .filter((id) => !existingIds.includes(id))
        .map((id) => ({
          user_id: userId,
          notification_id: id,
          read_at: now,
        }));
      console.log(newRecords);

      if (newRecords.length > 0) {
        await NotificationRead.bulkCreate(newRecords, {
          validate: true,
          ignoreDuplicates: false,
        });
      }

      // 4️⃣ Cập nhật những notification đã tồn tại
      if (existingIds.length > 0) {
        await NotificationRead.update(
          { read_at: now },
          {
            where: {
              user_id: userId,
              notification_id: { [Op.in]: existingIds },
            },
          }
        );
      }

      return { message: "Đã đánh dấu tất cả thông báo là đã đọc." };
    } catch (error) {
      console.error("❌ Lỗi khi đánh dấu thông báo:", error);
      throw error;
    }
  }
}

export default new NotificationService();
