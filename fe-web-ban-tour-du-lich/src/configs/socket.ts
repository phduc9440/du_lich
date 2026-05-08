import { io, Socket } from "socket.io-client";

export interface Notification {
  title: string;
  message: string;
  type?: string;
  userId?: number; // optional nếu global
}

export interface Message {
  userId: number;
  content: string;
  from: "user" | "admin";
}

export const socket: Socket = io(import.meta.env.VITE_URL_SERVER!, {
  autoConnect: false,
  transports: ["websocket"],
  auth: {
    token: localStorage.getItem("accessToken"),
  },
});

// Hàm connect socket với userId
export const connectSocket = (userId: number) => {
  if (!userId) return;

  // luôn lấy token mới nhất
  const token = localStorage.getItem("accessToken");

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    socket.emit("register", {
      role: "user",
      userId,
    });
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });
};
socket.on("reconnect_attempt", () => {
  console.log("🔄 Socket reconnecting...");

  socket.auth = {
    token: localStorage.getItem("accessToken")
  };
});
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("Socket disconnected");
  }
};

