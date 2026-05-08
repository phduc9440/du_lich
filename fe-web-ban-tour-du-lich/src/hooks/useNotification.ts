import { useEffect, useState } from "react";
import { socket, type Notification } from "../configs/socket";
import { notification } from "antd";

export function useNotifications(userId: number) {
  const [realtimeNotifications, setRealtimeNotifications] = useState<
    Notification[]
  >([]);
  const [realtimeUnread, setRealtimeUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Connect socket và join room
    socket.connect();
    socket.emit("register", { role: "user", userId });

    const handleNotification = (noti: Notification) => {
      // Chỉ lấy thông báo global hoặc dành cho chính user
      if (!noti.userId || noti.userId === userId) {
        setRealtimeNotifications((prev) => [noti, ...prev]);
        setRealtimeUnread((prev) => prev + 1);
        notification.info({
          message: noti.title,
          description: noti.message,
          placement: "topRight",
        });
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [userId]);

  return { realtimeNotifications, realtimeUnread, setRealtimeUnread };
}
